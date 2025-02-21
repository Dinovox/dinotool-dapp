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
}

const EsdtDisplay: React.FC<EsdtDisplayProps> = ({ esdtInfo, amount }: any) => {
  return (
    <div>
      <div className='info-item'>
        <span className='text-label'></span>{' '}
        {esdtInfo && esdtInfo.identifier == 'EGLD-000000' ? (
          <>
            <div className='mint-image' style={{ margin: 'auto' }}>
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
              </span>
            </div>
          </>
        ) : (
          <>
            <div className='mint-image' style={{ margin: 'auto' }}>
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
                {esdtInfo.identifier}
              </span>
            </div>
          </>
        )}{' '}
      </div>
    </div>
  );
};

export default EsdtDisplay;
