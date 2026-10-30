import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export type Filters = { accountId?: number; from?: string; to?: string; q: string; order: 'asc' | 'desc' }
type Patch = Partial<Record<'account' | 'from' | 'to' | 'q' | 'order', string | undefined>>

export function useLedgerFilters() {
  const [params, setParams] = useSearchParams()
  const filters: Filters = useMemo(() => ({
    accountId: params.get('account') ? Number(params.get('account')) : undefined,
    from: params.get('from') ?? undefined,
    to: params.get('to') ?? undefined,
    q: params.get('q') ?? '',
    order: params.get('order') === 'asc' ? 'asc' : 'desc',
  }), [params])

  const update = (patch: Patch) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k)
      return next
    }, { replace: true })

  return { filters, update }
}