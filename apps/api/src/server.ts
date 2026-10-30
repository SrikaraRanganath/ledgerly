import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { catalog } from './routes/catalog'
import { ledger } from './routes/ledger'
import { invoiceRoutes } from './routes/invoices'

const app = new Hono()
app.use(logger())
app.get('/health', (c) => c.json({ ok: true }))
app.route('/api', catalog)
app.route('/api/ledger', ledger)
app.route('/api/invoices', invoiceRoutes)
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

const PORT = parseInt(process.env.PORT || '3000', 10)
serve({ fetch: app.fetch, port: PORT }, (i) => console.log(`API on http://localhost:${i.port}`))