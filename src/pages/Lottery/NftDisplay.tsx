import React from 'react';
import { formatAmount } from 'utils';
import BigNumber from 'bignumber.js';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from 'hooks/useLoadTranslations';

interface NftInfo {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
}

interface NftDisplayProps {
  nftInfo: NftInfo[];
  amount: number;
  is_free?: boolean;
}

const NftDisplay: React.FC<NftDisplayProps> = ({
  nftInfo,
  amount,
  is_free = false
}: any) => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();
  return (
    <div>
      <div className='info-item'>
        <div
          className='mint-image'
          style={{ margin: 'auto', width: '168px', height: '168px' }}
        >
          {is_free && <div className='dinoFree'>{t('lotteries:free')}</div>}
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
          {amount > 0 && new BigNumber(amount).toFixed()}{' '}
          <span className='identifier'> {nftInfo?.identifier}</span>
        </div>
      </div>
    </div>
  );
};

export default NftDisplay;
