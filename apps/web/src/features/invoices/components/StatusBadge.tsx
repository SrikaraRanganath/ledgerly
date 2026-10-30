import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { InvoiceStatus } from '../types'

const styles: Record<InvoiceStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
  cleared: 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200',
  reported: 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200',
  rejected: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200',
}

export default function StatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation()
  return <Badge variant="secondary" className={cn('border-0', styles[status])}>{t(`invoices.status.${status}`)}</Badge>
}