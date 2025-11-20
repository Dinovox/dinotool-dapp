import { useEffect, useState, useCallback } from 'react';
import { Abi, Address, DevnetEntrypoint } from '@multiversx/sdk-core';
import { useGetNetworkConfig } from 'lib';
import dinauctionAbi from '../dinauction.abi.json';
import { marketplaceContractAddress } from 'config';

export const useGetFullAuctionData = (auctionId?: string | number) => {
  const [auction, setAuction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { network } = useGetNetworkConfig();

  const fetchAuction = useCallback(async () => {
    if (!auctionId) {
        setAuction(null);
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

      // The ABI defines the output as a single Auction struct
      // controller.query usually returns an array of results.
      // Since it returns one item, we take the first one.
      setAuction(response[0]);
    } catch (err) {
      console.error('Unable to call getFullAuctionData', err);
      setError('Unable to load auction data');
      setAuction(null);
    } finally {
      setIsLoading(false);
    }
  }, [auctionId, network.apiAddress]);

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
