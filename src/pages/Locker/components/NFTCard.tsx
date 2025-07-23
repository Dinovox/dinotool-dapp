import React from 'react';
import { LockedNFT, NFT } from '../../../types/nft';
import { Lock, Calendar, Star, LockOpen } from 'lucide-react';
import { ActionUnlockNft } from '../helpers/ActionUnlock';
import { bigNumToHex } from 'helpers/bigNumToHex';
import BigNumber from 'bignumber.js';

interface NFTCardProps {
  nft: NFT;
  lockedNft?: LockedNFT;
  isSelected?: boolean;
  isLocked?: boolean;
  unlockTimestamp?: Date;
  onSelect?: (nft: NFT) => void;
  selectable?: boolean;
}

const NFTCard: React.FC<NFTCardProps> = ({
  nft,
  lockedNft,
  isSelected = false,
  isLocked = false,
  unlockTimestamp,
  onSelect,
  selectable = true
}) => {
  console.log('NFTCard rendered for:', lockedNft);
  console.log('NFTCard props:', lockedNft?.lockId);
  const getImageUrl = () => {
    if (nft.media && nft.media.length > 0) {
      return nft.media[0].thumbnailUrl || nft.media[0].url;
    }
    return (
      nft.url ||
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
    );
  };

  const getRarityColor = () => {
    const rarity = nft.metadata?.attributes?.find(
      (attr) => attr.trait_type === 'Rarity'
    )?.value;
    switch (rarity) {
      case 'Legendary':
        return 'text-yellow-500';
      case 'Epic':
        return 'text-purple-500';
      case 'Rare':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div
      className={`
        relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 
        ${selectable ? 'cursor-pointer hover:shadow-xl hover:scale-105' : ''}
        ${isSelected ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}
        ${isLocked ? 'opacity-75' : ''}
      `}
      onClick={() => selectable && onSelect && onSelect(nft)}
    >
      {/* Badge de verrouillage */}
      {isLocked && (
        <>
          {unlockTimestamp && new Date() > unlockTimestamp ? (
            <div className='absolute top-2 left-2 z-10 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1'>
              <LockOpen className='w-3 h-3' />
              <span>Libérable</span>
            </div>
          ) : (
            <div className='absolute top-2 left-2 z-10 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1'>
              <Lock className='w-3 h-3' />
              <span>Verrouillé</span>
            </div>
          )}
        </>
      )}

      {/* Badge de sélection */}
      {isSelected && selectable && (
        <div className='absolute top-2 right-2 z-10 bg-blue-500 text-white rounded-full p-1'>
          <div className='w-4 h-4 bg-white rounded-full flex items-center justify-center'>
            <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
          </div>
        </div>
      )}

      {/* Image du NFT */}
      <div className='aspect-square overflow-hidden'>
        <img
          src={getImageUrl()}
          alt={nft.name}
          className='w-full h-full object-cover'
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src =
              'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400';
          }}
        />
      </div>

      {/* Informations du NFT */}
      <div className='p-4'>
        <h3 className='font-bold text-lg text-gray-800 mb-1 truncate'>
          {nft.name}
        </h3>
        <p className='text-sm text-gray-500 mb-2 truncate'>
          #{nft.identifier}-{bigNumToHex(new BigNumber(nft.nonce))}
        </p>

        {/* Attributs */}
        {nft.metadata?.attributes && (
          <div className='flex flex-wrap gap-1 mb-3'>
            {Array.isArray(nft.metadata.attributes) &&
              nft.metadata.attributes.slice(0, 2).map((attr, index) => (
                <span
                  key={index}
                  className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${
                    attr.trait_type === 'Rarity'
                      ? getRarityColor()
                      : 'text-gray-600'
                  }`}
                >
                  {attr.trait_type === 'Rarity' && (
                    <Star className='w-3 h-3 inline mr-1' />
                  )}
                  {attr.value}
                </span>
              ))}
          </div>
        )}

        {/* Date de déverrouillage si verrouillé */}
        {unlockTimestamp && (
          <div className='flex items-center space-x-1 text-sm text-red-600 bg-red-50 px-2 py-1 rounded'>
            {unlockTimestamp && new Date() > unlockTimestamp ? (
              <ActionUnlockNft lockId={lockedNft?.lockId} />
            ) : (
              <>
                {' '}
                <Calendar className='w-4 h-4' />
                <span>Verrouillé</span>
                <span>Jusqu'au {formatDate(unlockTimestamp)}</span>
                {/* <span className='text-xs text-gray-500'>
                  lockID : {lockedNft?.lockId?.toString()}
                </span> */}
              </>
            )}
          </div>
        )}

        {/* Collection */}
        <div className='text-xs text-gray-400 mt-2 truncate'>
          Collection: {nft.collection ? nft.collection : nft.identifier}
        </div>
      </div>
    </div>
  );
};

export default NFTCard;
