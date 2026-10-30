import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { formatHalalas } from '@/lib/format'

type Props = { subtotal: number; vatTotal: number; total: number; disabled: boolean; onPay: () => void }

export default function TotalsPanel({ subtotal, vatTotal, total, disabled, onPay }: Props) {
  const { t, i18n } = useTranslation()
  const f = (n: number) => formatHalalas(n, i18n.language)
  return (
    <div className="space-y-2 rounded-lg border bg-card p-4">
      <Row label={t('pos.subtotal')} value={f(subtotal)} />
      <Row label={t('pos.vat')} value={f(vatTotal)} />
      <div className="flex items-center justify-between border-t pt-2 text-lg font-semibold">
        <span>{t('pos.total')}</span>
        <span className="tabular-nums">{f(total)}</span>
      </div>
      <Button className="mt-2 w-full" size="lg" disabled={disabled} onClick={onPay}>
        {t('pos.pay')} <kbd className="ms-2 rounded border px-1 text-xs">F9</kbd>
      </Button>
    </div>
  )
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-muted-foreground">
      <span>{label}</span><span className="tabular-nums">{value}</span>
    </div>
  )
}