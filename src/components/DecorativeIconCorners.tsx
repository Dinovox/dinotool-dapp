import React from 'react';
import { Leaf } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

type DecorativeIconCornersProps = {
  size?: number; // base size in px
  colorClass?: string;
  opacity?: number;
  icon?: LucideIcon;
  corners?: Corner[];
  className?: string;
  animated?: boolean;
};

export const DecorativeIconCorners: React.FC<DecorativeIconCornersProps> = ({
  size = 128,
  colorClass = 'text-green-600',
  opacity = 0.3,
  icon: Icon = Leaf,
  corners = ['top-left', 'top-right'],
  className = '',
  animated = false
}) => {
  const getPositionClasses = (corner: Corner) => {
    const base = 'absolute pointer-events-none';
    const rotation =
      corner === 'top-left'
        ? '-rotate-12'
        : corner === 'top-right'
        ? 'rotate-12'
        : corner === 'bottom-left'
        ? 'rotate-45'
        : '-rotate-45';

    const position =
      corner === 'top-left'
        ? 'top-0 left-0'
        : corner === 'top-right'
        ? 'top-0 right-0'
        : corner === 'bottom-left'
        ? 'bottom-0 left-0'
        : 'bottom-0 right-0';

    return `${base} ${position} transform ${rotation}`;
  };

  return (
    <>
      {corners.map((corner) => (
        <div
          key={corner}
          className={`${getPositionClasses(corner)} ${className}`}
          style={{
            width: size,
            height: size,
            opacity
          }}
        >
          <Icon
            className={`w-full h-full ${colorClass} ${
              animated ? 'animate-pulse' : ''
            }`}
          />
        </div>
      ))}
    </>
  );
};
