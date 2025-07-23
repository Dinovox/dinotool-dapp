import React from 'react';
import { Partner } from './../../../types/nft';
import { CheckCircle, User, Calendar, Lock } from 'lucide-react';

interface PartnerInfoProps {
  partner: Partner | null;
  address: string;
}

const PartnerInfo: React.FC<PartnerInfoProps> = ({ partner, address }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  if (!partner) {
    return (
      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6'>
        <div className='flex items-start space-x-3'>
          <User className='w-5 h-5 text-yellow-600 mt-0.5' />
          <div>
            <h3 className='font-semibold text-yellow-800 mb-1'>
              Adresse non associée à un partenaire
            </h3>
            <p className='text-sm text-yellow-700 mb-2'>
              Cette adresse wallet n'est pas encore liée à un compte partenaire
              Dinovox.
            </p>
            <p className='text-xs text-yellow-600 font-mono break-all'>
              {address}
            </p>
            <button className='mt-3 text-sm text-yellow-800 underline hover:text-yellow-900'>
              Demander une liaison partenaire
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
      <div className='flex items-start space-x-3'>
        <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
          <CheckCircle className='w-6 h-6 text-green-600' />
        </div>
        <div className='flex-1'>
          <div className='flex items-center space-x-2 mb-2'>
            <h3 className='font-semibold text-green-800'>{partner.name}</h3>
            {partner.isVerified && (
              <CheckCircle className='w-4 h-4 text-green-600' />
            )}
          </div>

          <div className='space-y-1 text-sm text-green-700'>
            {partner.email && <p>📧 {partner.email}</p>}
            <div className='flex items-center space-x-1'>
              <Calendar className='w-4 h-4' />
              <span>Partenaire depuis le {formatDate(partner.joinDate)}</span>
            </div>
            <div className='flex items-center space-x-1'>
              <Lock className='w-4 h-4' />
              <span>
                {partner.totalLockedNFTs} NFT
                {partner.totalLockedNFTs > 1 ? 's' : ''} verrouillé
                {partner.totalLockedNFTs > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <p className='text-xs text-green-600 font-mono mt-2 break-all'>
            {partner.address}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnerInfo;
