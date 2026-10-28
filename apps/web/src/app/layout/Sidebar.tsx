import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, LayoutDashboard, ShoppingCart, BookOpen, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/', key: 'nav.overview', icon: LayoutDashboard },
  { to: '/pos', key: 'nav.pos', icon: ShoppingCart },
  { to: '/ledger', key: 'nav.ledger', icon: BookOpen },
  { to: '/invoices', key: 'nav.invoices', icon: FileText },
]

export default function Sidebar() {
  const { t } = useTranslation()
  return (
    <aside className="w-60 shrink-0 border-e bg-card py-4 ps-4 pe-3">
      <div className="mb-6 px-3 text-lg font-semibold">{t('app.name')}</div>
      <nav className="space-y-1">
        {items.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                isActive ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent/50'
              )
            }
          >
            <Icon className="size-4" />
            <span className="flex-1 text-start">{t(key)}</span>
            <ChevronRight className="size-4 rtl:rotate-180" />
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}