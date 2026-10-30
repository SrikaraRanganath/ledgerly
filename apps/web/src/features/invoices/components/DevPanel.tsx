import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useGatewayMode, useSetGatewayMode } from '../api'
import { DEMO } from '@/lib/demo'

export default function DevPanel() {
  const { t } = useTranslation()
  const mode = useGatewayMode()
  const setMode = useSetGatewayMode()
  if (!DEMO) return null
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3 text-sm">
      <span className="font-medium">{t('invoices.dev.gateway')}</span>
      {(['normal', 'outage', 'reject'] as const).map((m) => (
        <Button key={m} size="sm" variant={mode.data?.mode === m ? 'default' : 'outline'} onClick={() => setMode.mutate(m)}>
          {t(`invoices.dev.${m}`)}
        </Button>
      ))}
    </div>
  )
}