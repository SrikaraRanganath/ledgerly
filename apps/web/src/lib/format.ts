export function formatMoney(value: number, lang: string) {
  const locale = lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-SA'
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR' }).format(value)
}

export const formatHalalas = (halalas: number, lang: string) => formatMoney(halalas / 100, lang)

const dateFmt = {
  ar: new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { dateStyle: 'medium', timeZone: 'Asia/Riyadh' }),
  en: new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'Asia/Riyadh' }),
}
export const formatDate = (ms: number, lang: string) => (lang === 'ar' ? dateFmt.ar : dateFmt.en).format(ms)

const dtFmt = {
  ar: new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Riyadh' }),
  en: new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Riyadh' }),
}
export const formatDateTime = (ms: number, lang: string) => (lang === 'ar' ? dtFmt.ar : dtFmt.en).format(ms)