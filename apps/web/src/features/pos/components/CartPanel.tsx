import { Minus, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { lineAmounts } from '@ledgerly/shared'
import { Button } from '@/components/ui/button'
import { formatHalalas } from '@/lib/format'
import { cn } from '@/lib/utils'
import { productName } from '../types'
import type { CartLine } from '../hooks/useCart'

type Props = {
  lines: CartLine[]; selectedId: number | null
  onSelect: (id: number) => void; onChange: (id: number, d: number) => void; onRemove: (id: number) => void
}

export default function CartPanel({ lines, selectedId, onSelect, onChange, onRemove }: Props) {
  const { t, i18n } = useTranslation()
  if (!lines.length) {
    return <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">{t('pos.empty')}</div>
  }
  return (
    <ul role="listbox" aria-label={t('pos.cart')} className="divide-y rounded-lg border">
      {lines.map((l) => {
        const selected = l.product.id === selectedId
        return (
          <li
            key={l.product.id}
            role="option"
            aria-selected={selected}
            onClick={() => onSelect(l.product.id)}
            className={cn('flex items-center gap-3 p-3', selected && 'bg-accent')}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{productName(l.product, i18n.language)}</div>
              <div className="text-xs tabular-nums text-muted-foreground">
                {formatHalalas(l.product.priceHalalas, i18n.language)}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="size-7" aria-label="−" onClick={() => onChange(l.product.id, -1)}>
                <Minus className="size-3" />
              </Button>
              <span className="w-7 text-center text-sm tabular-nums">{l.qty}</span>
              <Button size="icon" variant="outline" className="size-7" aria-label="+" onClick={() => onChange(l.product.id, 1)}>
                <Plus className="size-3" />
              </Button>
            </div>
            <div className="w-24 text-end text-sm tabular-nums">
              {formatHalalas(lineAmounts({ priceHalalas: l.product.priceHalalas, vatRate: l.product.vatRate, qty: l.qty }).total, i18n.language)}
            </div>
            <Button size="icon" variant="ghost" className="size-7" aria-label={t('pos.remove')} onClick={() => onRemove(l.product.id)}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        )
      })}
    </ul>
  )
}