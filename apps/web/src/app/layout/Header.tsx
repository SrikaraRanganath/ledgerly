import { useTranslation } from 'react-i18next'
import LanguageToggle from './LanguageToggle'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const { t } = useTranslation()
  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <h1 className="text-base font-medium">{t('header.title')}</h1>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}