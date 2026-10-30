import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { formatHalalas } from '@/lib/format'

type OverviewData = {
  days: { date: string; net: number; vat: number }[]
  statusCounts: Record<string, number>
  lowStock: { id: number; sku: string; nameEn: string; nameAr: string; stock: number }[]
}

function Card({ label, value, to, tone }: { label: string; value: string; to?: string; tone?: 'warn' | 'bad' }) {
  const body = (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${tone === 'bad' ? 'text-destructive' : tone === 'warn' ? 'text-amber-600' : ''}`}>
        {value}
      </div>
    </div>
  )
  return to ? <Link to={to} className="block hover:opacity-80">{body}</Link> : body
}

export default function Overview() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['overview'],
    queryFn: () => api<OverviewData>('/api/overview'),
  })

  if (isPending) return <p className="text-sm text-muted-foreground">{t('dashboard.loading')}</p>
  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {t('dashboard.error')}{' '}
        <button className="underline" onClick={() => refetch()}>{t('dashboard.retry')}</button>
      </p>
    )
  }

  const today = data.days.at(-1)!
  const sum = (k: 'net' | 'vat') => data.days.reduce((s, d) => s + d[k], 0)
  const max = Math.max(1, ...data.days.map((d) => d.net))
  const pending = data.statusCounts.pending ?? 0
  const rejected = data.statusCounts.rejected ?? 0

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t('dashboard.title')}</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label={t('dashboard.salesToday')} value={formatHalalas(today.net, lang)} />
        <Card label={t('dashboard.sales30')} value={formatHalalas(sum('net'), lang)} to="/ledger" />
        <Card label={t('dashboard.vat30')} value={formatHalalas(sum('vat'), lang)} />
        <Card label={t('dashboard.pending')} value={`${pending}${rejected ? ` · ${rejected} ${t('dashboard.rejected')}` : ''}`}
              to="/invoices" tone={rejected ? 'bad' : pending ? 'warn' : undefined} />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">{t('dashboard.trend')}</h2>
        {/* The time axis stays left-to-right even in Arabic */}
        <div dir="ltr" role="img" aria-label={t('dashboard.trend')} className="flex h-40 items-end gap-1 rounded-lg border p-3">
          {data.days.map((d) => (
            <div key={d.date} className="flex-1 rounded-t bg-primary/80 hover:bg-primary"
                 style={{ height: `${Math.max(2, (d.net / max) * 100)}%` }}
                 title={`${d.date}: ${formatHalalas(d.net, lang)}`} />
          ))}
        </div>
        <div dir="ltr" className="flex justify-between text-xs text-muted-foreground">
          <span>{data.days[0].date.slice(5)}</span><span>{today.date.slice(5)}</span>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">{t('dashboard.lowStock')}</h2>
        {data.lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('dashboard.noLow')}</p>
        ) : (
          <ul className="divide-y rounded-lg border text-sm">
            {data.lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-3">
                <span>{lang === 'ar' ? p.nameAr : p.nameEn} <bdi className="text-xs text-muted-foreground">{p.sku}</bdi></span>
                <span className="tabular-nums">{p.stock}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}