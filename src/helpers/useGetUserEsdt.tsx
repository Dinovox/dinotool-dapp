import { useEffect, useState } from 'react';
import {
  useGetAccountInfo,
  useGetNetworkConfig,
  useGetPendingTransactions
} from 'lib';
import axios from 'axios';
export const useGetUserESDT = (
  identifier?: string,
  options?: { enabled?: boolean }
) => {
  const { network } = useGetNetworkConfig();
  const [esdtBalance, setEsdtBalance] = useState<any>([]);
  const { address } = useGetAccountInfo();
  const enabled = options?.enabled ?? true;

  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  let url = '/accounts/' + address + '/tokens?size=1000';
  if (identifier) {
    url += `&identifier=${identifier}`;
  }
  const getUserESDT = async () => {
    if (!enabled) return;

    if (hasPendingTransactions == true || !address) {
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
    if (!enabled || !address || address == '') {
      // access provided data via parent or keep empty if disabled logic requires it,
      // but here we just stop fetching. Existing data management happens outside hook or initialized state.
      // Actually usually if disabled we might want to set to empty or keep prev.
      // For this use case, we just don't fetch.
      setEsdtBalance([]);
      return;
    }
    getUserESDT();
  }, [address, hasPendingTransactions, identifier, enabled]);

  return esdtBalance;
};
