// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'
import { WordNetConfigProvider, WordNetProvider } from 'wn-ts-web/react'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <WordNetConfigProvider config={{ 
      enableWorkers: true, 
      fallbackToMainThread: true
    }}>
      <WordNetProvider>
        <App />
      </WordNetProvider>
    </WordNetConfigProvider>
  // </StrictMode>,
)
