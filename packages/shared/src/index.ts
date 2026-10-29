import { z } from 'zod'

export const ledgerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  accountId: z.coerce.number().int().optional(),
  from: z.coerce.number().int().optional(), // unix ms
  to: z.coerce.number().int().optional(),
  q: z.string().trim().min(1).optional(),
  sort: z.enum(['entryDate', 'debit', 'credit']).default('entryDate'),
  dir: z.enum(['asc', 'desc']).default('desc'),
})
export type LedgerQuery = z.infer<typeof ledgerQuerySchema>

export const checkoutSchema = z.object({
  customerId: z.number().int().optional(),
  items: z
    .array(z.object({ productId: z.number().int(), qty: z.number().int().min(1).max(999) }))
    .min(1),
})
export type CheckoutInput = z.infer<typeof checkoutSchema>