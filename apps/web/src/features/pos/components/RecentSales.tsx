import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { formatHalalas } from '@/lib/format'
import { useInvoices } from '../api'

export default function RecentSales() {
  const { t, i18n } = useTranslation()
  const { data } = useInvoices()
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium">{t('pos.recent')}</h2>
      <ul className="divide-y rounded-lg border text-sm">
        {(data ?? []).slice(0, 5).map((inv) => (
          <li key={inv.id} className="flex items-center justify-between p-2">
            <span className="tabular-nums">{inv.id < 0 ? t('pos.saving') : inv.number}</span>
            <span className="flex items-center gap-2">
              <span className="tabular-nums">{formatHalalas(inv.total, i18n.language)}</span>
              <Badge variant="secondary">{inv.status}</Badge>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}