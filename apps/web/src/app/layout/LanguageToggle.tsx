import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export default function LanguageToggle() {
  const { t, i18n } = useTranslation()
  const next = i18n.language === 'ar' ? 'en' : 'ar'
  return (
    <Button variant="outline" size="sm" onClick={() => i18n.changeLanguage(next)}>
      {t('header.switchLanguage')}
    </Button>
  )
}