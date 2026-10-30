import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { catalog } from './routes/catalog'
import { ledger } from './routes/ledger'
import { invoicesRoutes } from './routes/invoices'
import { dev } from './routes/dev'
import { overview } from './routes/overview'
import { startRetryWorker } from './zatca/service'
import { existsSync, readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serveStatic } from '@hono/node-server/serve-static'

const app = new Hono()
// Middleware
app.use(logger())

// REST API routes
app.get('/api/health', (c) => c.json({ ok: true }))
app.route('/api', catalog)
app.route('/api/ledger', ledger)
app.route('/api/invoices', invoicesRoutes)
app.route('/api/dev', dev)
app.route('/api/overview', overview)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

// Serve static files from the "public" directory
const distDir = fileURLToPath(new URL('../../web/dist', import.meta.url))
if (existsSync(distDir)) {
  app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404))
  app.use('/*', serveStatic({ root: relative(process.cwd(), distDir) }))
  const indexHtml = readFileSync(`${distDir}/index.html`, 'utf8')
  app.get('*', (c) => c.html(indexHtml)) // SPA fallback so /ledger works on refresh
}

const PORT = parseInt(process.env.PORT || '3000', 10)
serve({ fetch: app.fetch, port: PORT }, (i) => console.log(`API on http://localhost:${i.port}`))
startRetryWorker()