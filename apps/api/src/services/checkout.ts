import { randomUUID } from 'node:crypto'
import { count, eq, inArray, sql } from 'drizzle-orm'
import type { CheckoutInput } from '@ledgerly/shared'
import { db } from '../db/client'
import { accounts, invoiceLines, invoices, ledgerEntries, products } from '../db/schema'

export class CheckoutError extends Error {}

export function createInvoice(input: CheckoutInput) {
  return db.transaction((tx) => {
    const ids = input.items.map((i) => i.productId)
    const found = tx.select().from(products).where(inArray(products.id, ids)).all()
    const byId = new Map(found.map((p) => [p.id, p]))

    let subtotal = 0
    let vatTotal = 0
    const lines = input.items.map((item) => {
      const p = byId.get(item.productId)
      if (!p) throw new CheckoutError(`Unknown product ${item.productId}`)
      if (p.stock < item.qty) throw new CheckoutError(`Not enough stock for ${p.sku}`)
      const net = p.priceHalalas * item.qty
      const vat = Math.round((net * p.vatRate) / 100)
      subtotal += net
      vatTotal += vat
      return { productId: p.id, qty: item.qty, unitPrice: p.priceHalalas, vatRate: p.vatRate, lineTotal: net + vat }
    })

    const seq = tx.select({ n: count() }).from(invoices).get()!.n + 1
    const now = Date.now()
    const invoice = tx.insert(invoices).values({
      uuid: randomUUID(),
      number: `INV-${new Date(now).getUTCFullYear()}-${String(seq).padStart(4, '0')}`,
      customerId: input.customerId,
      issuedAt: now,
      subtotal, vatTotal, total: subtotal + vatTotal,
    }).returning().get()

    tx.insert(invoiceLines).values(lines.map((l) => ({ ...l, invoiceId: invoice.id }))).run()
    for (const item of input.items) {
      tx.update(products).set({ stock: sql`${products.stock} - ${item.qty}` }).where(eq(products.id, item.productId)).run()
    }

    const accs = tx.select().from(accounts).all()
    const acc = (code: string) => accs.find((a) => a.code === code)!.id
    const journalId = randomUUID()
    const base = { journalId, entryDate: now, reference: invoice.number, description: `Sale ${invoice.number}`, invoiceId: invoice.id }
    tx.insert(ledgerEntries).values([
      { ...base, accountId: acc('1000'), debit: subtotal + vatTotal, credit: 0 },
      { ...base, accountId: acc('4000'), debit: 0, credit: subtotal },
      { ...base, accountId: acc('2100'), debit: 0, credit: vatTotal },
    ]).run()
    return invoice
  })
}