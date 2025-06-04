import React from 'react';

interface GridProps {
  columns?: number;
  gap?: string;
  className?: string;
  children: React.ReactNode;
}

export const Grid: React.FC<GridProps> = ({
  columns = 2,
  gap = 'gap-4',
  className = '',
  children
}) => {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-${columns} ${gap} ${className}`}
    >
      {children}
    </div>
  );
};
