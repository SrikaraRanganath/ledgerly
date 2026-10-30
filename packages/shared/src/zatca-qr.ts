export type QrField = { tag: number; value: string }

const enc = new TextEncoder()
const dec = new TextDecoder()
const toBase64 = (b: Uint8Array) => btoa(Array.from(b, (x) => String.fromCharCode(x)).join(''))
const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

export function tlvEncode(fields: QrField[]): Uint8Array {
  const parts = fields.map(({ tag, value }) => {
    const v = enc.encode(value) // BYTES, not characters
    if (v.length > 255) throw new Error(`QR tag ${tag} is ${v.length} bytes; the maximum is 255`)
    return Uint8Array.of(tag, v.length, ...v)
  })
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) { out.set(p, o); o += p.length }
  return out
}

export function tlvDecode(base64: string): QrField[] {
  const bytes = fromBase64(base64)
  const fields: QrField[] = []
  let i = 0
  while (i < bytes.length) {
    const tag = bytes[i]
    const len = bytes[i + 1]
    if (len === undefined || i + 2 + len > bytes.length) throw new Error('Malformed QR: truncated field')
    fields.push({ tag, value: dec.decode(bytes.slice(i + 2, i + 2 + len)) })
    i += 2 + len
  }
  return fields
}

export type ZatcaQrInput = {
  sellerName: string; vatNumber: string
  timestamp: string // e.g. 2026-10-30T10:15:00Z
  total: string     // "195.50" (with VAT)
  vat: string       // "25.50"
  hash?: string     // tag 6, a Phase 2 field (simulated here)
}

export function encodeZatcaQr(i: ZatcaQrInput): string {
  const fields: QrField[] = [
    { tag: 1, value: i.sellerName }, { tag: 2, value: i.vatNumber }, { tag: 3, value: i.timestamp },
    { tag: 4, value: i.total }, { tag: 5, value: i.vat },
  ]
  if (i.hash) fields.push({ tag: 6, value: i.hash })
  return toBase64(tlvEncode(fields))
}