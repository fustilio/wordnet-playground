import React from 'react';

interface DemoPageProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const DemoPage: React.FC<DemoPageProps> = ({ title, description, children }) => {
  return (
    <div className="demo-page">
      <div className="demo-header">
        <h1 className="demo-title">{title}</h1>
        <p className="demo-description">{description}</p>
      </div>
      <div className="demo-content">
        {children}
      </div>
    </div>
  );
};
