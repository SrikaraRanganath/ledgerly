import { sha256b64 } from './xml'

export type GatewayMode = 'normal' | 'outage' | 'reject'
let mode: GatewayMode = 'normal'
export const getMode = () => mode
export const setMode = (m: GatewayMode) => { mode = m }

export class GatewayUnavailable extends Error {}
export type GatewayResult = { accepted: true } | { accepted: false; code: string; message: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const grab = (xml: string, re: RegExp) => {
  const m = xml.match(re)
  return m ? Math.round(parseFloat(m[1]) * 100) : NaN
}

export function validate(p: { uuid: string; xml: string; invoiceHash: string }) {
  if (!UUID_V4.test(p.uuid)) return { code: 'SIM-001', message: 'UUID is not a valid v4 UUID' }
  if (sha256b64(p.xml) !== p.invoiceHash)
    return { code: 'SIM-002', message: 'Invoice hash does not match the XML content' }
  const excl = grab(p.xml, /<cbc:TaxExclusiveAmount currencyID="SAR">([\d.]+)</)
  const incl = grab(p.xml, /<cbc:TaxInclusiveAmount currencyID="SAR">([\d.]+)</)
  const vat = grab(p.xml, /<cac:TaxTotal>\s*<cbc:TaxAmount currencyID="SAR">([\d.]+)</)
  if (!(excl + vat === incl))
    return { code: 'SIM-003', message: `Tax-inclusive total (${incl}) is not exclusive (${excl}) + VAT (${vat})` }
  return null
}

export async function sendToGateway(p: {
  kind: 'standard' | 'simplified'; uuid: string; xml: string; invoiceHash: string
}): Promise<GatewayResult> {
  await sleep(p.kind === 'standard' ? 600 : 300) // pretend network latency
  if (mode === 'outage') throw new GatewayUnavailable('ZATCA gateway unreachable (simulated)')
  if (mode === 'reject') return { accepted: false, code: 'SIM-999', message: 'Rejected by simulator (forced)' }
  const problem = validate(p)
  return problem ? { accepted: false, ...problem } : { accepted: true }
}