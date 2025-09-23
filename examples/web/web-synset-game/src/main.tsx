import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { WordNetConfigProvider, WordNetProvider } from 'wn-ts-web/react'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WordNetConfigProvider config={{
    enableWorkers: true,
    fallbackToMainThread: true
  }}>
    <WordNetProvider>
      <App />
    </WordNetProvider>
  </WordNetConfigProvider>
)
