import * as React from 'react';
import { useState, useEffect } from 'react';
import { useGetPendingTransactions } from 'lib';
import { signAndSendTransactions } from 'helpers';
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
import {
  waitForTransactionEvent,
  MARKETPLACE_EVENTS
} from 'helpers/transactionEventHelper';

export interface ActionWithdrawOfferProps {
  offerId: string | number;
  disabled?: boolean;
  onSuccess?: () => void;
  label?: React.ReactNode;
}

export const ActionWithdrawOffer = ({
  offerId,
  disabled,
  onSuccess,
  label
}: ActionWithdrawOfferProps) => {
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
      console.error('Error monitoring WithdrawOffer transaction:', err);
      setTransactionSessionId(null);
    }
  };

  const sendWithdrawOfferTransaction = async () => {
    const offerIdBigInt = BigInt(offerId);

    const payload = 'withdrawOffer@' + bigToHex(offerIdBigInt);

    const transaction = new Transaction({
      value: BigInt(0),
      data: new TextEncoder().encode(payload),
      receiver: new Address(marketplaceContractAddress),
      gasLimit: BigInt('10000000'),
      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing withdraw offer transaction',
        errorMessage: 'An error occurred while withdrawing the offer',
        successMessage: 'Offer withdrawn successfully'
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
          onClick={sendWithdrawOfferTransaction}
          disabled={disabled}
          className='inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {label || 'Withdraw Offer'}
        </button>
      ) : (
        <button
          disabled
          className='inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white opacity-50 cursor-not-allowed'
        >
          Processing...
        </button>
      )}
    </>
  );
};
