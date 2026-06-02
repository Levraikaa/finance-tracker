import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { FinanceProvider } from './context/FinanceContext.jsx'
import { CategoryOverridesProvider } from './context/CategoryOverridesContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CategoryOverridesProvider>
      <FinanceProvider>
        <App />
      </FinanceProvider>
    </CategoryOverridesProvider>
  </StrictMode>,
)
