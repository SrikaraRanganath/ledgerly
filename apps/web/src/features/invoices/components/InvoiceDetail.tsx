import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { tlvDecode } from '@ledgerly/shared'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDateTime, formatHalalas } from '@/lib/format'
import { useInvoice, useRetry, useTamper } from '../api'
import StatusBadge from './StatusBadge'
import { DEMO } from '@/lib/demo'

function HashRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="mb-1 text-muted-foreground">{label}</div>
      <code dir="ltr" title={value ?? ''} className="block truncate rounded bg-muted px-2 py-1">{value ?? '-'}</code>
    </div>
  )
}

export default function InvoiceDetail({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { data: inv } = useInvoice(id)
  const retry = useRetry()
  const tamper = useTamper()

  const qrFields = useMemo(() => {
    try { return inv?.qr ? tlvDecode(inv.qr) : [] } catch { return [] }
  }, [inv?.qr])

  return (
    <Sheet open={id != null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side={i18n.dir() === 'rtl' ? 'left' : 'right'} className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle><bdi>{inv?.number ?? '…'}</bdi></SheetTitle>
          <SheetDescription>{t('invoices.simulated')}</SheetDescription>
        </SheetHeader>

        {inv && (
          <div className="space-y-5 px-4 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={inv.status} />
              <span className="text-sm text-muted-foreground">{t(`invoices.type.${inv.type}`)}</span>
              <span className="ms-auto text-lg font-semibold tabular-nums">{formatHalalas(inv.total, lang)}</span>
            </div>

            {inv.status === 'rejected' && (
              <div role="alert" className="rounded-lg border border-destructive p-3 text-sm">
                <b><bdi>{inv.rejectionCode}</bdi></b>: {inv.rejectionMessage}
                <p className="mt-1 text-xs text-muted-foreground">{t('invoices.rejectedNote')}</p>
              </div>
            )}

            {inv.status === 'pending' && (
              <div className="space-y-2 rounded-lg border border-amber-500 p-3 text-sm">
                <p>{t(inv.type === 'standard' ? 'invoices.pendingB2B' : 'invoices.pendingB2C')}</p>
                {inv.attempts > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t('invoices.attempts', { n: inv.attempts })}
                    {inv.nextRetryAt && <> · {t('invoices.nextRetry', { time: formatDateTime(inv.nextRetryAt, lang) })}</>}
                  </p>
                )}
                <Button size="sm" disabled={retry.isPending} onClick={() => retry.mutate(inv.id)}>
                  {t('invoices.retryNow')}
                </Button>
              </div>
            )}

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">{t('invoices.date')}</dt>
              <dd><bdi>{formatDateTime(inv.issuedAt, lang)}</bdi></dd>
              <dt className="text-muted-foreground">{t('invoices.vat')}</dt>
              <dd className="tabular-nums">{formatHalalas(inv.vatTotal, lang)}</dd>
              {inv.buyerName && (<><dt className="text-muted-foreground">{t('invoices.buyer')}</dt>
                <dd><bdi>{inv.buyerName}</bdi> · <bdi>{inv.buyerVat}</bdi></dd></>)}
              <dt className="text-muted-foreground">UUID</dt>
              <dd><code dir="ltr" className="text-xs">{inv.uuid}</code></dd>
            </dl>

            <section className="space-y-2">
              <h3 className="text-sm font-medium">{t('invoices.hashChain')}</h3>
              <div className="space-y-2 rounded-lg border p-3 text-xs">
                <HashRow label={t('invoices.previousHash')} value={inv.previousHash} />
                <div className="text-center text-muted-foreground">↓ ICV <bdi>{inv.icv}</bdi></div>
                <HashRow label={t('invoices.invoiceHash')} value={inv.invoiceHash} />
              </div>
              {DEMO && (
                <Button size="sm" variant="outline" disabled={tamper.isPending}
                        onClick={() => tamper.mutate(inv.id, { onSuccess: () => toast(t('invoices.dev.tampered')) })}>
                  {t('invoices.dev.tamper')}
                </Button>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-medium">{t('invoices.timeline')}</h3>
              <ol className="space-y-3 border-s ps-4">
                {inv.events.map((e) => (
                  <li key={e.id} className="relative text-sm">
                    <span className="absolute -start-[21px] top-1.5 size-2 rounded-full bg-primary" />
                    <div className="font-medium">{t(`invoices.event.${e.type}`)}</div>
                    <div className="text-xs text-muted-foreground">
                      <bdi>{formatDateTime(e.at, lang)}</bdi>{e.detail && <> · <bdi>{e.detail}</bdi></>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <Tabs defaultValue="qr" dir={i18n.dir()}>
              <TabsList>
                <TabsTrigger value="qr">QR</TabsTrigger>
                <TabsTrigger value="xml">XML</TabsTrigger>
              </TabsList>
              <TabsContent value="qr" className="space-y-3">
                {inv.qr && (
                  <div className="inline-block rounded bg-white p-2">
                    <QRCodeSVG value={inv.qr} size={168} level="M" bgColor="#ffffff" fgColor="#000000" />
                  </div>
                )}
                <table className="w-full text-xs">
                  <tbody>
                    {qrFields.map((f) => (
                      <tr key={f.tag} className="border-t">
                        <td className="py-1 pe-2 text-muted-foreground">{f.tag} · {t(`invoices.qrTag.${f.tag}`)}</td>
                        <td className="break-all py-1"><bdi>{f.value}</bdi></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TabsContent>
              <TabsContent value="xml">
                <pre dir="ltr" className="max-h-96 overflow-auto rounded bg-muted p-3 text-start text-xs">{inv.xml}</pre>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}