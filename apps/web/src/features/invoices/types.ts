import type { Invoice } from '@/features/pos/types'

export type InvoiceStatus = Invoice['status']
export type InvoiceRow = Invoice & {
  type: 'simplified' | 'standard'
  buyerName: string | null; buyerVat: string | null
  icv: number | null; previousHash: string | null; invoiceHash: string | null; qr: string | null
  rejectionCode: string | null; rejectionMessage: string | null
  clearedAt: number | null; attempts: number; nextRetryAt: number | null
}
export type ZatcaEvent = { id: number; invoiceId: number; at: number; type: string; detail: string | null }
export type InvoiceDetail = InvoiceRow & { xml: string | null; events: ZatcaEvent[] }
export type ChainResult = { ok: boolean; checked: number; brokenAt?: string; reason?: string }
export type GatewayMode = 'normal' | 'outage' | 'reject'