import React, { useState } from 'react';
import './ShortenedAddress.css'; // Assurez-vous de créer un fichier CSS pour les styles
import { FaRegCopy } from 'react-icons/fa'; // Utilisez react-icons pour l'icône de copie
import { useGetNetworkConfig } from 'hooks';

const ShortenedAddress = ({ address }: any) => {
  const [copied, setCopied] = useState(false);
  const { network } = useGetNetworkConfig();

  const shortenedAddress = `${address.slice(0, 6)}...${address.slice(-6)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Réinitialiser le statut après 2 secondes
  };

  if (!address) {
    return <></>;
  }
  return (
    <div className='shortened-address'>
      <span className='address-text'>
        <a
          href={network.explorerAddress + '/accounts/' + address}
          target='_blank'
          rel='noreferrer'
        >
          {shortenedAddress}
        </a>
      </span>
      <button
        className='copy-button'
        onClick={copyToClipboard}
        title='Copy to clipboard'
      >
        <FaRegCopy />
      </button>
      {copied && <span className='copied-text'>Copied!</span>}
    </div>
  );
};

export default ShortenedAddress;
