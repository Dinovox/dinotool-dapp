import { useEffect, useState } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { useGetNetworkConfig, useGetPendingTransactions } from 'lib';

export interface CollectionRole {
  canCreate: boolean;
  canBurn: boolean;
  canAddQuantity: boolean;
  canUpdateAttributes: boolean;
  canAddUri: boolean;
  canTransfer?: boolean;
  roles: string[];
  address?: string;
  canTransferNFTCreateRole: boolean;
}

export interface Collection {
  collection: string;
  type: string;
  subType: string;
  name: string;
  ticker: string;
  owner: string;
  timestamp: number;
  roles?: CollectionRole[];
  role: CollectionRole;
  canFreeze: boolean;
  canWipe: boolean;
  canPause: boolean;
  canChangeOwner: boolean;
  canUpgrade: boolean;
  canAddSpecialRoles: boolean;
  canTransfer: boolean;
  canCreate: boolean;
  canBurn: boolean;
  canAddQuantity: boolean;
  canUpdateAttributes: boolean;
  canAddUri: boolean;
  canTransferNftCreateRole: boolean;
}

export const useGetCollections = (collection: string) => {
  const { network } = useGetNetworkConfig();
  const [data, setData] = useState<Collection>({} as Collection);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      let url = `/collections/${collection}`;
      const config: AxiosRequestConfig = {
        baseURL: network.apiAddress
      };

      try {
        const response = await axios.get<Collection>(url, config);
        setData(response.data as Collection);
      } catch (err: any) {
        setError('Failed to fetch roles collections');
        console.error(err);
        setData({} as Collection);
      } finally {
        setLoading(false);
      }
    };

    if (collection) {
      if (hasPendingTransactions) {
        return;
      }
      fetchData();
    }
  }, [collection, network.apiAddress, hasPendingTransactions]);

  return { data, loading, error };
};
