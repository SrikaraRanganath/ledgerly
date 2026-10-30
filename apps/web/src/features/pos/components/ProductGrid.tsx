import { useTranslation } from 'react-i18next'
import { formatHalalas } from '@/lib/format'
import { cn } from '@/lib/utils'
import { productName, type Product } from '../types'

export default function ProductGrid({ products, onAdd }: { products: Product[]; onAdd: (p: Product) => void }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {products.map((p) => (
        <button
          key={p.id}
          type="button"
          disabled={p.stock < 1}
          onClick={() => onAdd(p)}
          className={cn(
            'rounded-lg border bg-card p-3 text-start transition hover:bg-accent focus-visible:outline-2',
            p.stock < 1 && 'opacity-50',
          )}
        >
          <div className="line-clamp-2 text-sm font-medium">{productName(p, i18n.language)}</div>
          <div className="mt-1 text-sm tabular-nums">{formatHalalas(p.priceHalalas, i18n.language)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{t('pos.stock', { count: p.stock })}</div>
        </button>
      ))}
    </div>
  )
}