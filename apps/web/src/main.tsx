import './i18n'
import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from '@/app/layout/AppLayout'
import Overview from '@/pages/Overview'
import Placeholder from '@/pages/Placeholder'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PosPage from '@/features/pos/PosPage'
import LedgerPage from '@/features/ledger/LedgerPage'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Overview />} />
            <Route path="pos" element={<PosPage />} />
            <Route path="ledger" element={<LedgerPage />} />
            <Route path="invoices" element={<Placeholder title="Invoices" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)