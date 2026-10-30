import { createHash } from 'node:crypto'

// halalas -> "195.50" using integer maths only
export const sar = (h: number) => `${Math.trunc(h / 100)}.${String(h % 100).padStart(2, '0')}`
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export const sha256b64 = (s: string) => createHash('sha256').update(s, 'utf8').digest('base64')
// Previous-invoice-hash for the very first invoice: base64 of the HEX string of sha256("0")
export const GENESIS_PIH = Buffer.from(createHash('sha256').update('0').digest('hex')).toString('base64')

export type XmlLine = { name: string; qty: number; unit: number; vatRate: number; net: number; vat: number }
export type XmlInput = {
  uuid: string; number: string; issuedAt: number; type: 'simplified' | 'standard'
  icv: number; previousHash: string
  seller: { nameAr: string; vatNumber: string }
  buyer?: { name: string; vatNumber: string } | null
  lines: XmlLine[]; subtotal: number; vatTotal: number; total: number
}

const cat = (rate: number) =>
  `<cbc:ID>${rate === 0 ? 'Z' : 'S'}</cbc:ID><cbc:Percent>${rate.toFixed(2)}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>`

export function buildInvoiceXml(i: XmlInput): string {
  const local = new Date(i.issuedAt + 3 * 3600_000).toISOString() // Riyadh = UTC+3
  const byRate = new Map<number, { taxable: number; vat: number }>()
  for (const l of i.lines) {
    const g = byRate.get(l.vatRate) ?? { taxable: 0, vat: 0 }
    g.taxable += l.net; g.vat += l.vat
    byRate.set(l.vatRate, g)
  }
  const sub = [...byRate].map(([rate, g]) =>
    `      <cac:TaxSubtotal><cbc:TaxableAmount currencyID="SAR">${sar(g.taxable)}</cbc:TaxableAmount><cbc:TaxAmount currencyID="SAR">${sar(g.vat)}</cbc:TaxAmount><cac:TaxCategory>${cat(rate)}</cac:TaxCategory></cac:TaxSubtotal>`)
  const lines = i.lines.map((l, n) => [
    `  <cac:InvoiceLine>`,
    `    <cbc:ID>${n + 1}</cbc:ID>`,
    `    <cbc:InvoicedQuantity unitCode="PCE">${l.qty}</cbc:InvoicedQuantity>`,
    `    <cbc:LineExtensionAmount currencyID="SAR">${sar(l.net)}</cbc:LineExtensionAmount>`,
    `    <cac:TaxTotal><cbc:TaxAmount currencyID="SAR">${sar(l.vat)}</cbc:TaxAmount><cbc:RoundingAmount currencyID="SAR">${sar(l.net + l.vat)}</cbc:RoundingAmount></cac:TaxTotal>`,
    `    <cac:Item><cbc:Name>${esc(l.name)}</cbc:Name><cac:ClassifiedTaxCategory>${cat(l.vatRate)}</cac:ClassifiedTaxCategory></cac:Item>`,
    `    <cac:Price><cbc:PriceAmount currencyID="SAR">${sar(l.unit)}</cbc:PriceAmount></cac:Price>`,
    `  </cac:InvoiceLine>`,
  ].join('\n'))

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">`,
    `  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>`,
    `  <cbc:ID>${esc(i.number)}</cbc:ID>`,
    `  <cbc:UUID>${i.uuid}</cbc:UUID>`,
    `  <cbc:IssueDate>${local.slice(0, 10)}</cbc:IssueDate>`,
    `  <cbc:IssueTime>${local.slice(11, 19)}</cbc:IssueTime>`,
    `  <cbc:InvoiceTypeCode name="${i.type === 'standard' ? '0100000' : '0200000'}">388</cbc:InvoiceTypeCode>`,
    `  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>`,
    `  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>`,
    `  <cac:AdditionalDocumentReference><cbc:ID>ICV</cbc:ID><cbc:UUID>${i.icv}</cbc:UUID></cac:AdditionalDocumentReference>`,
    `  <cac:AdditionalDocumentReference><cbc:ID>PIH</cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${i.previousHash}</cbc:EmbeddedDocumentBinaryObject></cac:Attachment></cac:AdditionalDocumentReference>`,
    `  <cac:AccountingSupplierParty><cac:Party><cac:PartyTaxScheme><cbc:CompanyID>${i.seller.vatNumber}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme><cac:PartyLegalEntity><cbc:RegistrationName>${esc(i.seller.nameAr)}</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party></cac:AccountingSupplierParty>`,
    i.buyer
      ? `  <cac:AccountingCustomerParty><cac:Party><cac:PartyTaxScheme><cbc:CompanyID>${i.buyer.vatNumber}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme><cac:PartyLegalEntity><cbc:RegistrationName>${esc(i.buyer.name)}</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party></cac:AccountingCustomerParty>`
      : `  <cac:AccountingCustomerParty/>`,
    `  <cac:TaxTotal><cbc:TaxAmount currencyID="SAR">${sar(i.vatTotal)}</cbc:TaxAmount></cac:TaxTotal>`,
    `  <cac:TaxTotal>`,
    `    <cbc:TaxAmount currencyID="SAR">${sar(i.vatTotal)}</cbc:TaxAmount>`,
    ...sub,
    `  </cac:TaxTotal>`,
    `  <cac:LegalMonetaryTotal>`,
    `    <cbc:LineExtensionAmount currencyID="SAR">${sar(i.subtotal)}</cbc:LineExtensionAmount>`,
    `    <cbc:TaxExclusiveAmount currencyID="SAR">${sar(i.subtotal)}</cbc:TaxExclusiveAmount>`,
    `    <cbc:TaxInclusiveAmount currencyID="SAR">${sar(i.total)}</cbc:TaxInclusiveAmount>`,
    `    <cbc:PayableAmount currencyID="SAR">${sar(i.total)}</cbc:PayableAmount>`,
    `  </cac:LegalMonetaryTotal>`,
    ...lines,
    `</Invoice>`,
  ].join('\n')
}