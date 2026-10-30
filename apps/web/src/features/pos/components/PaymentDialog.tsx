import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Payment } from '@ledgerly/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatHalalas } from '@/lib/format'

type Props = { open: boolean; total: number; onOpenChange: (o: boolean) => void; onConfirm: (p: Payment[]) => void }

const toHalalas = (v: string) => Math.round((parseFloat(v) || 0) * 100)

export default function PaymentDialog({ open, total, onOpenChange, onConfirm }: Props) {
  const { t, i18n } = useTranslation()
  const [cash, setCash] = useState('')
  const [card, setCard] = useState('')
  useEffect(() => { if (open) { setCash(''); setCard('') } }, [open])

  const paid = toHalalas(cash) + toHalalas(card)
  const remaining = total - paid
  const valid = paid > 0 && remaining === 0
  const f = (n: number) => formatHalalas(n, i18n.language)

  function submit() {
    if (!valid) return
    const payments: Payment[] = []
    if (toHalalas(cash) > 0) payments.push({ method: 'cash', amount: toHalalas(cash) })
    if (toHalalas(card) > 0) payments.push({ method: 'card', amount: toHalalas(card) })
    onConfirm(payments)
  }
  const full = (setter: (v: string) => void, other: (v: string) => void) => () => {
    setter((total / 100).toFixed(2)); other('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onKeyDown={(e) => { if (e.key === 'Enter') submit() }}>
        <DialogHeader><DialogTitle>{t('pos.payTitle')}</DialogTitle></DialogHeader>
        <div className="text-2xl font-semibold tabular-nums">{f(total)}</div>
        {[
          { id: 'cash', label: t('pos.cash'), value: cash, set: setCash, other: setCard },
          { id: 'card', label: t('pos.card'), value: card, set: setCard, other: setCash },
        ].map((r) => (
          <div key={r.id} className="space-y-1">
            <Label htmlFor={r.id}>{r.label}</Label>
            <div className="flex gap-2">
              <Input id={r.id} inputMode="decimal" className="text-end tabular-nums" value={r.value}
                     onChange={(e) => r.set(e.target.value)} />
              <Button type="button" variant="outline" onClick={full(r.set, r.other)}>{t('pos.full')}</Button>
            </div>
          </div>
        ))}
        <div className={remaining === 0 ? 'text-sm text-green-600' : 'text-sm text-muted-foreground'}>
          {t('pos.remaining')}: <span className="tabular-nums">{f(remaining)}</span>
        </div>
        <DialogFooter>
          <Button disabled={!valid} onClick={submit}>{t('pos.confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}