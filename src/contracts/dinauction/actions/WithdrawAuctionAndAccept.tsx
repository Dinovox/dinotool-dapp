import * as React from 'react';
import { useState, useEffect } from 'react';
import { useGetPendingTransactions } from 'lib';
import { signAndSendTransactions } from 'helpers';
import {
  waitForTransactionEvent,
  MARKETPLACE_EVENTS
} from 'helpers/transactionEventHelper';
import {
  Address,
  GAS_PRICE,
  Transaction,
  useGetNetworkConfig,
  useGetAccountInfo
} from 'lib';
import { marketplaceContractAddress } from 'config';
import bigToHex from 'helpers/bigToHex';
import { callSyncMarketplaceActivity } from 'helpers/api/callSyncMarketplaceActivity';

export interface ActionWithdrawAuctionAndAcceptProps {
  auctionId: string | number;
  offerId: string | number;
  disabled?: boolean;
  onSuccess?: () => void;
  label?: string;
}

export const ActionWithdrawAuctionAndAccept = ({
  auctionId,
  offerId,
  disabled,
  onSuccess,
  label
}: ActionWithdrawAuctionAndAcceptProps) => {
  const transactions: Record<string, any> = useGetPendingTransactions();
  const hasPendingTransactions = Object.keys(transactions).length > 0;

  const [transactionSessionId, setTransactionSessionId] = useState<
    string | null
  >(null);
  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();

  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (transactionSessionId) {
      const activeTransactions = transactions as any;
      let foundHash = null;

      if (Array.isArray(activeTransactions) && activeTransactions.length > 0) {
        foundHash = activeTransactions[0].hash;
      } else if (activeTransactions[transactionSessionId]) {
        foundHash =
          activeTransactions[transactionSessionId].transactions?.[0]?.hash;
      }

      if (foundHash && foundHash !== txHash) {
        setTxHash(foundHash);
        monitorTransaction(foundHash);
      }
    }
  }, [transactionSessionId, transactions, txHash]);

  const monitorTransaction = async (hash: string) => {
    try {
      await waitForTransactionEvent(hash, MARKETPLACE_EVENTS);
      await callSyncMarketplaceActivity();
      onSuccess?.();
      setTransactionSessionId(null);
    } catch (err) {
      console.error('Error monitoring Withdraw transaction:', err);
    }
  };

  const sendTransaction = async () => {
    const auctionIdBigInt = BigInt(auctionId);
    const offerIdBigInt = BigInt(offerId);

    // Args: withdrawAuctionAndAcceptOffer@auction_id@offer_id
    const payload =
      'withdrawAuctionAndAcceptOffer' +
      '@' +
      bigToHex(auctionIdBigInt) +
      '@' +
      bigToHex(offerIdBigInt);

    const transaction = new Transaction({
      value: BigInt(0),
      data: new TextEncoder().encode(payload),
      receiver: new Address(marketplaceContractAddress),
      gasLimit: BigInt('15000000'), // Slightly higher gas limit for composite action
      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing auction withdrawal and offer acceptance',
        errorMessage: 'An error occurred',
        successMessage: 'Successfully accepted offer and closed auction'
      }
    });

    if (sessionId) {
      setTransactionSessionId(sessionId);
    }
  };

  return (
    <>
      {!hasPendingTransactions ? (
        <button
          onClick={sendTransaction}
          disabled={disabled}
          className='inline-flex h-8 items-center justify-center rounded-md bg-green-600 px-3 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {label || 'Close Auction & Accept'}
        </button>
      ) : (
        <button
          disabled
          className='inline-flex h-8 items-center justify-center rounded-md bg-green-600 px-3 text-xs font-medium text-white opacity-50 cursor-not-allowed'
        >
          Processing...
        </button>
      )}
    </>
  );
};
