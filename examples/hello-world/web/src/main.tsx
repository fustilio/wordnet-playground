import { createRoot } from 'react-dom/client';
import App from './App';
import { WordNetConfigProvider, WordNetProvider } from 'wn-react';

createRoot(document.getElementById('root')!).render(
  <WordNetConfigProvider config={{ enableWorkers: true, fallbackToMainThread: true }}>
    <WordNetProvider>
      <App />
    </WordNetProvider>
  </WordNetConfigProvider>
);

