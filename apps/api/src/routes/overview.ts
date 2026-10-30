import { Hono } from 'hono'
import { and, asc, count, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { accounts, invoices, ledgerEntries as le, products } from '../db/schema'

const overview = new Hono()
const DAY = 86_400_000
const RIYADH = 3 * 3_600_000 // UTC+3, no DST

overview.get('/', (c) => {
  const now = Date.now()
  const startToday = Math.floor((now + RIYADH) / DAY) * DAY - RIYADH
  const from = startToday - 29 * DAY

  const accs = db.select().from(accounts).all()
  const revenueId = accs.find((a) => a.code === '4000')?.id
  const vatId = accs.find((a) => a.code === '2100')?.id
  if (!revenueId || !vatId) return c.json({ error: 'Accounts 4000/2100 missing. Run the seed' }, 500)

  const dayExpr = sql<string>`strftime('%Y-%m-%d', (${le.entryDate} + ${RIYADH}) / 1000, 'unixepoch')`
  const rows = db
    .select({
      day: dayExpr,
      accountId: le.accountId,
      amount: sql<number>`coalesce(sum(${le.credit}), 0)`,
    })
    .from(le)
    .where(and(inArray(le.accountId, [revenueId, vatId]), gte(le.entryDate, from)))
    .groupBy(dayExpr, le.accountId)
    .all()

  const byDay = new Map<string, { net: number; vat: number }>()
  for (const r of rows) {
    const d = byDay.get(r.day) ?? { net: 0, vat: 0 }
    if (r.accountId === revenueId) d.net += r.amount
    else d.vat += r.amount
    byDay.set(r.day, d)
  }
  // fill missing days with zeros so the chart has 30 bars
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(from + RIYADH + i * DAY).toISOString().slice(0, 10)
    return { date, net: byDay.get(date)?.net ?? 0, vat: byDay.get(date)?.vat ?? 0 }
  })

  const statusRows = db.select({ status: invoices.status, n: count() }).from(invoices).groupBy(invoices.status).all()
  const statusCounts = Object.fromEntries(statusRows.map((r) => [r.status, r.n]))

  const lowStock = db
    .select({ id: products.id, sku: products.sku, nameEn: products.nameEn, nameAr: products.nameAr, stock: products.stock })
    .from(products).where(lte(products.stock, 10)).orderBy(asc(products.stock)).limit(5).all()

  return c.json({ days, statusCounts, lowStock })
})

export { overview }