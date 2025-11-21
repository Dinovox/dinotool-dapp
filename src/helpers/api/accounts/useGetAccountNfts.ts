import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from 'config';

export type NftType = {
  identifier: string;
  collection: string;
  timestamp: number;
  attributes: string;
  nonce: number;
  type: string;
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
  metadata: {
    name?: string;
    description?: string;
    attributes?: {
      trait_type: string;
      value: string;
    }[];
  };
  balance: string;
  ticker: string;
  score?: number;
  rank?: number;
  isNsfw: boolean;
};

export const useGetAccountNfts = (address: string) => {
  const [nfts, setNfts] = useState<NftType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNfts = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetching up to 1000 NFTs to get a good representation of collections
        const { data } = await axios.get<NftType[]>(
          `${API_URL}/accounts/${address}/nfts?size=1000`
        );
        setNfts(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching account NFTs:', err);
        setError(err.message || 'Failed to fetch NFTs');
      } finally {
        setLoading(false);
      }
    };

    fetchNfts();
  }, [address]);

  return { nfts, loading, error };
};
