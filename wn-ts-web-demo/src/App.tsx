
import { FullWordNetDemo } from './components/FullWordNetDemo';
import { ProjectList } from './components/ProjectList';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">WordNet TypeScript Demo</h1>
        
        {/* Project List Test */}
        <div className="mb-8">
          <ProjectList />
        </div>
        
        {/* Main Demo */}
        <FullWordNetDemo />
      </div>
    </div>
  );
}

export default App;
