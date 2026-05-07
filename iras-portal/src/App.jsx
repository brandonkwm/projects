import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import PaymentPlan from './pages/PaymentPlan'
import AdjustmentWizard from './pages/AdjustmentWizard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="payment-plan" element={<PaymentPlan />} />
          <Route path="payment-plan/adjust" element={<AdjustmentWizard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
