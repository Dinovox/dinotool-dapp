import { useEffect, useState } from 'react';
import axios from 'axios';
import { useGetNetworkConfig } from 'lib';
import BigNumber from 'bignumber.js';

export const useGetEsdtInformations = (
  identifier: string,
  priceType?: string
) => {
  const { network } = useGetNetworkConfig();
  const time = new Date();
  const [esdtInfo, setEsdtInfo] = useState<any>({});

  const getEsdtInfo = async () => {
    if (!identifier || priceType == 'Sft') {
      return;
    }
    if (identifier == 'EGLD') {
      identifier = 'EGLD-000000';
    }

    //using storage to reduce calls
    const expire_test = Number(
      localStorage.getItem('esdt_' + identifier + '_expire')
    );
    const storage = JSON.parse(
      localStorage.getItem('esdt_' + identifier) as string
    );
    setEsdtInfo(storage);
    if (time.getTime() < expire_test) {
      return esdtInfo;
    }

    try {
      const url = '/tokens/' + identifier;

      const { data } = await axios.get<[]>(url, {
        baseURL: network.apiAddress,
        params: {}
      });
      setEsdtInfo(data);
      //storage of 1 hour
      const expire = time.getTime() + 1000 * 60 * 60;
      localStorage.setItem('esdt_' + identifier, JSON.stringify(data));
      localStorage.setItem('esdt_' + identifier + '_expire', expire.toString());
    } catch (err) {
      console.error('Unable to fetch Tokens');
      setEsdtInfo([]);
    }
  };

  useEffect(() => {
    getEsdtInfo();
  }, [identifier]);

  return esdtInfo;
};

interface FormatAmountProps {
  amount: string | number | BigNumber | null | undefined;
  identifier: string; // Token identifier (e.g., 'EGLD', 'USDC-c76f1f')
  displayDecimals?: number; // Optional: number of decimals to display, defaults to 2 or actual significant decimals
  showLastNonZeroDecimal?: boolean;
  withPrice?: boolean;
  nonce?: number;
}

export const FormatAmount: React.FC<FormatAmountProps> = ({
  amount,
  identifier,
  displayDecimals,
  showLastNonZeroDecimal,
  withPrice,
  nonce
}) => {
  // Fetch token information using the hook
  const esdtInfo = useGetEsdtInformations(nonce && nonce > 0 ? '' : identifier);

  // Handle EGLD special case
  const ticker =
    identifier === 'EGLD' ? 'EGLD' : esdtInfo?.ticker || identifier;
  const decimals = identifier === 'EGLD' ? 18 : esdtInfo?.decimals || 0;

  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return <>{`0 ${ticker}`}</>;
  }

  const bnAmount = new BigNumber(amount);
  const divisor = new BigNumber(10).pow(decimals);
  const value = bnAmount.div(divisor);

  let formattedValue: string;
  if (displayDecimals !== undefined) {
    formattedValue = value.toFixed(displayDecimals, BigNumber.ROUND_DOWN);
    if (showLastNonZeroDecimal) {
      formattedValue = new BigNumber(formattedValue).toString();
    }
  } else {
    let decimalsToShow = decimals < 2 ? decimals : 2;
    if (value.gt(0) && value.lt(0.01)) {
      // Find the first non-zero digit position
      // e.g. 0.0000123... -> 4 zeros -> first non-zero at 5th position
      // We want to show 2 significant digits regardless of zeros
      // Math.log10(0.0000123) is approx -4.9 -> floor is -5 -> abs is 5.
      // 5 is the position of the first non-zero digit (1).
      // We want to keep that one and the next one => 5 + 1 = 6 decimals.
      const magnitude = Math.floor(Math.log10(value.toNumber()));
      const leadingZeros = -magnitude - 1; // e.g. -(-5) - 1 = 4 zeros
      // We want 2 "dust" digits, so we need leadingZeros + 2
      decimalsToShow = leadingZeros + 2;

      // Cap at the token's actual decimals
      if (decimalsToShow > decimals) {
        decimalsToShow = decimals;
      }
    }

    formattedValue = value.toNumber().toLocaleString(undefined, {
      minimumFractionDigits: decimalsToShow,
      maximumFractionDigits: decimalsToShow
    });
  }

  if (withPrice && esdtInfo?.price) {
    const price = new BigNumber(esdtInfo.price);
    const fiatValue = value.multipliedBy(price);

    return (
      <div className='flex flex-col'>
        <span>{`${formattedValue} ${ticker}`}</span>
        <span className='text-sm opacity-70 font-normal'>
          ≈ $
          {fiatValue.toNumber().toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>
      </div>
    );
  }

  //test
  // if (withPrice) {
  //   const price = new BigNumber(91135.9351458653);
  //   const fiatValue = value.multipliedBy(price);

  //   return (
  //     <div className='flex flex-col'>
  //       <span>{`${formattedValue} ${ticker}`}</span>
  //       <span className='text-sm opacity-70 font-normal'>
  //         ≈ ${fiatValue.toFormat(2)}
  //       </span>
  //     </div>
  //   );
  // }

  return <>{`${formattedValue} ${ticker}`}</>;
};
