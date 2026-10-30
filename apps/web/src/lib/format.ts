export function formatMoney(value: number, lang: string) {
  const locale = lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-SA'
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR' }).format(value)
}

export const formatHalalas = (halalas: number, lang: string) => formatMoney(halalas / 100, lang)