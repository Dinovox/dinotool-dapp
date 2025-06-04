import React from 'react';

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <section
      className={`mb-8 p-4 border border-gray-200 rounded-xl bg-white shadow-sm ${className}`}
    >
      {title && (
        <h2 className='text-lg font-semibold text-gray-800 mb-4'>{title}</h2>
      )}
      <div>{children}</div>
    </section>
  );
};
