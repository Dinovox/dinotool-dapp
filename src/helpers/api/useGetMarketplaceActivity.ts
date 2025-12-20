import { useEffect, useState, useCallback } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { dinoclaim_api } from 'config';

export interface ActivityEvent {
  txHash: string;
  networkId: string;
  eventType: string; // e.g. 'end_auction_event'
  collection: string;
  nonce: number;
  amount: string;
  price: string;
  paymentToken: string;
  seller: string;
  buyer: string;
  timestamp: string;
  createdAt: string;
}

export type ActivityResponse = ActivityEvent[];

export type UseGetActivityParams = {
  page?: number;
  limit?: number;
  collection?: string;
  nonce?: number;
  auctionId?: string;
  enabled?: boolean;
};

export const useGetMarketplaceActivity = ({
  page = 1,
  limit = 20,
  collection,
  nonce,
  auctionId,
  enabled = true
}: UseGetActivityParams) => {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    // Build Query Params
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (collection) params.append('collection', collection);
    if (nonce !== undefined) params.append('nonce', nonce.toString());
    if (auctionId) params.append('auctionId', auctionId);

    const url = `/marketplace/activity?${params.toString()}`;
    const config: AxiosRequestConfig = {
      baseURL: dinoclaim_api
    };

    try {
      const response = await axios.get<ActivityResponse>(url, config);
      setData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch marketplace activity', err);
      setError('Failed to fetch activity');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, limit, collection, nonce, auctionId, enabled]);

  useEffect(() => {
    fetchActivity();

    const handleSync = () => {
      fetchActivity();
    };

    window.addEventListener('marketplace:synced', handleSync);

    return () => {
      window.removeEventListener('marketplace:synced', handleSync);
    };
  }, [fetchActivity]);

  return { data, loading, error, refresh: fetchActivity };
};
