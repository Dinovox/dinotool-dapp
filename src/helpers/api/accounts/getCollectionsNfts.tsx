import { useEffect, useState } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { useGetPendingTransactions } from 'hooks';

export interface CollectionNft {
  identifier: string;
  collection: string;
  timestamp: number;
  attributes: string;
  nonce: number;
  type: string;
  subType: string;
  name: string;
  creator: string;
  royalties: number;
  uris: string[];
  url: string;
  media: {
    url: string;
    originalUrl: string;
    thumbnailUrl: string;
    fileType: string;
    fileSize: number;
  }[];
  isWhitelistedStorage: boolean;
  tags: string[];
  metadata?: {
    tokenId: number;
    name: string;
    description?: string;
    attributes?: {
      trait_type: string;
      value: string;
    }[];
  };
  ticker: string;
  rarities?: Record<string, any>;
}

export const useGetCollectionsNfts = (collection: string) => {
  const [data, setData] = useState<CollectionNft[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { hasPendingTransactions } = useGetPendingTransactions();

  useEffect(() => {
    const fetchData = async () => {
      if (!collection || hasPendingTransactions) return;

      setLoading(true);
      setError(null);

      const url = `/collections/${collection}/nfts`;
      const config: AxiosRequestConfig = {
        baseURL: 'https://devnet-api.multiversx.com'
      };

      try {
        const response = await axios.get<CollectionNft[]>(url, config);
        setData(response.data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch NFTs for this collection');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collection, hasPendingTransactions]);

  return { data, loading, error };
};
