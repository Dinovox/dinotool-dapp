import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = {
  children: ReactNode;
  content: ReactNode;
};

export function Tooltip({ children, content }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const showTooltip = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX
    });
    setVisible(true);
  };

  const hideTooltip = () => setVisible(false);

  return (
    <>
      <span
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        style={{
          textDecoration: 'dashed underline'
        }}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              background: '#333',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '0.875rem',
              zIndex: 9999,
              pointerEvents: 'none',
              maxWidth: '300px',
              wordWrap: 'break-word',
              whiteSpace: 'normal'
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
