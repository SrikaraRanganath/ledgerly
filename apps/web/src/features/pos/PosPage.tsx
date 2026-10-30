import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CheckoutInput, Payment, Buyer } from '@ledgerly/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCheckout, useProducts } from './api'
import CartPanel from './components/CartPanel'
import PaymentDialog from './components/PaymentDialog'
import ProductGrid from './components/ProductGrid'
import RecentSales from './components/RecentSales'
import TotalsPanel from './components/TotalsPanel'
import { useCart } from './hooks/useCart'
import { useDebounced } from './hooks/useDebounced'
import { useHotkeys } from './hooks/useHotKeys'

export default function PosPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [payOpen, setPayOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const products = useProducts(useDebounced(search, 200))
  const cart = useCart()
  const checkout = useCheckout()

  const change = (d: number) => cart.selectedId != null && cart.change(cart.selectedId, d)

  useHotkeys(
    {
      '/': () => searchRef.current?.focus(),
      ArrowDown: () => cart.move(1),
      ArrowUp: () => cart.move(-1),
      '+': () => change(1),
      '=': () => change(1),
      '-': () => change(-1),
      Delete: () => cart.selectedId != null && cart.remove(cart.selectedId),
      F9: () => cart.lines.length > 0 && setPayOpen(true),
      Escape: () => { setSearch(''); searchRef.current?.blur() },
    },
    !payOpen,
  )

  function pay(payments: Payment[], buyer?: Buyer) {
    const snapshot = cart.state
    const input: CheckoutInput = {
      items: snapshot.lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
      payments,
      buyer,
    }
    const total = cart.totals.total
    cart.clear()                 // optimistic: the screen is ready for the next customer
    setPayOpen(false)
    searchRef.current?.focus()
    checkout.mutate({ input, total }, { onError: () => cart.reset(snapshot) }) // restore on failure
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="space-y-4">
        <Input
          ref={searchRef}
          value={search}
          placeholder={t('pos.search')}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            const first = products.data?.[0]
            if (e.key === 'Enter' && first) { cart.add(first); setSearch('') }
          }}
        />
        {products.isPending && <p className="text-sm text-muted-foreground">{t('pos.loading')}</p>}
        {products.isError && (
          <div className="rounded-lg border border-destructive p-4 text-sm">
            {t('pos.loadError')}{' '}
            <Button variant="link" onClick={() => products.refetch()}>{t('pos.retry')}</Button>
          </div>
        )}
        {products.data && <ProductGrid products={products.data} onAdd={cart.add} />}
      </section>

      <aside className="space-y-4">
        <h2 className="text-sm font-medium">{t('pos.cart')}</h2>
        <CartPanel lines={cart.lines} selectedId={cart.selectedId}
                   onSelect={cart.select} onChange={cart.change} onRemove={cart.remove} />
        <TotalsPanel {...cart.totals} disabled={!cart.lines.length} onPay={() => setPayOpen(true)} />
        <RecentSales />
      </aside>

      <PaymentDialog open={payOpen} total={cart.totals.total} onOpenChange={setPayOpen} onConfirm={pay} />
    </div>
  )
}