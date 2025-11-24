import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from 'config';
// https://devnet-api.multiversx.com/#/accounts/AccountController_getAccountNftCollections
export type AccountCollection = {
  collection: string;
  type: string;
  name: string;
  ticker: string;
  owner: string;
  timestamp: number;
  canFreeze: boolean;
  canWipe: boolean;
  canPause: boolean;
  canTransferNftCreateRole: boolean;
  count: number;
  url?: string; // From secondary fetch
  assets?: {
    website?: string;
    description?: string;
    status?: string;
    pngUrl?: string;
    svgUrl?: string;
  };
};

export const useGetAccountCollections = (
  address: string,
  size: number = 12,
  from: number = 0,
  search: string = ''
) => {
  const [collections, setCollections] = useState<AccountCollection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 1. Fetch account collections
        const { data: accountCollections } = await axios.get<
          AccountCollection[]
        >(
          `${API_URL}/accounts/${address}/collections?from=${from}&size=${size}${
            search ? `&search=${search}` : ''
          }`
        );

        if (accountCollections.length === 0) {
          setCollections([]);
          setLoading(false);
          return;
        }

        // 2. Fetch details for these collections to get logos
        const identifiers = accountCollections
          .map((c) => c.collection)
          .join(',');
        const { data: collectionDetails } = await axios.get<any[]>(
          `${API_URL}/collections?identifiers=${identifiers}`
        );

        // 3. Merge data
        const merged = accountCollections.map((ac) => {
          const detail = collectionDetails.find(
            (d: any) => d.collection === ac.collection
          );
          return {
            ...ac,
            assets: detail?.assets,
            // Fallback for logo if assets.pngUrl is missing, though usually it's there
            url: detail?.assets?.pngUrl || detail?.assets?.svgUrl
          };
        });

        setCollections(merged);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching account collections:', err);
        setError(err.message || 'Failed to fetch collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [address, size, from, search]);

  return { collections, loading, error };
};
