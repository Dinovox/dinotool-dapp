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
}

export const FormatAmount: React.FC<FormatAmountProps> = ({
  amount,
  identifier,
  displayDecimals,
  showLastNonZeroDecimal
}) => {
  // Fetch token information using the hook
  const esdtInfo = useGetEsdtInformations(identifier);

  // Handle EGLD special case
  const ticker =
    identifier === 'EGLD' ? 'EGLD' : esdtInfo?.ticker || identifier;
  const decimals = identifier === 'EGLD' ? 18 : esdtInfo?.decimals || 18;

  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return `0 ${ticker}`;
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
    // Default to a reasonable number of decimals, e.g., 2, but keep more if significant
    formattedValue = value.toFormat(2, BigNumber.ROUND_DOWN, {
      decimalSeparator: '.',
      groupSeparator: ',',
      groupSize: 3,
      suffix: ''
    });
    // If the value has more significant decimals than 2, show them up to the original 'decimals'
    if (value.decimalPlaces() > 2 && value.decimalPlaces() <= decimals) {
      formattedValue = value.toFormat(
        value.decimalPlaces(),
        BigNumber.ROUND_DOWN,
        {
          decimalSeparator: '.',
          groupSeparator: ',',
          groupSize: 3,
          suffix: ''
        }
      );
    }
  }

  return `${formattedValue} ${ticker}`;
};
