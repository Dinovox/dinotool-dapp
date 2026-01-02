import { useEffect, useState, useCallback, useRef } from 'react';
import { Abi, Address, DevnetEntrypoint } from '@multiversx/sdk-core';
import { useGetNetworkConfig, useGetPendingTransactions } from 'lib';
import dinauctionAbi from '../dinovox-marketplace.abi.json';
import { marketplaceContractAddress } from 'config';
import BigNumber from 'bignumber.js';

export const useGetUserPurchasedAmount = (
  auctionId?: string | number,
  userAddress?: string
) => {
  const [purchasedAmount, setPurchasedAmount] = useState<BigNumber>(
    new BigNumber(0)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const transactions: Record<string, any> = useGetPendingTransactions();
  const hasPendingTransactions = Object.keys(transactions).length > 0;

  const { network } = useGetNetworkConfig();

  const fetchPurchasedAmount = useCallback(async () => {
    if (!auctionId || !userAddress) {
      setPurchasedAmount(new BigNumber(0));
      return;
    }

    // Skip fetch if there are pending transactions AND we fetched recently (within 5s)
    const now = Date.now();
    if (hasPendingTransactions && now - lastFetchTimeRef.current < 5000) {
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
        function: 'getUserPurchasedAmount',
        arguments: [auctionId, new Address(userAddress)]
      });

      if (!response || response.length === 0) {
        setPurchasedAmount(new BigNumber(0));
        return;
      }

      // The view returns a BigUint
      const amount = new BigNumber(response[0].toString());
      setPurchasedAmount(amount);
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      console.error('Unable to call getUserPurchasedAmount', err);
      setError('Unable to load purchased amount');
      // On error, default to 0 to not block UI, but keep error state
      setPurchasedAmount(new BigNumber(0));
    } finally {
      setIsLoading(false);
    }
  }, [auctionId, userAddress, network.apiAddress, hasPendingTransactions]);

  useEffect(() => {
    fetchPurchasedAmount();
  }, [fetchPurchasedAmount]);

  return {
    purchasedAmount,
    isLoading,
    error,
    refresh: fetchPurchasedAmount
  };
};
