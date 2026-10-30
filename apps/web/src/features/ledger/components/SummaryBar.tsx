import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { formatHalalas } from '@/lib/format'
import type { LedgerSummary } from '../types'

export default function SummaryBar({ s, whole }: { s?: LedgerSummary; whole: boolean }) {
  const { t, i18n } = useTranslation()
  if (!s) return <div className="h-6" />
  const f = (n: number) => formatHalalas(n, i18n.language)
  const diff = s.debit - s.credit
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
      <span>{t('ledger.entries')}: <b className="tabular-nums">{s.n.toLocaleString('en-US')}</b></span>
      <span>{t('ledger.debit')}: <b className="tabular-nums">{f(s.debit)}</b></span>
      <span>{t('ledger.credit')}: <b className="tabular-nums">{f(s.credit)}</b></span>
      {whole
        ? diff === 0
          ? <Badge className="bg-green-600">{t('ledger.balanced')}</Badge>
          : <Badge variant="destructive">{t('ledger.outOfBalance', { amount: f(Math.abs(diff)) })}</Badge>
        : <span>{t('ledger.net')}: <b className="tabular-nums">{f(diff)}</b></span>}
    </div>
  )
}