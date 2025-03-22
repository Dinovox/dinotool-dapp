// components/SafeMarkdown.tsx
import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface SafeMarkdownProps {
  content: string;
}

const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content }) => {
  // Custom renderer pour forcer les liens externes
  const renderer = new marked.Renderer();

  renderer.link = ({ href, title, text }) => {
    const attrs = [
      `href="${href}"`,
      title ? `title="${title}"` : '',
      'target="_blank"',
      'rel="noopener noreferrer"'
    ]
      .filter(Boolean)
      .join(' ');

    return `<a ${attrs}>${text}</a>`;
  };

  marked.setOptions({ renderer });

  const rawHtml = marked.parse(content); // 📝 Converti Markdown → HTML
  const sanitizedHtml = DOMPurify.sanitize(
    typeof rawHtml === 'string' ? rawHtml : '',
    { ADD_ATTR: ['target'] }
  ); // 🔒 Supprime tout code dangereux
  //autorise target qui est ajouté par le renderer

  return (
    <div
      className='markdown-content'
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default SafeMarkdown;
