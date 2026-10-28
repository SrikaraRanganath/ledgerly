import './i18n'
import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from '@/app/layout/AppLayout'
import Overview from '@/pages/Overview'
import Placeholder from '@/pages/Placeholder'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Overview />} />
          <Route path="pos" element={<Placeholder title="POS" />} />
          <Route path="ledger" element={<Placeholder title="Ledger" />} />
          <Route path="invoices" element={<Placeholder title="Invoices" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)