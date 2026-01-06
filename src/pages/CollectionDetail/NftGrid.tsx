import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CollectionNft } from 'helpers/api/accounts/getCollectionsNfts';
interface NftItem {
  identifier: string;
  name: string;
  media: { thumbnailUrl: string }[];
  metadata: {
    name: string;
    description?: string;
    attributes?: { trait_type: string; value: string }[];
  };
  url: string;
}

interface NftGridProps {
  nfts: NftItem[];
}

export const NftGrid: React.FC<{
  nfts: CollectionNft[];
}> = ({ nfts }) => {
  const navigate = useNavigate();

  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
      {nfts.map((nft) => (
        <div
          key={nft.identifier}
          className='rounded-xl shadow-md border border-gray-200 bg-white p-4 cursor-pointer hover:shadow-lg transition'
          onClick={() => navigate(`/nfts/${nft.identifier}`)}
        >
          <img
            src={nft.media?.[0]?.thumbnailUrl || '/fallback.jpg'}
            alt={nft.metadata?.name || nft.name}
            className='rounded-md w-full aspect-square object-cover mb-3'
          />
          <h3 className='font-semibold text-gray-800 text-lg truncate'>
            {nft.metadata?.name || nft.name}
          </h3>
          <p className='text-sm text-gray-500 line-clamp-2'>
            {nft.metadata?.description}
          </p>{' '}
          {nft && nft.supply && (
            <span className='text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5'>
              Supply: {nft.supply}
            </span>
          )}
          {nft &&
            nft?.metadata &&
            nft?.metadata?.attributes &&
            nft?.metadata?.attributes?.length > 0 && (
              <div className='mt-2 flex flex-wrap gap-1'>
                {nft.metadata.attributes.slice(0, 3).map((attr, i) => (
                  <span
                    key={i}
                    className='text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5'
                  >
                    {attr.trait_type}: {attr.value}
                  </span>
                ))}
              </div>
            )}
        </div>
      ))}
    </div>
  );
};
