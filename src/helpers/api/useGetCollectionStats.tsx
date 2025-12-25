import { useEffect, useState, useCallback } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { dinoclaim_api } from 'config';

export interface CollectionStats {
  floor: {
    ask: Record<string, string>;
    last_known: Record<string, string>;
  };
  offers: {
    best_global: Record<string, string>;
    best_specific: Record<string, string>;
  };
  volume: {
    '24h': Record<string, string>;
    '7d': Record<string, string>;
    all_time: Record<string, string>;
  };
  tokens: string[];
}

export const getBestStat = (
  record?: Record<string, string>
): { amount: string | undefined; token: string } => {
  if (!record) return { amount: undefined, token: 'EGLD' };

  // 1. EGLD
  if (record['EGLD'] && record['EGLD'] !== '0') {
    return { amount: record['EGLD'], token: 'EGLD' };
  }

  // 2. USDC
  const usdcKey = Object.keys(record).find((k) => k.startsWith('USDC'));
  if (usdcKey && record[usdcKey] !== '0') {
    return { amount: record[usdcKey], token: usdcKey };
  }

  // 3. Fallback: First non-zero
  const anyKey = Object.keys(record).find((k) => record[k] !== '0');
  if (anyKey) {
    return { amount: record[anyKey], token: anyKey };
  }

  return { amount: undefined, token: 'EGLD' };
};

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

    const url = `/marketplace/collections/${collectionIdentifier}/stats`;
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
