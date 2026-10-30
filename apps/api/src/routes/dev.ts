import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { invoices } from '../db/schema'
import { getMode, setMode } from '../zatca/gateway'

const dev = new Hono()

dev.use('*', async (c, next) => {
  if (process.env.DEMO_MODE !== 'true') return c.json({ error: 'Not found' }, 404)
  await next()
})

dev.get('/zatca-mode', (c) => c.json({ mode: getMode() }))

dev.put('/zatca-mode', async (c) => {
  const body = z.object({ mode: z.enum(['normal', 'outage', 'reject']) }).safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Invalid mode' }, 400)
  setMode(body.data.mode)
  return c.json({ mode: getMode() })
})

// Corrupt an invoice's stored XML so hash checks fail
dev.post('/tamper/:id', (c) => {
  const id = Number(c.req.param('id'))
  const inv = db.select({ xml: invoices.xml }).from(invoices).where(eq(invoices.id, id)).get()
  if (!inv?.xml) return c.json({ error: 'Not found' }, 404)
  const xml = inv.xml.replace(/(<cbc:PayableAmount currencyID="SAR">)[\d.]+/, '$1999999.99')
  db.update(invoices).set({ xml }).where(eq(invoices.id, id)).run()
  return c.json({ ok: true })
})

export { dev }