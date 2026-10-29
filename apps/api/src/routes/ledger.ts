import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { and, asc, desc, eq, gte, lte, like, count } from 'drizzle-orm'
import { ledgerQuerySchema } from '@ledgerly/shared'
import { db } from '../db/client'
import { ledgerEntries } from '../db/schema'

export const ledger = new Hono()

ledger.get('/', zValidator('query', ledgerQuerySchema), (c) => {
  const { page, limit, accountId, from, to, q, sort, dir } = c.req.valid('query')
  const where = and(
    accountId ? eq(ledgerEntries.accountId, accountId) : undefined,
    from ? gte(ledgerEntries.entryDate, from) : undefined,
    to ? lte(ledgerEntries.entryDate, to) : undefined,
    q ? like(ledgerEntries.description, `%${q}%`) : undefined,
  )
  const col = { entryDate: ledgerEntries.entryDate, debit: ledgerEntries.debit, credit: ledgerEntries.credit }[sort]
  const rows = db.select().from(ledgerEntries).where(where)
    .orderBy(dir === 'asc' ? asc(col) : desc(col))
    .limit(limit).offset((page - 1) * limit).all()
  const total = db.select({ n: count() }).from(ledgerEntries).where(where).get()!.n
  return c.json({ rows, total, page, limit })
})