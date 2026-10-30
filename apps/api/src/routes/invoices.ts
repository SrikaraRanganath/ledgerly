import { Hono } from 'hono'
import { asc, desc, eq, getTableColumns, isNotNull } from 'drizzle-orm'
import { checkoutSchema } from '@ledgerly/shared'
import { db } from '../db/client'
import { invoices, zatcaEvents } from '../db/schema'
import { CheckoutError, createInvoice } from '../services/checkout'
import { submitInvoice } from '../zatca/service'
import { GENESIS_PIH, sha256b64 } from '../zatca/xml'

// Lists omit the big XML column
const { xml: _xml, ...summaryCols } = getTableColumns(invoices)
const summary = (id: number) => db.select(summaryCols).from(invoices).where(eq(invoices.id, id)).get()

const STATUSES = ['pending', 'cleared', 'reported', 'rejected'] as const
type Status = (typeof STATUSES)[number]
const isStatus = (s?: string): s is Status => !!s && (STATUSES as readonly string[]).includes(s)

const invoicesRoute = new Hono()

invoicesRoute.get('/', (c) => {
  const status = c.req.query('status')
  const rows = db.select(summaryCols).from(invoices)
    .where(isStatus(status) ? eq(invoices.status, status) : undefined)
    .orderBy(desc(invoices.id)).limit(200).all()
  return c.json(rows)
})

invoicesRoute.post('/', async (c) => {
  const parsed = checkoutSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, 400)
  try {
    const created = createInvoice(parsed.data)
    if (created.type === 'standard') {
      // Clearance: the caller waits for ZATCA's answer
      await submitInvoice(created.id).catch((e) => console.error('clearance failed', e))
    } else {
      // Reporting: answer the customer now, report in the background
      void submitInvoice(created.id).catch((e) => console.error('report failed', e))
    }
    return c.json(summary(created.id), 201)
  } catch (e) {
    if (e instanceof CheckoutError) return c.json({ error: e.message }, 400)
    throw e
  }
})

// MUST be registered before '/:id', or "verify-chain" is treated as an id
invoicesRoute.get('/verify-chain', (c) => {
  const rows = db.select({
    number: invoices.number, xml: invoices.xml, invoiceHash: invoices.invoiceHash, previousHash: invoices.previousHash,
  }).from(invoices).where(isNotNull(invoices.icv)).orderBy(asc(invoices.icv)).all()

  let prev = GENESIS_PIH
  let checked = 0
  for (const r of rows) {
    if (r.previousHash !== prev)
      return c.json({ ok: false, checked, brokenAt: r.number, reason: 'previous hash does not match the earlier invoice' })
    if (!r.xml || sha256b64(r.xml) !== r.invoiceHash)
      return c.json({ ok: false, checked, brokenAt: r.number, reason: 'content does not match its hash' })
    prev = r.invoiceHash!
    checked++
  }
  return c.json({ ok: true, checked })
})

invoicesRoute.get('/:id', (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.json({ error: 'Invalid id' }, 400)
  const inv = db.select().from(invoices).where(eq(invoices.id, id)).get()
  if (!inv) return c.json({ error: 'Not found' }, 404)
  const events = db.select().from(zatcaEvents).where(eq(zatcaEvents.invoiceId, id)).orderBy(asc(zatcaEvents.id)).all()
  return c.json({ ...inv, events })
})

invoicesRoute.post('/:id/retry', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.json({ error: 'Invalid id' }, 400)
  const inv = summary(id)
  if (!inv) return c.json({ error: 'Not found' }, 404)
  if (inv.status !== 'pending') return c.json({ error: 'Only pending invoices can be retried' }, 409)
  await submitInvoice(id)
  return c.json(summary(id))
})

export { invoicesRoute as invoicesRoutes }