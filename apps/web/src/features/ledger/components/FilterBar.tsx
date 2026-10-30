import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Filters } from '../hooks/useLedgerFilters'
import type { Account } from '../types'

type Props = {
  filters: Filters; accounts: Account[]
  update: (p: Partial<Record<'account' | 'from' | 'to' | 'q' | 'order', string | undefined>>) => void
}

export default function FilterBar({ filters, accounts, update }: Props) {
  const { t, i18n } = useTranslation()
  const dirty = filters.accountId || filters.from || filters.to || filters.q
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label>{t('ledger.account')}</Label>
        <Select dir={i18n.dir()} value={filters.accountId ? String(filters.accountId) : 'all'}
                onValueChange={(v) => update({ account: v === 'all' ? undefined : v })}>
          <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('ledger.allAccounts')}</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.code} · {i18n.language === 'ar' ? a.nameAr : a.nameEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="from">{t('ledger.from')}</Label>
        <Input id="from" type="date" value={filters.from ?? ''} max={filters.to}
               onChange={(e) => update({ from: e.target.value || undefined })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to">{t('ledger.to')}</Label>
        <Input id="to" type="date" value={filters.to ?? ''} min={filters.from}
               onChange={(e) => update({ to: e.target.value || undefined })} />
      </div>
      <div className="min-w-48 flex-1 space-y-1">
        <Label htmlFor="q">{t('ledger.searchLabel')}</Label>
        <Input id="q" value={filters.q} placeholder={t('ledger.search')}
               onChange={(e) => update({ q: e.target.value || undefined })} />
      </div>
      {dirty && (
        <Button variant="ghost" onClick={() => update({ account: undefined, from: undefined, to: undefined, q: undefined })}>
          {t('ledger.clear')}
        </Button>
      )}
    </div>
  )
}