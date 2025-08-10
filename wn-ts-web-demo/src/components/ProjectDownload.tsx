import React, { useState } from 'react';

interface Project {
  id: string;
  name: string;
  version: string;
  description: string;
  url: string;
  size: number;
  language: string;
  lastUpdated: string;
  status: 'available' | 'downloading' | 'downloaded' | 'error';
}

interface DownloadProgress {
  projectId: string;
  downloaded: number;
  total: number;
  speed: number;
  eta: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error';
}

interface ProjectDownloadProps {
  onProjectDownloaded?: (project: Project) => void;
}

export const ProjectDownload: React.FC<ProjectDownloadProps> = ({
  onProjectDownloaded
}) => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'oewn:2024',
      name: 'Open English WordNet',
      version: '2024',
      description: 'Comprehensive English WordNet with latest updates',
      url: 'https://github.com/globalwordnet/english-wordnet/releases/latest/download/oewn-2024.sqlite',
      size: 15728640, // 15MB
      language: 'eng',
      lastUpdated: '2024-01-15',
      status: 'available'
    },
    {
      id: 'omw-fr:1.4',
      name: 'Open Multilingual WordNet - French',
      version: '1.4',
      description: 'French WordNet with comprehensive coverage',
      url: 'https://github.com/omwn/omw-data/releases/latest/download/omw-fr-1.4.sqlite',
      size: 8388608, // 8MB
      language: 'fra',
      lastUpdated: '2023-12-20',
      status: 'available'
    },
    {
      id: 'omw-es:1.4',
      name: 'Open Multilingual WordNet - Spanish',
      version: '1.4',
      description: 'Spanish WordNet with extensive vocabulary',
      url: 'https://github.com/omwn/omw-data/releases/latest/download/omw-es-1.4.sqlite',
      size: 10485760, // 10MB
      language: 'spa',
      lastUpdated: '2023-12-20',
      status: 'available'
    },
    {
      id: 'omw-de:1.4',
      name: 'Open Multilingual WordNet - German',
      version: '1.4',
      description: 'German WordNet with detailed semantic relations',
      url: 'https://github.com/omwn/omw-data/releases/latest/download/omw-de-1.4.sqlite',
      size: 12582912, // 12MB
      language: 'deu',
      lastUpdated: '2023-12-20',
      status: 'available'
    }
  ]);

  const [downloadQueue, setDownloadQueue] = useState<DownloadProgress[]>([]);
  const [showDownloadManager, setShowDownloadManager] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');

  // Filter projects based on search and language
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = !filterLanguage || project.language === filterLanguage;
    return matchesSearch && matchesLanguage;
  });

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format download speed
  const formatSpeed = (bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s';
  };

  // Format ETA
  const formatETA = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  // Simulate download progress
  const simulateDownload = async (project: Project) => {
    const progress: DownloadProgress = {
      projectId: project.id,
      downloaded: 0,
      total: project.size,
      speed: 0,
      eta: 0,
      status: 'downloading'
    };

    setDownloadQueue(prev => [...prev, progress]);

    // Update project status
    setProjects(prev => prev.map(p => 
      p.id === project.id ? { ...p, status: 'downloading' } : p
    ));

    // Simulate download with progress updates
    const startTime = Date.now();
    const chunkSize = 1024 * 1024; // 1MB chunks
    let downloaded = 0;

    while (downloaded < project.size) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
      
      downloaded += chunkSize;
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = downloaded / elapsed;
      const eta = (project.size - downloaded) / speed;

      setDownloadQueue(prev => prev.map(p => 
        p.projectId === project.id 
          ? { ...p, downloaded, speed, eta }
          : p
      ));
    }

    // Mark as completed
    setDownloadQueue(prev => prev.map(p => 
      p.projectId === project.id 
        ? { ...p, status: 'completed' }
        : p
    ));

    setProjects(prev => prev.map(p => 
      p.id === project.id ? { ...p, status: 'downloaded' } : p
    ));

    // Remove from queue after a delay
    setTimeout(() => {
      setDownloadQueue(prev => prev.filter(p => p.projectId !== project.id));
    }, 3000);

    onProjectDownloaded?.(project);
  };

  // Pause download
  const pauseDownload = (projectId: string) => {
    setDownloadQueue(prev => prev.map(p => 
      p.projectId === projectId 
        ? { ...p, status: 'paused' }
        : p
    ));
  };

  // Resume download
  const resumeDownload = (projectId: string) => {
    setDownloadQueue(prev => prev.map(p => 
      p.projectId === projectId 
        ? { ...p, status: 'downloading' }
        : p
    ));
  };

  // Cancel download
  const cancelDownload = (projectId: string) => {
    setDownloadQueue(prev => prev.filter(p => p.projectId !== projectId));
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, status: 'available' } : p
    ));
  };

  return (
    <div className="project-download-section">
      <div className="section-header">
        <h3>Project Download Manager</h3>
        <div className="header-controls">
          <button
            onClick={() => setShowDownloadManager(!showDownloadManager)}
            className="toggle-button"
          >
            {showDownloadManager ? 'Hide' : 'Show'} Download Manager
          </button>
        </div>
      </div>

      {showDownloadManager && (
        <>
          {/* Search and Filter Controls */}
          <div className="filter-controls">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="language-filter"
            >
              <option value="">All Languages</option>
              <option value="eng">English</option>
              <option value="fra">French</option>
              <option value="spa">Spanish</option>
              <option value="deu">German</option>
            </select>
          </div>

          {/* Project List */}
          <div className="project-grid">
            {filteredProjects.map(project => {
              const downloadProgress = downloadQueue.find(p => p.projectId === project.id);
              const progressPercentage = downloadProgress 
                ? (downloadProgress.downloaded / downloadProgress.total) * 100 
                : 0;

              return (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <h4>{project.name}</h4>
                    <span className={`status-badge ${project.status}`}>
                      {project.status}
                    </span>
                  </div>
                  
                  <p className="project-description">{project.description}</p>
                  
                  <div className="project-meta">
                    <span>Version: {project.version}</span>
                    <span>Language: {project.language.toUpperCase()}</span>
                    <span>Size: {formatFileSize(project.size)}</span>
                    <span>Updated: {project.lastUpdated}</span>
                  </div>

                  {downloadProgress && (
                    <div className="download-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <div className="progress-details">
                        <span>{formatFileSize(downloadProgress.downloaded)} / {formatFileSize(downloadProgress.total)}</span>
                        <span>{formatSpeed(downloadProgress.speed)}</span>
                        <span>ETA: {formatETA(downloadProgress.eta)}</span>
                      </div>
                      <div className="progress-controls">
                        {downloadProgress.status === 'downloading' && (
                          <button onClick={() => pauseDownload(project.id)} className="control-button">
                            Pause
                          </button>
                        )}
                        {downloadProgress.status === 'paused' && (
                          <button onClick={() => resumeDownload(project.id)} className="control-button">
                            Resume
                          </button>
                        )}
                        <button onClick={() => cancelDownload(project.id)} className="control-button cancel">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {!downloadProgress && project.status === 'available' && (
                    <button
                      onClick={() => simulateDownload(project)}
                      className="download-button"
                      disabled={downloadQueue.some(p => p.status === 'downloading')}
                    >
                      Download
                    </button>
                  )}

                  {project.status === 'downloaded' && (
                    <div className="downloaded-indicator">
                      ✓ Downloaded
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Download Queue */}
          {downloadQueue.length > 0 && (
            <div className="download-queue">
              <h4>Download Queue ({downloadQueue.length})</h4>
              <div className="queue-items">
                {downloadQueue.map(progress => {
                  const project = projects.find(p => p.id === progress.projectId);
                  if (!project) return null;

                  return (
                    <div key={progress.projectId} className="queue-item">
                      <div className="queue-item-info">
                        <span className="project-name">{project.name}</span>
                        <span className="progress-text">
                          {formatFileSize(progress.downloaded)} / {formatFileSize(progress.total)}
                        </span>
                      </div>
                      <div className="queue-item-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${(progress.downloaded / progress.total) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="queue-item-controls">
                        <span className="speed">{formatSpeed(progress.speed)}</span>
                        <span className="eta">ETA: {formatETA(progress.eta)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}; 