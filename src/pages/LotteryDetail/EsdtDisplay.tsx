import React from 'react';
import { formatAmount } from 'lib';
import notFound from './esdtnotfound.svg';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';

interface EsdtInfo {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
}

interface EsdtDisplayProps {
  esdtInfo: EsdtInfo[];
  amount: number;
  is_free?: boolean;
  is_locked?: boolean;
}

const EsdtDisplay: React.FC<EsdtDisplayProps> = ({
  esdtInfo,
  amount,
  is_free = false,
  is_locked = false
}: any) => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();
  return (
    <div>
      <div className='info-item'>
        {esdtInfo && esdtInfo.identifier == 'EGLD-000000' ? (
          <>
            <div
              className='mint-image'
              style={{ margin: 'auto', width: '168px', height: '168px' }}
            >
              {is_free && <div className='dinoFree'>{t('lotteries:free')}</div>}
              {is_locked && (
                <div className='dinoFree'>
                  {t('lotteries:locked')}{' '}
                  <span className='tooltip'>
                    (ℹ)
                    <span className='text'>
                      {t('lotteries:locked_tooltip')}
                    </span>
                  </span>
                </div>
              )}
              <img
                src={
                  esdtInfo?.assets?.svgUrl ? esdtInfo.assets.svgUrl : notFound
                }
                alt='SFT'
              />
              <span className='identifier'>
                {' '}
                {formatAmount({
                  input: amount.toFixed(),
                  decimals: esdtInfo?.decimals ? esdtInfo?.decimals : 0,
                  digits: 2,
                  showLastNonZeroDecimal: true,
                  addCommas: true
                })}{' '}
                EGLD{' '}
                {is_free && (
                  <span className='tooltip'>
                    (ℹ)
                    <span className='text'>{t('lotteries:free_tooltip')}</span>
                  </span>
                )}
                {is_locked && (
                  <span className='tooltip'>
                    (ℹ)
                    <span className='text'>
                      {t('lotteries:locked_tooltip')}
                    </span>
                  </span>
                )}
              </span>{' '}
            </div>
          </>
        ) : (
          <>
            <div
              className='mint-image'
              style={{ margin: 'auto', width: '168px', height: '188px' }}
            >
              {is_free && <div className='dinoFree'>{t('lotteries:free')}</div>}
              {is_locked && (
                <div className='dinoFree'>{t('lotteries:locked')}</div>
              )}
              <img
                src={
                  esdtInfo?.assets?.svgUrl ? esdtInfo.assets.svgUrl : notFound
                }
                alt='SFT'
              />

              <span className='identifier'>
                {' '}
                {formatAmount({
                  input: amount.toFixed(),
                  decimals: esdtInfo?.decimals ? esdtInfo?.decimals : 0,
                  digits: 2,
                  showLastNonZeroDecimal: true,
                  addCommas: true
                })}{' '}
                {esdtInfo?.identifier}{' '}
                {is_free && (
                  <span className='tooltip'>
                    (ℹ)
                    <span className='text'>{t('lotteries:free_tooltip')}</span>
                  </span>
                )}{' '}
                {is_locked && (
                  <span className='tooltip'>
                    (ℹ)
                    <span className='text'>
                      {t('lotteries:locked_tooltip')}
                    </span>
                  </span>
                )}
              </span>
            </div>
          </>
        )}{' '}
      </div>
    </div>
  );
};

export default EsdtDisplay;
