import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { FinanceProvider } from './context/FinanceContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FinanceProvider>
      <App />
    </FinanceProvider>
  </StrictMode>,
)
