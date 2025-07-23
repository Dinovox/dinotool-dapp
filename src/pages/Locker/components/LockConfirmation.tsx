import React, { useState } from 'react';
import { NFT } from '../../../types/nft';
import { Lock, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

interface LockConfirmationProps {
  nft: NFT;
  duration: number | null;
  customDate: Date | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const LockConfirmation: React.FC<LockConfirmationProps> = ({
  nft,
  duration,
  customDate,
  onConfirm,
  onCancel
}) => {
  const [isLocking, setIsLocking] = useState(false);

  const getUnlockDate = () => {
    if (customDate) return customDate;
    if (duration) {
      const date = new Date();
      date.setDate(date.getDate() + duration);
      return date;
    }
    return null;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDurationText = () => {
    if (customDate) {
      const now = new Date();
      const diffTime = customDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
    return `${duration} jour${duration && duration > 1 ? 's' : ''}`;
  };

  const handleConfirm = async () => {
    setIsLocking(true);
    try {
      await onConfirm();
    } finally {
      setIsLocking(false);
    }
  };

  const unlockDate = getUnlockDate();

  return (
    <div className='bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto'>
      <div className='text-center mb-6'>
        <div className='w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <Lock className='w-8 h-8 text-yellow-600' />
        </div>
        <h2 className='text-2xl font-bold text-gray-800 mb-2'>
          Confirmer le verrouillage
        </h2>
        <p className='text-gray-600'>
          Vous êtes sur le point de verrouiller ce NFT
        </p>
      </div>

      {/* Récapitulatif du NFT */}
      <div className='bg-gray-50 rounded-lg p-4 mb-6'>
        <div className='flex items-center space-x-4'>
          <img
            src={
              nft.media?.[0]?.thumbnailUrl ||
              nft.url ||
              'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200'
            }
            alt={nft.name}
            className='w-16 h-16 rounded-lg object-cover'
          />
          <div className='flex-1'>
            <h3 className='font-semibold text-gray-800'>{nft.name}</h3>
            <p className='text-sm text-gray-500'>#{nft.nonce}</p>
            <p className='text-xs text-gray-400'>{nft.collection}</p>
          </div>
        </div>
      </div>

      {/* Détails du verrouillage */}
      <div className='space-y-4 mb-6'>
        <div className='flex justify-between items-center py-2 border-b border-gray-200'>
          <span className='text-gray-600'>Durée :</span>
          <span className='font-semibold text-gray-800'>
            {getDurationText()}
          </span>
        </div>

        {unlockDate && (
          <div className='flex items-start space-x-2 py-2'>
            <Calendar className='w-5 h-5 text-blue-500 mt-0.5' />
            <div>
              <div className='text-sm text-gray-600'>Déverrouillage le :</div>
              <div className='font-semibold text-gray-800'>
                {formatDate(unlockDate)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Avertissement */}
      <div className='bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6'>
        <div className='flex items-start space-x-2'>
          <AlertTriangle className='w-5 h-5 text-orange-500 mt-0.5' />
          <div className='text-sm text-orange-700'>
            <p className='font-semibold mb-1'>Attention :</p>
            <p>
              Une fois verrouillé, ce NFT ne pourra pas être transféré, vendu ou
              déplacé jusqu'à la date de déverrouillage. Cette action est
              irréversible.
            </p>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className='flex space-x-3'>
        <button
          onClick={onCancel}
          disabled={isLocking}
          className='flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50'
        >
          Annuler
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLocking}
          className='flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2'
        >
          {isLocking ? (
            <>
              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
              <span>Verrouillage...</span>
            </>
          ) : (
            <>
              <Lock className='w-4 h-4' />
              <span>Verrouiller le NFT</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LockConfirmation;
