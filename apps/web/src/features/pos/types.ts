export type Product = {
  id: number; sku: string; nameEn: string; nameAr: string
  priceHalalas: number; vatRate: number; stock: number
}
export type Invoice = {
  id: number; uuid: string; number: string; customerId: number | null; issuedAt: number
  subtotal: number; vatTotal: number; total: number
  status: 'pending' | 'cleared' | 'reported' | 'rejected'
}
export const productName = (p: Product, lang: string) => (lang === 'ar' ? p.nameAr : p.nameEn)