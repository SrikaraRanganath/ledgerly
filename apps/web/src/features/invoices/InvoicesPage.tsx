import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDateTime, formatHalalas } from '@/lib/format'
import { useInvoiceList, useVerifyChain } from './api'
import DevPanel from './components/DevPanel'
import InvoiceDetail from './components/InvoiceDetail'
import StatusBadge from './components/StatusBadge'

const FILTERS = ['all', 'pending', 'cleared', 'reported', 'rejected'] as const

export default function InvoicesPage() {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState<(typeof FILTERS)[number]>('all')
  const [openId, setOpenId] = useState<number | null>(null)
  const list = useInvoiceList(status)
  const verify = useVerifyChain()

  function onVerify() {
    verify.mutate(undefined, {
      onSuccess: (r) =>
        r.ok
          ? toast.success(t('invoices.chainOk', { n: r.checked }))
          : toast.error(t('invoices.chainBroken', { number: r.brokenAt, reason: r.reason })),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t('invoices.title')}</h1>
        <Button variant="outline" disabled={verify.isPending} onClick={onVerify}>{t('invoices.verify')}</Button>
      </div>

      <DevPanel />

      <Tabs value={status} onValueChange={(v) => setStatus(v as (typeof FILTERS)[number])} dir={i18n.dir()}>
        <TabsList>
          {FILTERS.map((s) => (
            <TabsTrigger key={s} value={s}>{s === 'all' ? t('invoices.all') : t(`invoices.status.${s}`)}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {list.isError && <p className="text-sm text-destructive">{t('invoices.loadError')}</p>}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs text-muted-foreground">
            <tr>
              <th className="p-3 text-start font-medium">{t('invoices.number')}</th>
              <th className="p-3 text-start font-medium">{t('invoices.date')}</th>
              <th className="p-3 text-start font-medium">{t('invoices.typeCol')}</th>
              <th className="p-3 text-end font-medium">{t('invoices.total')}</th>
              <th className="p-3 text-start font-medium">{t('invoices.statusCol')}</th>
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((inv) => (
              <tr key={inv.id} className="cursor-pointer border-t hover:bg-accent/50" onClick={() => setOpenId(inv.id)}>
                <td className="p-3">
                  <button type="button" className="font-mono text-xs hover:underline" onClick={() => setOpenId(inv.id)}>
                    <bdi>{inv.number}</bdi>
                  </button>
                </td>
                <td className="p-3"><bdi>{formatDateTime(inv.issuedAt, i18n.language)}</bdi></td>
                <td className="p-3">{t(`invoices.type.${inv.type}`)}</td>
                <td className="p-3 text-end tabular-nums">{formatHalalas(inv.total, i18n.language)}</td>
                <td className="p-3"><StatusBadge status={inv.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.data?.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">{t('invoices.empty')}</p>}
      </div>

      <InvoiceDetail id={openId} onClose={() => setOpenId(null)} />
    </div>
  )
}