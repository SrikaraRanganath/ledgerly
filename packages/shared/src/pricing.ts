export type PricedItem = { priceHalalas: number; vatRate: number; qty: number }

export function lineAmounts(item: PricedItem) {
  const net = item.priceHalalas * item.qty
  const vat = Math.round((net * item.vatRate) / 100)
  return { net, vat, total: net + vat }
}

export function calcTotals(items: PricedItem[]) {
  let subtotal = 0
  let vatTotal = 0
  for (const item of items) {
    const { net, vat } = lineAmounts(item)
    subtotal += net
    vatTotal += vat
  }
  return { subtotal, vatTotal, total: subtotal + vatTotal }
}