import React from 'react';
import { Breadcrumb } from 'components/ui/Breadcrumb';
import './PageTemplate.css';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageTemplateProps {
  title: string;
  breadcrumbItems: BreadcrumbItem[];
  children: React.ReactNode;
  maxWidth?: string; // Default: '1400px'
  showTitle?: boolean; // Default: true
  className?: string;
}

export const PageTemplate: React.FC<PageTemplateProps> = ({
  title,
  breadcrumbItems,
  children,
  maxWidth = '1400px',
  showTitle = true,
  className = ''
}) => {
  return (
    <div className={`page-template-wrapper ${className}`}>
      <div className='page-template-container' style={{ maxWidth }}>
        {/* Page Title */}
        {showTitle && title && (
          <div className='page-template-title-wrapper'>
            <div className='mintGazTitle dinoTitle'>{title}</div>
          </div>
        )}
        {/* Breadcrumb Navigation */}
        <div className='page-template-breadcrumb'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Main Content */}
        <div className='page-template-content'>{children}</div>
      </div>
    </div>
  );
};
