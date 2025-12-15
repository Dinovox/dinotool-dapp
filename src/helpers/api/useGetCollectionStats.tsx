import { useEffect, useState, useCallback } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { dinoclaim_api } from 'config';

export interface CollectionStats {
  floor_ask_egld: string;
  last_floor_ask_egld: string;
  best_offer_egld: string;
}

export const useGetCollectionStats = (collectionIdentifier: string) => {
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!collectionIdentifier) return;

    setLoading(true);
    setError(null);

    const url = `/collections/${collectionIdentifier}/stats`;
    const config: AxiosRequestConfig = {
      baseURL: dinoclaim_api
    };

    try {
      const response = await axios.get<CollectionStats>(url, config);
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to fetch collection stats', err);
      setError('Failed to fetch collection stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [collectionIdentifier]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
};
