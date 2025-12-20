import { useEffect, useState, useCallback } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { useGetNetworkConfig } from 'lib';
import { dinoclaim_api } from 'config';

export interface Offer {
  id: number;
  networkId: string;
  ownerId: number;
  offerTokenIdentifier: string;
  offerTokenNonce: number;
  offerAmount: string;
  paymentTokenIdentifier: string;
  paymentTokenNonce: number;
  paymentAmount: string;
  startTime: string;
  deadline: string;
  isActive: boolean;
  owner?: {
    id: number;
    address: string;
  };
}

export interface OffersResponse {
  total_count: number;
  offers: Offer[];
}

export type UseGetOffersParams = {
  page?: number;
  limit?: number;
  owner?: string;
  collection?: string;
  nonce?: string;
  identifier?: string;
  enabled?: boolean;
};

export const useGetOffers = ({
  page = 1,
  limit = 20,
  owner,
  collection,
  nonce,
  identifier,
  enabled = true
}: UseGetOffersParams) => {
  const { network } = useGetNetworkConfig();
  const [data, setData] = useState<OffersResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    // Build Query Params
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (owner) params.append('owner', owner);
    if (collection) params.append('collection', collection);
    if (nonce) params.append('nonce', nonce);
    if (identifier) params.append('identifier', identifier);

    const url = `/marketplace/offers?${params.toString()}`;
    const config: AxiosRequestConfig = {
      baseURL: dinoclaim_api
    };

    try {
      const response = await axios.get<OffersResponse>(url, config);
      setData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch offers', err);
      setError('Failed to fetch offers');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, limit, owner, collection, nonce, identifier, enabled]);

  useEffect(() => {
    fetchOffers();

    const handleSync = () => {
      console.log('Sync event received, refreshing offers...');
      fetchOffers();
    };

    window.addEventListener('marketplace:synced', handleSync);

    return () => {
      window.removeEventListener('marketplace:synced', handleSync);
    };
  }, [fetchOffers]);

  return { data, loading, error, refresh: fetchOffers };
};
