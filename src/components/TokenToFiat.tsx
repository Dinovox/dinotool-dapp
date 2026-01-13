import React from 'react';
import { useGetEsdtInformations } from 'helpers/api/useGetEsdtInformations';
import BigNumber from 'bignumber.js';

interface TokenToFiatProps {
  amount: string | number;
  tokenIdentifier: string;
  className?: string; // Allow custom styling
  isDenominated?: boolean; // If true, amount is human-readable (e.g. 1.5). If false, atomic (e.g. 150000...)
}

export const TokenToFiat: React.FC<TokenToFiatProps> = ({
  amount,
  tokenIdentifier,
  className = 'text-xs text-slate-500', // Default style
  isDenominated = false
}) => {
  const esdtInfo = useGetEsdtInformations(tokenIdentifier);

  if (!amount || isNaN(Number(amount)) || !esdtInfo?.price) {
    return null;
  }

  const price = new BigNumber(esdtInfo.price);
  const decimals = esdtInfo.decimals || 18;
  const bnAmount = new BigNumber(amount);

  // If input is NOT denominated (i.e. is atomic), we shift by -decimals.
  // If it IS denominated, we use it as is.
  const val = isDenominated ? bnAmount : bnAmount.shiftedBy(-decimals);
  const fiatValue = val.multipliedBy(price);

  return (
    <div className={className}>
      ≈ $
      {fiatValue.toNumber().toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}
    </div>
  );
};
