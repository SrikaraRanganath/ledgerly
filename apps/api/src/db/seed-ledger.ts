import { randomUUID } from 'node:crypto'
import { like } from 'drizzle-orm'
import { db } from './client'
import { accounts, ledgerEntries } from './schema'

// Deterministic PRNG: same data every run
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const JOURNALS = Number(process.argv[2] ?? 17000) // × 3 rows ≈ 51,000 entries
const rand = mulberry32(42)
const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]

const accs = db.select().from(accounts).all()
const id = (code: string) => {
  const a = accs.find((x) => x.code === code)
  if (!a) throw new Error(`Account ${code} missing. Run pnpm seed first`)
  return a.id
}
const [cash, card, vatAcc, revenue] = [id('1000'), id('1010'), id('2100'), id('4000')]

const descriptions = [
  'Counter sale', 'Online order', 'Wholesale order', 'Walk-in sale',
  'مبيعات نقدية', 'طلب عبر الإنترنت', 'Order #A-102 طلب خاص', 'Refund adj. 100%_test',
]

const now = Date.now()
const rows: (typeof ledgerEntries.$inferInsert)[] = []
for (let i = 0; i < JOURNALS; i++) {
  const entryDate = Math.floor((now - Math.floor(rand() * 365 * 86_400_000)) / 60_000) * 60_000
  const net = 500 + Math.floor(rand() * 80_000)
  const vat = Math.round(net * 0.15)
  const base = {
    journalId: randomUUID(), entryDate,
    reference: `BULK-${String(i + 1).padStart(6, '0')}`,
    description: pick(descriptions),
  }
  rows.push(
    { ...base, accountId: rand() < 0.6 ? cash : card, debit: net + vat, credit: 0 },
    { ...base, accountId: revenue, debit: 0, credit: net },
    { ...base, accountId: vatAcc, debit: 0, credit: vat },
  )
}

db.transaction((tx) => {
  tx.delete(ledgerEntries).where(like(ledgerEntries.reference, 'BULK-%')).run()
  for (let s = 0; s < rows.length; s += 500) {
    tx.insert(ledgerEntries).values(rows.slice(s, s + 500)).run()
  }
})
console.log(`Inserted ${rows.length} ledger entries`)