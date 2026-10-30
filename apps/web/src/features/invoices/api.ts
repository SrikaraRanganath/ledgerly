import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ChainResult, GatewayMode, InvoiceDetail, InvoiceRow, InvoiceStatus } from './types'
import { DEMO } from '@/lib/demo'

// Poll every 2s while anything is pending; stop when everything has settled
export function useInvoiceList(status: InvoiceStatus | 'all') {
  return useQuery({
    queryKey: ['invoices', 'list', status],
    queryFn: () => api<InvoiceRow[]>(`/api/invoices${status === 'all' ? '' : `?status=${status}`}`),
    refetchInterval: (q) => (q.state.data?.some((i) => i.status === 'pending') ? 2000 : false),
  })
}

export function useInvoice(id: number | null) {
  return useQuery({
    queryKey: ['invoices', 'detail', id],
    queryFn: () => api<InvoiceDetail>(`/api/invoices/${id}`),
    enabled: id != null,
    refetchInterval: (q) => (q.state.data?.status === 'pending' ? 2000 : false),
  })
}

export function useRetry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<InvoiceRow>(`/api/invoices/${id}/retry`, { method: 'POST' }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

export const useVerifyChain = () =>
  useMutation({ mutationFn: () => api<ChainResult>('/api/invoices/verify-chain') })

export const useGatewayMode = () =>
  useQuery({ queryKey: ['zatca-mode'], queryFn: () => api<{ mode: GatewayMode }>('/api/dev/zatca-mode'), enabled: DEMO })

export function useSetGatewayMode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (mode: GatewayMode) => api('/api/dev/zatca-mode', { method: 'PUT', body: JSON.stringify({ mode }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zatca-mode'] }),
  })
}

export function useTamper() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/api/dev/tamper/${id}`, { method: 'POST' }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}