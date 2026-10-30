import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CheckoutInput } from '@ledgerly/shared'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Invoice, Product } from './types'

export function useProducts(q: string) {
  return useQuery({
    queryKey: ['products', q],
    queryFn: () => api<Product[]>(`/api/products?q=${encodeURIComponent(q)}`),
    placeholderData: keepPreviousData,
  })
}

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: () => api<Invoice[]>('/api/invoices'),
    refetchInterval: (q) => (q.state.data?.some((i) => i.status === 'pending') ? 2000 : false),
  })
}

type Vars = { input: CheckoutInput; total: number }

export function useCheckout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ input }: Vars) =>
      api<Invoice>('/api/invoices', { method: 'POST', body: JSON.stringify(input) }),

    // Runs immediately, before the server answers
    onMutate: async ({ input, total }) => {
      await qc.cancelQueries({ queryKey: ['invoices'] })
      await qc.cancelQueries({ queryKey: ['products'] })
      const prevInvoices = qc.getQueryData<Invoice[]>(['invoices'])
      const prevProducts = qc.getQueriesData<Product[]>({ queryKey: ['products'] })

      const temp: Invoice = {
        id: -Date.now(), uuid: '', number: '…', customerId: null,
        issuedAt: Date.now(), subtotal: 0, vatTotal: 0, total, status: 'pending',
      }
      qc.setQueryData<Invoice[]>(['invoices'], (old) => [temp, ...(old ?? [])])
      qc.setQueriesData<Product[]>({ queryKey: ['products'] }, (old) =>
        old?.map((p) => {
          const item = input.items.find((i) => i.productId === p.id)
          return item ? { ...p, stock: p.stock - item.qty } : p
        }),
      )
      return { prevInvoices, prevProducts }
    },

    // If the server says no, put everything back
    onError: (err, _vars, ctx) => {
      ctx?.prevProducts.forEach(([key, data]) => qc.setQueryData(key, data))
      qc.setQueryData(['invoices'], ctx?.prevInvoices)
      toast.error(err.message)
    },
    onSuccess: (inv) => toast.success(inv.number),

    // Either way, re-sync with the truth on the server
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['ledger'] })
      qc.invalidateQueries({ queryKey: ['ledger-summary'] })
      qc.invalidateQueries({ queryKey: ['overview'] })
    },
  })
}