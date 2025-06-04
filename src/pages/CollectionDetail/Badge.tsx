import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'green' | 'gray' | 'red' | 'yellow';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  color = 'gray',
  className = ''
}) => {
  const colorMap = {
    green: 'bg-green-100 text-green-800',
    gray: 'bg-gray-100 text-gray-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <span
      className={clsx(
        'inline-block px-3 py-1 text-sm font-medium rounded-full',
        colorMap[color],
        className
      )}
    >
      {children}
    </span>
  );
};
