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

export const checkoutSchema = z.object({
  customerId: z.number().int().optional(),
  items: z
    .array(z.object({ productId: z.number().int(), qty: z.number().int().min(1).max(999) }))
    .min(1),
  payments: z.array(paymentSchema).min(1),
})
export type CheckoutInput = z.infer<typeof checkoutSchema>

export { calcTotals, lineAmounts } from './pricing'