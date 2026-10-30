import { z } from 'zod'

export const ledgerQuerySchema = z.object({
  accountId: z.coerce.number().int().optional(),
  from: z.coerce.number().int().optional(), // unix ms
  to: z.coerce.number().int().optional(),
  q: z.string().trim().min(1).optional(),
  sort: z.enum(['entryDate', 'debit', 'credit']).default('entryDate'),
  order: z.enum(['asc', 'desc']).default('desc'),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
})
export type LedgerQuery = z.infer<typeof ledgerQuerySchema>

export const paymentSchema = z.object({
  method: z.enum(['cash', 'card']),
  amount: z.number().int().min(1), // halalas
})
export type Payment = z.infer<typeof paymentSchema>

export const buyerSchema = z.object({
  name: z.string().trim().min(2, 'Buyer name is required').max(120),
  // format rule only (15 digits, starts and ends with 3), not a checksum
  vatNumber: z.string().regex(/^3\d{13}3$/, 'VAT number must be 15 digits, starting and ending with 3'),
})
export type Buyer = z.infer<typeof buyerSchema>

export const checkoutSchema = z.object({
  customerId: z.number().int().optional(),
  items: z.array(z.object({ productId: z.number().int(), qty: z.number().int().min(1).max(999) })).min(1),
  payments: z.array(paymentSchema).min(1),
  buyer: buyerSchema.optional(), // present means B2B standard invoice (clearance)
})
export type CheckoutInput = z.infer<typeof checkoutSchema>

export * from './zatca-qr'
export * from './pricing'