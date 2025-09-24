import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SumoProviderDB } from './context/SumoContextDB';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SumoProviderDB>
      <App />
    </SumoProviderDB>
  </StrictMode>,
)
