import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { demos, getDemoByPath } from './config/demos';

function AppContent() {
  const location = useLocation();
  const currentDemo = getDemoByPath(location.pathname);
  const activeDemo = currentDemo?.id || 'basic-search';

  const handleDemoSelect = (demoId: string) => {
    const demo = demos.find(d => d.id === demoId);
    if (demo) {
      window.location.href = demo.path;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar 
        demos={demos} 
        activeDemo={activeDemo} 
        onDemoSelect={handleDemoSelect} 
      />
      <main className="main-content">
        <Routes>
          {demos.map((demo) => (
            <Route 
              key={demo.id} 
              path={demo.path} 
              element={<demo.component />} 
            />
          ))}
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
