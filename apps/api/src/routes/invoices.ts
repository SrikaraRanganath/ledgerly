import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { desc } from 'drizzle-orm'
import { checkoutSchema } from '@ledgerly/shared'
import { db } from '../db/client'
import { invoices } from '../db/schema'
import { CheckoutError, createInvoice } from '../services/checkout'

export const invoiceRoutes = new Hono()

invoiceRoutes.get('/', (c) => c.json(db.select().from(invoices).orderBy(desc(invoices.id)).limit(100).all()))

invoiceRoutes.post('/', zValidator('json', checkoutSchema), (c) => {
  try {
    return c.json(createInvoice(c.req.valid('json')), 201)
  } catch (e) {
    if (e instanceof CheckoutError) return c.json({ error: e.message }, 400)
    throw e
  }
})