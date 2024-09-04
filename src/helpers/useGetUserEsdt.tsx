import { useEffect, useState } from 'react';
import {
  useGetAccountInfo,
  useGetNetworkConfig,
  useGetPendingTransactions
} from '@multiversx/sdk-dapp/hooks';
import axios from 'axios';
export const useGetUserESDT = () => {
  const { network } = useGetNetworkConfig();
  const [esdtBalance, setEsdtBalance] = useState<any>([]);
  const address = useGetAccountInfo().address;
  const { hasPendingTransactions } = useGetPendingTransactions();

  const url = '/accounts/' + address + '/tokens?size=1000';
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
  }, [hasPendingTransactions]);

  return esdtBalance;
};
