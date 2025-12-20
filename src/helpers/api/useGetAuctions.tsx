import { useEffect, useState, useCallback } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { useGetNetworkConfig } from 'lib';
import { dinoclaim_api } from 'config';
export interface Auction {
  id: number;
  networkId: string;
  tokenIdentifier: string;
  tokenNonce: number;
  amount: string;
  auctionType: string;
  paymentTokenIdentifier: string;
  paymentTokenNonce: number;
  minBid: string;
  maxBid: string;
  minBidDiff: string;
  startTime: string;
  deadline: string; // ISO String
  ownerId: number;
  currentBid: string;
  currentWinnerId: number | null;
  marketplaceCut: string;
  royalties: string;
  isActive: boolean;
  updatedAt: string;
  owner: {
    id: number;
    address: string;
  };
  currentWinner?: {
    id: number;
    address: string;
  };
}

export interface AuctionsResponse {
  total_count: number;
  auctions: Auction[];
}

export type UseGetAuctionsParams = {
  page?: number;
  limit?: number;
  owner?: string;
  collection?: string;
  include_inactive?: boolean;
  enabled?: boolean;
};

export const useGetAuctions = ({
  page = 1,
  limit = 20,
  owner,
  collection,
  include_inactive = false,
  enabled = true
}: UseGetAuctionsParams) => {
  const { network } = useGetNetworkConfig();
  const [data, setData] = useState<AuctionsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuctions = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    // Build Query Params
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (owner) params.append('owner', owner);
    if (collection) params.append('collection', collection);
    if (include_inactive) params.append('include_inactive', 'true');

    const url = `/marketplace/auctions?${params.toString()}`;
    const config: AxiosRequestConfig = {
      baseURL: dinoclaim_api
    };

    try {
      const response = await axios.get<AuctionsResponse>(url, config);
      setData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch auctions', err);
      setError('Failed to fetch auctions');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, limit, owner, collection, include_inactive, enabled]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  return { data, loading, error, refresh: fetchAuctions };
};
