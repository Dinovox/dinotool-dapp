import { useEffect, useState, useCallback } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { dinoclaim_api } from 'config';

export interface CollectionBranding {
  branding: {
    name: string;
    description: string;
    website?: string;
    twitter?: string;
    discord?: string;
    logo?: string;
    banner?: string;
    tags?: string[];
  };
  images: {
    banner: string;
    logo: string;
  };
}

export const useGetCollectionBranding = (collectionIdentifier: string) => {
  const [data, setData] = useState<CollectionBranding | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranding = useCallback(async () => {
    if (!collectionIdentifier) return;

    setLoading(true);
    setError(null);

    const url = `/marketplace/collections/${collectionIdentifier}/branding`;
    const config: AxiosRequestConfig = {
      baseURL: dinoclaim_api
    };

    try {
      const response = await axios.get<CollectionBranding>(url, config);
      setData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch collection branding', err);
      setError('Failed to fetch collection branding');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [collectionIdentifier]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  return { branding: data, loading, error, refresh: fetchBranding };
};
