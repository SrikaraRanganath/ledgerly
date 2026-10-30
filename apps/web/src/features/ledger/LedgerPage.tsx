import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useDebounced } from '@/features/pos/hooks/useDebounced'
import { useAccounts, useLedger, useLedgerSummary } from './api'
import FilterBar from './components/FilterBar'
import LedgerGrid from './components/LedgerGrid'
import SummaryBar from './components/SummaryBar'
import { useLedgerFilters } from './hooks/useLedgerFilters'

export default function LedgerPage() {
  const { t } = useTranslation()
  const { filters, update } = useLedgerFilters()
  const q = useDebounced(filters.q, 250)
  const applied = useMemo(() => ({ ...filters, q }), [filters, q])

  const accounts = useAccounts()
  const ledger = useLedger(applied)
  const summary = useLedgerSummary(applied)
  const rows = useMemo(() => ledger.data?.pages.flatMap((p) => p.rows) ?? [], [ledger.data])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('ledger.title')}</h1>
      <FilterBar filters={filters} accounts={accounts.data ?? []} update={update} />
      <SummaryBar s={summary.data} whole={!applied.accountId && !applied.q} />
      {ledger.isError ? (
        <div className="rounded-lg border border-destructive p-4 text-sm">
          {t('ledger.loadError')}{' '}
          <Button variant="link" onClick={() => ledger.refetch()}>{t('ledger.retry')}</Button>
        </div>
      ) : (
        <LedgerGrid
          rows={rows}
          total={summary.data?.n}
          loading={ledger.isPending}
          hasMore={!!ledger.hasNextPage}
          loadingMore={ledger.isFetchingNextPage}
          onLoadMore={() => ledger.fetchNextPage()}
          order={filters.order}
          onToggleOrder={() => update({ order: filters.order === 'desc' ? 'asc' : undefined })}
          resetKey={JSON.stringify(applied)}
        />
      )}
    </div>
  )
}