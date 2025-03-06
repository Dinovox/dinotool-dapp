import React from 'react';
import { formatAmount } from 'utils';
import notFound from './esdtnotfound.svg';

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
}

const EsdtDisplay: React.FC<EsdtDisplayProps> = ({
  esdtInfo,
  amount,
  is_free = false
}: any) => {
  return (
    <div>
      <div className='info-item'>
        {esdtInfo && esdtInfo.identifier == 'EGLD-000000' ? (
          <>
            <div
              className='mint-image'
              style={{ margin: 'auto', width: '168px', height: '168px' }}
            >
              {is_free && <div className='dinoFree'>FREE</div>}
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
                EGLD
              </span>{' '}
            </div>
          </>
        ) : (
          <>
            <div
              className='mint-image'
              style={{ margin: 'auto', width: '168px', height: '168px' }}
            >
              {is_free && <div className='dinoFree'>FREE</div>}
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
                {esdtInfo?.identifier}
              </span>
            </div>
          </>
        )}{' '}
      </div>
    </div>
  );
};

export default EsdtDisplay;
