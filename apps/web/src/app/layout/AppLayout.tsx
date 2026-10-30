import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header.tsx'
import { Toaster } from 'sonner'
import { useTranslation } from 'react-i18next'

export default function AppLayout() {

  const i18n = useTranslation().i18n

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 p-6"><Outlet /></main>
      </div>
      <Toaster richColors dir={i18n.dir()} position="bottom-center" />
    </div>
  )
}