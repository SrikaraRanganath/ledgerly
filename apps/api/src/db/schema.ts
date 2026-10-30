import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core'

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sku: text('sku').notNull().unique(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  priceHalalas: integer('price_halalas').notNull(),
  vatRate: integer('vat_rate').notNull().default(15),
  stock: integer('stock').notNull().default(0),
})

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  vatNumber: text('vat_number'),
})

export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  type: text('type', { enum: ['asset', 'liability', 'equity', 'revenue', 'expense'] }).notNull(),
})

export const invoices = sqliteTable(
  'invoices',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    number: text('number').notNull().unique(),
    customerId: integer('customer_id').references(() => customers.id),
    issuedAt: integer('issued_at').notNull(), // unix ms
    subtotal: integer('subtotal').notNull(),
    vatTotal: integer('vat_total').notNull(),
    total: integer('total').notNull(),
    status: text('status', { enum: ['pending', 'cleared', 'rejected'] }).notNull().default('pending'),
    rejectionCode: text('rejection_code'),
    previousHash: text('previous_hash'),
    hash: text('hash'),
  },
  (t) => [index('invoices_status_idx').on(t.status)]
)

export const invoiceLines = sqliteTable('invoice_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id),
  productId: integer('product_id').notNull().references(() => products.id),
  qty: integer('qty').notNull(),
  unitPrice: integer('unit_price').notNull(),
  vatRate: integer('vat_rate').notNull(),
  lineTotal: integer('line_total').notNull(),
})

export const ledgerEntries = sqliteTable(
  'ledger_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    journalId: text('journal_id').notNull(), // lines in one journal must balance
    entryDate: integer('entry_date').notNull(), // unix ms
    reference: text('reference').notNull(),
    description: text('description').notNull(),
    accountId: integer('account_id').notNull().references(() => accounts.id),
    debit: integer('debit').notNull().default(0),
    credit: integer('credit').notNull().default(0),
    invoiceId: integer('invoice_id').references(() => invoices.id),
  },
  (t) => [
    index('ledger_account_idx').on(t.accountId),
    index('ledger_account_date_idx').on(t.accountId, t.entryDate),
    index('ledger_date_idx').on(t.entryDate),
    index('ledger_journal_idx').on(t.journalId),
  ]
)

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id),
  method: text('method', { enum: ['cash', 'card'] }).notNull(),
  amount: integer('amount').notNull(),
})