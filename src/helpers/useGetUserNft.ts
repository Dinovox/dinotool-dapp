import { useEffect, useState } from 'react';
import {
  useGetAccountInfo,
  useGetNetworkConfig,
  useGetPendingTransactions
} from '@multiversx/sdk-dapp/hooks';
import axios from 'axios';
import { API_URL } from 'config';
export const useGetUserNFT = (address: string) => {
  const network = useGetNetworkConfig();
  const [esdtBalance, setNftBalance] = useState(<any>[]);
  // const address = useGetAccountInfo().address;
  const { hasPendingTransactions } = useGetPendingTransactions();

  const url = '/accounts/' + address + '/nfts?from=0&size=100';
  const getUserNFT = async () => {
    if (hasPendingTransactions == true || address == '') {
      return;
    }
    try {
      const { data } = await axios.get<[]>(url, {
        baseURL: API_URL,
        params: {}
      });
      setNftBalance(data);
    } catch (err) {
      console.error('Unable to fetch Tokens');
      setNftBalance([]);
    }
  };

  useEffect(() => {
    getUserNFT();
  }, [address]);

  return esdtBalance;
};
