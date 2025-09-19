import React from 'react';

export interface DemoItem {
  id: string;
  title: string;
  description: string;
  path: string;
}

interface SidebarProps {
  demos: DemoItem[];
  activeDemo: string;
  onDemoSelect: (demoId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ demos, activeDemo, onDemoSelect }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>wn-ts-web Showcase</h2>
        <p>Interactive demos and examples</p>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="demo-list">
          {demos.map((demo) => (
            <li key={demo.id} className="demo-item">
              <button
                className={`demo-button ${activeDemo === demo.id ? 'active' : ''}`}
                onClick={() => onDemoSelect(demo.id)}
              >
                <div className="demo-title">{demo.title}</div>
                <div className="demo-description">{demo.description}</div>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
