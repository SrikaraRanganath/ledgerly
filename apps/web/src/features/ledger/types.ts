export type LedgerRow = {
  id: number; entryDate: number; reference: string; description: string; journalId: string
  debit: number; credit: number
  accountCode: string; accountNameEn: string; accountNameAr: string
}
export type LedgerPageResult = { rows: LedgerRow[]; nextCursor: string | null }
export type LedgerSummary = { n: number; debit: number; credit: number }
export type Account = { id: number; code: string; nameEn: string; nameAr: string; type: string }