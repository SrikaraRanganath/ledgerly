import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/lib/format'

export default function Overview() {
  const { t, i18n } = useTranslation()
  const cards = [
    { label: t('overview.sales'), value: formatMoney(12480, i18n.language) },
    { label: t('overview.cleared'), value: '42' },
    { label: t('overview.vat'), value: formatMoney(1872, i18n.language) },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">{c.label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</div>
        </div>
      ))}
    </div>
  )
}