import React, { useState } from 'react';
import './ShortenedAddress.css'; // Assurez-vous de créer un fichier CSS pour les styles
import { FaRegCopy, FaRegCheckSquare } from 'react-icons/fa'; // Utilisez react-icons pour l'icône de copie

const TextCopy = ({ text }: any) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Réinitialiser le statut après 2 secondes
  };

  if (!text) {
    return <></>;
  }
  return (
    <div className='shortened-address'>
      <span className='address-text'>{text}</span>

      {copied ? (
        <span className='copied-text'>
          <FaRegCheckSquare />
        </span>
      ) : (
        <button
          className='copy-button'
          onClick={copyToClipboard}
          title='Copy to clipboard'
        >
          <FaRegCopy />
        </button>
      )}
    </div>
  );
};

export default TextCopy;
