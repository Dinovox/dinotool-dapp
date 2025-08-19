import { useEffect, useState } from 'react';
import {
  useGetAccountInfo,
  useGetNetworkConfig,
  useGetPendingTransactions
} from 'lib';
import axios from 'axios';
import { API_URL } from 'config';
export const useGetUserNFT = (address: string, identifier?: string) => {
  const network = useGetNetworkConfig();
  const [esdtBalance, setNftBalance] = useState(<any>[]);
  // const address = useGetAccountInfo().address;
  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;
  let url = '/accounts/' + address + '/nfts?from=0&size=1000';
  if (identifier) {
    url = url + `&identifiers=${identifier}`;
  }

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
  }, [address, identifier]);

  return esdtBalance;
};
