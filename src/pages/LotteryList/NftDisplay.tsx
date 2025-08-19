import React from 'react';
import { formatAmount } from 'lib';
import BigNumber from 'bignumber.js';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useGetNetworkConfig } from 'lib';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink } from '@fortawesome/free-solid-svg-icons';
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
  is_locked?: boolean;
}

const NftDisplay: React.FC<NftDisplayProps> = ({
  nftInfo,
  amount,
  is_free = false,
  is_locked = false
}: any) => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();
  const { network } = useGetNetworkConfig();
  return (
    <div>
      <div className='info-item'>
        <div
          className='mint-image'
          style={{ margin: 'auto', width: '168px', height: '188px' }}
        >
          {is_free && <div className='dinoFree'>{t('lotteries:free')}</div>}
          {is_locked && (
            <div className='dinoFree'>
              {t('lotteries:locked')}{' '}
              <span className='tooltip'>
                (ℹ)
                <span className='text'>{t('lotteries:locked_tooltip')}</span>
              </span>
            </div>
          )}
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
          <span className='identifier'>
            <a
              href={`${network.explorerAddress}/nfts/${nftInfo?.identifier}`}
              target='_blank'
              rel='noreferrer'
            >
              {nftInfo?.identifier}{' '}
              <FontAwesomeIcon
                icon={faLink}
                style={{
                  fontSize: '12px',
                  marginLeft: '5px',
                  color: '#7195df'
                }}
              />
            </a>{' '}
            {is_free && (
              <span className='tooltip'>
                (ℹ)
                <span className='text'>{t('lotteries:free_tooltip')}</span>
              </span>
            )}{' '}
            {is_locked && (
              <span className='tooltip'>
                (ℹ)
                <span className='text'>{t('lotteries:locked_tooltip')}</span>
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NftDisplay;
