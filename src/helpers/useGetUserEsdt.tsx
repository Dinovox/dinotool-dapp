import { useEffect, useState } from 'react';
import {
  useGetAccountInfo,
  useGetNetworkConfig,
  useGetPendingTransactions
} from '@multiversx/sdk-dapp/hooks';
import axios from 'axios';
export const useGetUserESDT = (identifier?: string) => {
  const { network } = useGetNetworkConfig();
  const [esdtBalance, setEsdtBalance] = useState<any>([]);
  const address = useGetAccountInfo().address;
  const { hasPendingTransactions } = useGetPendingTransactions();

  let url = '/accounts/' + address + '/tokens?size=1000';
  if (identifier) {
    url += `&identifier=${identifier}`;
  }
  const getUserESDT = async () => {
    if (hasPendingTransactions == true) {
      return;
    }

    if (address != '') {
      try {
        const { data } = await axios.get<[]>(url, {
          baseURL: network.apiAddress,
          params: {}
        });
        setEsdtBalance(data);
      } catch (err) {
        console.error('Unable to fetch Tokens');
        setEsdtBalance([]);
      }
    }
  };

  useEffect(() => {
    getUserESDT();
  }, [hasPendingTransactions, identifier]);

  return esdtBalance;
};
