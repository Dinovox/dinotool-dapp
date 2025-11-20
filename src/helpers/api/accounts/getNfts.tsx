import { useEffect, useState } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { useGetNetworkConfig, useGetPendingTransactions } from 'lib';
import BigNumber from 'bignumber.js';

export interface Nfts {
  identifier: string;
  collection: string;
  timestamp: number;
  attributes: string;
  nonce: BigNumber;
  type: string;
  subType: string;
  name: string;
  creator: string;
  royalties: number;
  uris: string[];
  url: string;
  metadata?: {
    tokenId?: number;
    name?: string;
    description?: string;
    attributes?: {
      trait_type: string;
      value: string;
    }[];
  };
  media?: {
    url: string;
    originalUrl: string;
    thumbnailUrl: string;
    fileType: string;
    fileSize: number;
  }[];
  owner: string;
  ticker: string;
  rarities: Record<string, any>;
}

export const useGetNfts = (identifier: string) => {
  const { network } = useGetNetworkConfig();
  const [data, setData] = useState<Nfts>({} as Nfts);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      let url = `/nfts/${identifier}`;
      const config: AxiosRequestConfig = {
        baseURL: network.apiAddress
      };

      try {
        const response = await axios.get<Nfts>(url, config);
        setData(response.data as Nfts);
      } catch (err: any) {
        setError('Failed to fetch roles collections');
        console.error(err);
        setData({} as Nfts);
      } finally {
        setLoading(false);
      }
    };

    if (identifier) {
      if (hasPendingTransactions) {
        return;
      }
      fetchData();
    }
  }, [identifier, network.apiAddress, hasPendingTransactions]);

  return { data, loading, error };
};
