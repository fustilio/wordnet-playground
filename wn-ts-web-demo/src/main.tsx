import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'
import { WordNetProvider } from './contexts/WordNetContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WordNetProvider>
      <App />
    </WordNetProvider>
  </StrictMode>,
)
