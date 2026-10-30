import { randomUUID } from 'node:crypto'
import { count, eq, inArray, sql } from 'drizzle-orm'
import { calcTotals, lineAmounts, type CheckoutInput } from '@ledgerly/shared'
import { db } from '../db/client'
import { accounts, invoiceLines, invoices, ledgerEntries, payments, products } from '../db/schema'

export class CheckoutError extends Error {}

export function createInvoice(input: CheckoutInput) {
  return db.transaction((tx) => {

    // Check for duplicate product IDs
    const seen = new Set<number>()
    for (const item of input.items) {
      if (seen.has(item.productId)) throw new CheckoutError(`Duplicate product ${item.productId}`)
      seen.add(item.productId)
    }

    // Fetch products in cart from the database
    const found = tx.select().from(products)
      .where(inArray(products.id, input.items.map((i) => i.productId))).all()
    const byId = new Map(found.map((p) => [p.id, p]))

    // Check for unknown products and stock availability, and calculate line totals
    const priced = input.items.map((item) => {
      const p = byId.get(item.productId)
      if (!p) throw new CheckoutError(`Unknown product ${item.productId}`)
      if (p.stock < item.qty) throw new CheckoutError(`Not enough stock for ${p.sku}`)
      return { product: p, qty: item.qty, priceHalalas: p.priceHalalas, vatRate: p.vatRate }
    })
    const { subtotal, vatTotal, total } = calcTotals(priced)

    const paid = input.payments.reduce((s, p) => s + p.amount, 0)
    if (paid !== total) throw new CheckoutError(`Payments (${paid}) must equal the total (${total})`)

    const seq = tx.select({ n: count() }).from(invoices).get()!.n + 1
    const now = Date.now()
    const invoice = tx.insert(invoices).values({
      uuid: randomUUID(),
      number: `INV-${new Date(now).getUTCFullYear()}-${String(seq).padStart(4, '0')}`,
      customerId: input.customerId,
      issuedAt: now, subtotal, vatTotal, total,
    }).returning().get()

    tx.insert(invoiceLines).values(priced.map((l) => ({
      invoiceId: invoice.id, productId: l.product.id, qty: l.qty,
      unitPrice: l.priceHalalas, vatRate: l.vatRate, lineTotal: lineAmounts(l).total,
    }))).run()

    tx.insert(payments).values(input.payments.map((p) => ({ invoiceId: invoice.id, ...p }))).run()

    for (const l of priced) {
      tx.update(products).set({ stock: sql`${products.stock} - ${l.qty}` })
        .where(eq(products.id, l.product.id)).run()
    }

    const accs = tx.select().from(accounts).all()
    const acc = (code: string) => accs.find((a) => a.code === code)!.id
    const base = {
      journalId: randomUUID(), entryDate: now, reference: invoice.number,
      description: `Sale ${invoice.number}`, invoiceId: invoice.id,
    }
    tx.insert(ledgerEntries).values([
      ...input.payments.map((p) => ({
        ...base, accountId: acc(p.method === 'cash' ? '1000' : '1010'), debit: p.amount, credit: 0,
      })),
      { ...base, accountId: acc('4000'), debit: 0, credit: subtotal },
      { ...base, accountId: acc('2100'), debit: 0, credit: vatTotal },
    ]).run()

    return invoice
  })
}