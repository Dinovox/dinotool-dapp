import React from 'react';
import { formatAmount } from 'utils';

interface NftInfo {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
}

interface NftDisplayProps {
  nftInfo: NftInfo[];
  amount: number;
}

const NftDisplay: React.FC<NftDisplayProps> = ({ nftInfo, amount }: any) => {
  // console.log('nftInfo', nftInfo);
  return (
    <div>
      <div className='info-item'>
        <div
          className='mint-image'
          style={{ margin: 'auto', width: '168px', height: '168px' }}
        >
          {nftInfo?.media?.length > 0 &&
          nftInfo?.media[0]?.fileType === 'video/mp4' ? (
            <video controls autoPlay muted playsInline loop>
              <source src={nftInfo?.media[0]?.url} type='video/mp4' />
              Your browser does not support the video tag.
            </video>
          ) : (
            nftInfo?.media?.length > 0 &&
            nftInfo?.media[0]?.url && (
              <img src={nftInfo?.media[0]?.url} alt='SFT' />
            )
          )}
          {amount > 0 && amount.toFixed()}{' '}
          <span className='identifier'> {nftInfo?.identifier}</span>
        </div>
      </div>
    </div>
  );
};

export default NftDisplay;
