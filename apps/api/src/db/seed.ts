import { randomUUID } from 'node:crypto'
import { db } from './client'
import { accounts, products, ledgerEntries, invoices, invoiceLines, payments, zatcaEvents } from './schema'

// Deterministic random so every run gives the same data
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(42)
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const between = (a: number, b: number) => Math.floor(rand() * (b - a + 1)) + a

db.transaction((tx) => {
tx.delete(payments).run()
tx.delete(ledgerEntries).run()
tx.delete(invoiceLines).run()
tx.delete(zatcaEvents).run()
tx.delete(invoices).run()
tx.delete(products).run()
tx.delete(accounts).run()

  const acc = tx.insert(accounts).values([
    { code: '1000', nameEn: 'Cash', nameAr: 'النقدية', type: 'asset' },
    { code: '1010', nameEn: 'Card settlements', nameAr: 'تسويات البطاقات', type: 'asset' },
    { code: '1100', nameEn: 'Accounts receivable', nameAr: 'الذمم المدينة', type: 'asset' },
    { code: '1200', nameEn: 'Inventory', nameAr: 'المخزون', type: 'asset' },
    { code: '2100', nameEn: 'VAT payable', nameAr: 'ضريبة القيمة المضافة المستحقة', type: 'liability' },
    { code: '4000', nameEn: 'Sales revenue', nameAr: 'إيرادات المبيعات', type: 'revenue' },
    { code: '5000', nameEn: 'Cost of goods sold', nameAr: 'تكلفة البضاعة المباعة', type: 'expense' },
    { code: '6100', nameEn: 'Rent', nameAr: 'الإيجار', type: 'expense' },
    { code: '6200', nameEn: 'Utilities', nameAr: 'المرافق', type: 'expense' },
  ]).returning().all()
  const id = Object.fromEntries(acc.map((a) => [a.code, a.id]))

  tx.insert(products).values([
    { sku: 'COF-500', nameEn: 'Coffee beans 500g', nameAr: 'حبوب قهوة ٥٠٠ جم', priceHalalas: 8500, stock: 120 },
    { sku: 'COF-1KG', nameEn: 'Coffee beans 1kg', nameAr: 'حبوب قهوة ١ كجم', priceHalalas: 15500, stock: 80 },
    { sku: 'DAT-SKR', nameEn: 'Sukkari dates 1kg', nameAr: 'تمر سكري ١ كجم', priceHalalas: 4500, stock: 200 },
    { sku: 'TEA-GRN', nameEn: 'Green tea box', nameAr: 'علبة شاي أخضر', priceHalalas: 2200, stock: 150 },
    { sku: 'CUP-CER', nameEn: 'Ceramic cup', nameAr: 'كوب سيراميك', priceHalalas: 3500, stock: 90 },
    { sku: 'HON-SDR', nameEn: 'Sidr honey 500g', nameAr: 'عسل سدر ٥٠٠ جم', priceHalalas: 12000, stock: 60 },
  ]).run()

  // 5,000 journals -> roughly 12,000 ledger rows
  const rows: (typeof ledgerEntries.$inferInsert)[] = []
  const start = Date.UTC(2025, 0, 1)
  for (let i = 0; i < 5000; i++) {
    const date = start + between(0, 300) * 86400000 + between(0, 86399) * 1000
    const journalId = randomUUID()
    const ref = `JV-${String(i + 1).padStart(5, '0')}`
    const kind = rand()
    if (kind < 0.6) {
      const net = between(1000, 90000)
      const vat = Math.round(net * 0.15)
      rows.push(
        { journalId, entryDate: date, reference: ref, description: 'Sale', accountId: id['1000'], debit: net + vat, credit: 0 },
        { journalId, entryDate: date, reference: ref, description: 'Sale', accountId: id['4000'], debit: 0, credit: net },
        { journalId, entryDate: date, reference: ref, description: 'VAT on sale', accountId: id['2100'], debit: 0, credit: vat },
      )
    } else if (kind < 0.85) {
      const amt = between(500, 40000)
      rows.push(
        { journalId, entryDate: date, reference: ref, description: 'Cost of goods sold', accountId: id['5000'], debit: amt, credit: 0 },
        { journalId, entryDate: date, reference: ref, description: 'Cost of goods sold', accountId: id['1200'], debit: 0, credit: amt },
      )
    } else {
      const amt = between(2000, 60000)
      const exp = pick(['6100', '6200'])
      rows.push(
        { journalId, entryDate: date, reference: ref, description: exp === '6100' ? 'Rent' : 'Utilities', accountId: id[exp], debit: amt, credit: 0 },
        { journalId, entryDate: date, reference: ref, description: exp === '6100' ? 'Rent' : 'Utilities', accountId: id['1000'], debit: 0, credit: amt },
      )
    }
  }
  for (let i = 0; i < rows.length; i += 500) {
    tx.insert(ledgerEntries).values(rows.slice(i, i + 500)).run()
  }
  console.log(`Seeded ${rows.length} ledger rows`)
})