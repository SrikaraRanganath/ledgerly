import { and, eq, isNotNull, lte } from 'drizzle-orm'
import { db } from '../db/client'
import { invoices, zatcaEvents } from '../db/schema'
import { GatewayUnavailable, sendToGateway } from './gateway'

type EventType = (typeof zatcaEvents.$inferInsert)['type']
const log = (invoiceId: number, type: EventType, detail?: string) =>
  db.insert(zatcaEvents).values({ invoiceId, at: Date.now(), type, detail }).run()

const inFlight = new Set<number>() // never submit the same invoice twice at once

export async function submitInvoice(id: number) {
  if (inFlight.has(id)) return
  inFlight.add(id)
  try {
    const inv = db.select().from(invoices).where(eq(invoices.id, id)).get()
    if (!inv || !inv.xml || !inv.invoiceHash) return
    if (inv.status !== 'pending') return // only pending invoices are (re)submitted

    const attempt = inv.attempts + 1
    log(id, 'submitted', `attempt ${attempt}`)
    try {
      const res = await sendToGateway({ kind: inv.type, uuid: inv.uuid, xml: inv.xml, invoiceHash: inv.invoiceHash })
      if (res.accepted) {
        db.update(invoices).set({
          status: inv.type === 'standard' ? 'cleared' : 'reported',
          clearedAt: Date.now(), attempts: attempt, nextRetryAt: null,
          rejectionCode: null, rejectionMessage: null,
        }).where(eq(invoices.id, id)).run()
        log(id, 'accepted', inv.type === 'standard' ? 'cleared' : 'reported')
      } else {
        db.update(invoices).set({
          status: 'rejected', attempts: attempt, nextRetryAt: null,
          rejectionCode: res.code, rejectionMessage: res.message,
        }).where(eq(invoices.id, id)).run()
        log(id, 'rejected', `${res.code}: ${res.message}`)
      }
    } catch (e) {
      if (!(e instanceof GatewayUnavailable)) throw e
      const delay = Math.min(5_000 * 2 ** (attempt - 1), 60_000) // 5s, 10s, 20s, 40s, 60s...
      db.update(invoices).set({ attempts: attempt, nextRetryAt: Date.now() + delay })
        .where(eq(invoices.id, id)).run()
      log(id, 'network_error', e.message)
      log(id, 'retry_scheduled', `in ${delay / 1000}s`)
    }
  } finally {
    inFlight.delete(id)
  }
}

export function startRetryWorker() {
  setInterval(() => {
    const due = db.select({ id: invoices.id }).from(invoices)
      .where(and(eq(invoices.status, 'pending'), isNotNull(invoices.nextRetryAt), lte(invoices.nextRetryAt, Date.now())))
      .limit(20).all()
    for (const { id } of due) submitInvoice(id).catch((e) => console.error('retry failed', e))
  }, 3000)
}