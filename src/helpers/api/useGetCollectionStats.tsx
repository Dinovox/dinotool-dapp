import { useEffect, useState, useCallback } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { dinoclaim_api } from 'config';

export interface CollectionStats {
  floor_ask_egld: string;
  last_floor_ask_egld: string;
  best_global_offer_egld: string;
  best_specific_offer_egld: string;
  volume_24h: string;
  volume_7d: string;
  volume_all_time: string;
}

export const useGetCollectionStats = (collectionIdentifier: string) => {
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!collectionIdentifier) return;

    // Check cache
    const cacheKey = `collection_stats_${collectionIdentifier}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 3600 * 1000) {
          setStats(data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to parse cached stats', e);
      }
    }

    setLoading(true);
    setError(null);

    const url = `/collections/${collectionIdentifier}/stats`;
    const config: AxiosRequestConfig = {
      baseURL: dinoclaim_api
    };

    try {
      const response = await axios.get<CollectionStats>(url, config);
      setStats(response.data);
      // Save to cache
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ data: response.data, timestamp: Date.now() })
      );
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
