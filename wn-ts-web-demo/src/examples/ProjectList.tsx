import React from 'react';
import { getAvailableProjects, getPopularProjects } from '../utils/project-list';

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const availableProjects = getAvailableProjects();
      const popularProjects = getPopularProjects();
      
      console.log('Available projects:', availableProjects.length);
      console.log('Popular projects:', popularProjects);
      
      setProjects(popularProjects);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="p-4">Loading projects...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Available WordNet Projects</h2>
      <div className="grid gap-4">
        {projects.map((project) => (
          <div key={project.id} className="border rounded p-4">
            <h3 className="font-semibold">{project.label}</h3>
            <p className="text-sm text-gray-600">ID: {project.id}</p>
            <p className="text-sm text-gray-600">Language: {project.language || 'Unknown'}</p>
            <p className="text-sm text-gray-600">Versions: {project.versions.join(', ')}</p>
            {project.license && (
              <p className="text-sm text-gray-600">License: {project.license}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
