import { useEffect, useState, useCallback, useRef } from 'react';
import { Abi, Address, DevnetEntrypoint } from '@multiversx/sdk-core';
import { useGetNetworkConfig, useGetPendingTransactions } from 'lib';
import dinauctionAbi from '../dinauction.abi.json';
import { marketplaceContractAddress } from 'config';

export const useGetFullAuctionData = (auctionId?: string | number) => {
  const [auction, setAuction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const transactions: Record<string, any> = useGetPendingTransactions();
  const hasPendingTransactions = Object.keys(transactions).length > 0;

  const { network } = useGetNetworkConfig();

  const fetchAuction = useCallback(async () => {
    if (!auctionId) {
      setAuction(null);
      return;
    }

    // Skip fetch if there are pending transactions AND we fetched recently (within 10s)
    // This prevents refetching during active transactions but allows recovery if stuck
    const now = Date.now();
    if (hasPendingTransactions && now - lastFetchTimeRef.current < 10000) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const entrypoint = new DevnetEntrypoint({ url: network.apiAddress });
      const contractAddress = Address.newFromBech32(marketplaceContractAddress);
      const abi = Abi.create(dinauctionAbi as any);
      const controller = entrypoint.createSmartContractController(abi);

      const response = await controller.query({
        contract: contractAddress,
        function: 'getFullAuctionData',
        arguments: [auctionId]
      });

      if (!response || response.length === 0) {
        setAuction(null);
        return;
      }

      console.log(response);
      // The ABI defines the output as a single Auction struct
      // controller.query usually returns an array of results.
      // Since it returns one item, we take the first one.
      setAuction(response[0]);
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      console.error('Unable to call getFullAuctionData', err);
      setError('Unable to load auction data');
      setAuction(null);
    } finally {
      setIsLoading(false);
    }
  }, [auctionId, network.apiAddress, hasPendingTransactions]);

  useEffect(() => {
    fetchAuction();
  }, [fetchAuction]);

  return {
    auction,
    isLoading,
    error,
    refresh: fetchAuction
  };
};
