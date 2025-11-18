// DisplayNftByToken.tsx
import React from 'react';
import { useGetNftInformations } from 'pages/LotteryList/Transaction/helpers/useGetNftInformation';
import type { UserNft } from './useGetUserNft';
import DisplayNft from './DisplayNft';

type DisplayNftByTokenProps = {
  tokenIdentifier: string;
  nonce: string;
  amount?: string | number;
  type?: string; // pour passer "ESDT" / "ignore" si besoin
  className?: string;
  badgeLabel?: string;
  loadingPlaceholder?: React.ReactNode;
};

export const DisplayNftByToken: React.FC<DisplayNftByTokenProps> = ({
  tokenIdentifier,
  nonce,
  amount,
  type,
  className,
  badgeLabel,
  loadingPlaceholder
}) => {
  const esdtInfo: any = useGetNftInformations(tokenIdentifier, nonce, type);

  const isLoading =
    !esdtInfo || !esdtInfo.identifier || esdtInfo.identifier === '';

  if (isLoading) {
    return (
      <div
        className={
          className ||
          'rounded-2xl border border-gray-200 bg-white shadow-sm p-3'
        }
      >
        {loadingPlaceholder ?? (
          <div className='aspect-square w-full animate-pulse rounded-xl bg-slate-200' />
        )}
      </div>
    );
  }

  const nft = esdtInfo as UserNft;

  return (
    <DisplayNft
      nft={nft}
      amount={amount}
      className={className}
      badgeLabel={badgeLabel}
    />
  );
};

export default DisplayNftByToken;
