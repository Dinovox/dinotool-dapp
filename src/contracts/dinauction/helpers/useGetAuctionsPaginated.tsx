import { useEffect, useState, useCallback } from 'react';
import { Abi, Address, DevnetEntrypoint } from '@multiversx/sdk-core';
import { useGetNetworkConfig } from 'lib';
import dinauctionAbi from '../dinovox-marketplace.abi.json';
import { marketplaceContractAddress } from 'config';

type UseGetAuctionsPaginatedParams = {
  page: number; // 1-based
  limit: number;
  collection?: string | null; // token identifier, ex: "DINOVOX-xxxxx"
};

export const useGetAuctionsPaginated = ({
  page,
  limit,
  collection = null
}: UseGetAuctionsPaginatedParams) => {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const { network } = useGetNetworkConfig();

  const fetchAuctions = useCallback(async () => {
    try {
      console.log('call getActiveAuctionsPaged', page, limit, collection);
      setIsLoading(true);
      setError(null);

      const entrypoint = new DevnetEntrypoint({ url: network.apiAddress });
      const contractAddress = Address.newFromBech32(marketplaceContractAddress);
      const abi = Abi.create(dinauctionAbi as any);
      const controller = entrypoint.createSmartContractController(abi);

      const fromIndex = Math.max(0, (page - 1) * limit);

      const args: any[] = [fromIndex, limit];

      // OptionalValue<TokenIdentifier> côté SC :
      // - si collection fournie -> on passe l’identifiant
      // - sinon -> on laisse "none" (null / undefined, géré par l’ABI)
      if (collection) {
        args.push(collection);
      } else {
        // selon la version du SDK, null / undefined sera interprété comme "None"
        args.push(null);
      }

      const response = await controller.query({
        contract: contractAddress,
        function: 'getActiveAuctionsPaged',
        arguments: args
      });

      if (!response || response.length === 0) {
        setAuctions([]);
        setHasMore(false);
        return;
      }

      // MultiValueEncoded<Auction> => généralement un array d’enchères dans response[0]
      const pageItems = Array.isArray(response[0]) ? response[0] : [];

      setAuctions(pageItems);
      setHasMore(pageItems.length === limit);
    } catch (err) {
      console.error('Unable to call getActiveAuctionsPaged', err);
      setError('Unable to load auctions');
      setAuctions([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, collection, network.apiAddress, marketplaceContractAddress]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  return {
    auctions,
    isLoading,
    error,
    hasMore,
    refresh: fetchAuctions
  };
};
