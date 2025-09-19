import React, { useState, useEffect } from 'react';
import { Card } from '../components/shared/Card';
import { useWordNetContext } from "wn-ts-web/react";
import { createScopedLogger } from '../../../packages/utils/logger';

const logger = createScopedLogger('ProjectList');

interface Project {
  id: string;
  label: string;
  language: string;
  version: string;
  description?: string;
  license?: string;
  url?: string;
}

export const ProjectList: React.FC = () => {
  const { availablePackages, refreshPackages } = useWordNetContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [popularProjects, setPopularProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'language' | 'version'>('name');

  useEffect(() => {
    const loadProjects = async () => {
      logger.start('loading available projects');
      
      try {
        await refreshPackages();
        
        const projectList: Project[] = availablePackages.map(pkg => ({
          id: pkg.id,
          label: pkg.label || pkg.id,
          language: pkg.language || 'unknown',
          version: pkg.versions?.[0] || 'unknown',
          description: `${pkg.language || 'Unknown'} WordNet ${pkg.versions?.[0] || 'Unknown'}`,
          license: 'Unknown',
          url: `https://wordnet.princeton.edu/`
        }));
        
        setProjects(projectList);
        
        // Identify popular projects (OEWN, CILI, etc.)
        const popular = projectList.filter(p => 
          p.id.startsWith('oewn') || 
          p.id.startsWith('cili') || 
          p.id.startsWith('omw-')
        );
        setPopularProjects(popular);
        
        logger.success('Projects loaded successfully', { 
          totalCount: projectList.length,
          popularCount: popular.length
        });
        logger.end('loading available projects', { totalCount: projectList.length });
      } catch (error) {
        logger.fail('Failed to load projects', error);
        logger.end('loading available projects');
      }
    };

    loadProjects();
  }, [availablePackages, refreshPackages]);

  const filteredProjects = projects.filter(project =>
    project.label.toLowerCase().includes(filter.toLowerCase()) ||
    project.language.toLowerCase().includes(filter.toLowerCase()) ||
    project.id.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.label.localeCompare(b.label);
      case 'language':
        return a.language.localeCompare(b.language);
      case 'version':
        return b.version.localeCompare(a.version); // Newer versions first
      default:
        return 0;
    }
  });

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      en: 'bg-blue-100 text-blue-800',
      fr: 'bg-red-100 text-red-800',
      es: 'bg-yellow-100 text-yellow-800',
      de: 'bg-gray-100 text-gray-800',
      it: 'bg-green-100 text-green-800',
      pt: 'bg-purple-100 text-purple-800',
      th: 'bg-orange-100 text-orange-800',
      ja: 'bg-pink-100 text-pink-800',
      zh: 'bg-indigo-100 text-indigo-800'
    };
    return colors[language] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card title="Available WordNet Projects">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Browse and search through available WordNet projects and lexicons.
          </p>
          
          {/* Popular Projects */}
          {popularProjects.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">🌟 Popular Projects</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {popularProjects.map(project => (
                  <div key={project.id} className="bg-white p-3 rounded-md border border-blue-200">
                    <div className="font-medium text-blue-900">{project.label}</div>
                    <div className="text-sm text-blue-700">{project.language} • {project.version}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search projects..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="language">Sort by Language</option>
              <option value="version">Sort by Version</option>
            </select>
          </div>

          {/* Project Count */}
          <div className="text-sm text-gray-600">
            Showing {sortedProjects.length} of {projects.length} projects
          </div>

          {/* Projects List */}
          <div className="space-y-3">
            {sortedProjects.map(project => (
              <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{project.label}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLanguageColor(project.language)}`}>
                        {project.language.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        v{project.version}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>ID: {project.id}</span>
                      {project.license && <span>License: {project.license}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sortedProjects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {filter ? 'No projects match your search.' : 'No projects available.'}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
