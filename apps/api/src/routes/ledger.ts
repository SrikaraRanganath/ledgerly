import { Hono } from 'hono'
import { and, asc, desc, eq, gt, gte, lt, lte, or, sql, count } from 'drizzle-orm'
import { ledgerQuerySchema, type LedgerQuery } from '@ledgerly/shared'
import { db } from '../db/client'
import { accounts, ledgerEntries as le } from '../db/schema'
import { stripWildcards } from '../lib/utils'

const ledger = new Hono()

const encodeCursor = (d: number, i: number) =>
  Buffer.from(JSON.stringify({ d, i })).toString('base64url')

function decodeCursor(s: string): { d: number; i: number } | null {
  try {
    const v = JSON.parse(Buffer.from(s, 'base64url').toString())
    return Number.isInteger(v.d) && Number.isInteger(v.i) ? v : null
  } catch { return null }
}

function filters(q: LedgerQuery) {
  const c = []
  if (q.accountId) c.push(eq(le.accountId, q.accountId))
  if (q.from != null) c.push(gte(le.entryDate, q.from))
  if (q.to != null) c.push(lte(le.entryDate, q.to))
  if (q.q) {
    const pat = `%${stripWildcards(q.q)}%`
    c.push(or(
      sql`${le.description} LIKE ${pat} `,
      sql`${le.reference} LIKE ${pat} `,
    )!)
  }
  return c
}

ledger.get('/', (c) => {
  const parsed = ledgerQuerySchema.safeParse(c.req.query())
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid query' }, 400)
  const q = parsed.data
  const isAsc = q.order === 'asc'
  const conds = filters(q)

  if (q.cursor) {
    const cur = decodeCursor(q.cursor)
    if (!cur) return c.json({ error: 'Invalid cursor' }, 400)
    conds.push(
      (isAsc
        ? or(gt(le.entryDate, cur.d), and(eq(le.entryDate, cur.d), gt(le.id, cur.i)))
        : or(lt(le.entryDate, cur.d), and(eq(le.entryDate, cur.d), lt(le.id, cur.i))))!,
    )
  }

  const rows = db
    .select({
      id: le.id, entryDate: le.entryDate, reference: le.reference, description: le.description,
      journalId: le.journalId, debit: le.debit, credit: le.credit,
      accountCode: accounts.code, accountNameEn: accounts.nameEn, accountNameAr: accounts.nameAr,
    })
    .from(le)
    .innerJoin(accounts, eq(le.accountId, accounts.id))
    .where(and(...conds))
    .orderBy(isAsc ? asc(le.entryDate) : desc(le.entryDate), isAsc ? asc(le.id) : desc(le.id))
    .limit(q.limit + 1) // fetch one extra to know if there is a next page
    .all()

  const hasMore = rows.length > q.limit
  const page = hasMore ? rows.slice(0, q.limit) : rows
  const last = page.at(-1)
  return c.json({ rows: page, nextCursor: hasMore && last ? encodeCursor(last.entryDate, last.id) : null })
})

ledger.get('/summary', (c) => {
  const parsed = ledgerQuerySchema.safeParse(c.req.query())
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid query' }, 400)
  const r = db
    .select({
      n: count(),
      debit: sql<number>`coalesce(sum(${le.debit}), 0)`,
      credit: sql<number>`coalesce(sum(${le.credit}), 0)`,
    })
    .from(le)
    .where(and(...filters(parsed.data)))
    .get()!
  return c.json(r)
})

export { ledger }