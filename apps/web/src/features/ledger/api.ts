import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Filters } from './hooks/useLedgerFilters'
import type { Account, LedgerPageResult, LedgerSummary } from './types'

// Day boundaries in Saudi time (UTC+3, no DST)
function toQuery(f: Filters, extra: Record<string, string | undefined> = {}) {
  const p = new URLSearchParams() // encodes % as %25 etc. for us
  if (f.accountId) p.set('accountId', String(f.accountId))
  if (f.from) p.set('from', String(new Date(`${f.from}T00:00:00+03:00`).getTime()))
  if (f.to) p.set('to', String(new Date(`${f.to}T23:59:59.999+03:00`).getTime()))
  if (f.q) p.set('q', f.q)
  p.set('order', f.order)
  for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v)
  return p.toString()
}

export const useAccounts = () =>
  useQuery({ queryKey: ['accounts'], queryFn: () => api<Account[]>('/api/accounts'), staleTime: Infinity })

export function useLedger(f: Filters) {
  return useInfiniteQuery({
    queryKey: ['ledger', f],
    queryFn: ({ pageParam }) =>
      api<LedgerPageResult>(`/api/ledger?${toQuery(f, { limit: '100', cursor: pageParam })}`),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
}

export function useLedgerSummary(f: Filters) {
  return useQuery({
    queryKey: ['ledger-summary', f],
    queryFn: () => api<LedgerSummary>(`/api/ledger/summary?${toQuery(f)}`),
    placeholderData: keepPreviousData,
  })
}