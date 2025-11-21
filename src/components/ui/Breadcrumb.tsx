import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faHome } from '@fortawesome/free-solid-svg-icons';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className = ''
}) => {
  return (
    <nav aria-label='Breadcrumb' className={`flex ${className}`}>
      <ol className='flex items-center space-x-2'>
        {/* Home Icon/Link always present or passed as first item? 
            Let's assume the caller passes "Home" if they want it, 
            or we can prepend it. For flexibility, we'll let the caller define items.
            But a common pattern is to always have a home icon. 
            Let's stick to the props for now to be generic. 
        */}

        {/* Optional: Prepend Home if not in items, or just rely on items. 
            Let's rely on items for full control. 
        */}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className='flex items-center'>
              {index > 0 && (
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className='mx-2 h-3 w-3 text-gray-400'
                />
              )}
              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  className='text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors'
                >
                  {item.label === 'Home' ? (
                    <FontAwesomeIcon icon={faHome} className='h-4 w-4' />
                  ) : (
                    item.label
                  )}
                </Link>
              ) : (
                <span
                  className={`text-sm font-medium ${
                    isLast ? 'text-gray-900' : 'text-gray-500'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label === 'Home' ? (
                    <FontAwesomeIcon icon={faHome} className='h-4 w-4' />
                  ) : (
                    item.label
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
