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

export interface ActionMakeGlobalOfferProps {
  collectionIdentifier: string;
  nftAmount?: number; // Quantity of items wanted (usually 1)
  offerPrice: string; // Amount to pay (in wei)
  paymentToken: string; // 'EGLD' or Identifier
  deadline: number; // Timestamp
  disabled?: boolean;
  onSuccess?: () => void;
  label?: React.ReactNode;
}

export const ActionMakeGlobalOffer = ({
  collectionIdentifier,
  nftAmount = 1,
  offerPrice,
  paymentToken,
  deadline,
  disabled,
  onSuccess,
  label
}: ActionMakeGlobalOfferProps) => {
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

      // Try finding hash in array or object
      if (Array.isArray(activeTransactions) && activeTransactions.length > 0) {
        // Warning: This grabs the first pending transaction, might be risky if multiple parallel.
        // Ideally we match by sessionId if available in the array objects.
        // Based on logs, array objects looked like transactions, but didn't show sessionId property clearly.
        // Stick to ActionCreate pattern: grab first hash if array.
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
      console.log('Monitoring transaction:', hash);
      await waitForTransactionEvent(hash, MARKETPLACE_EVENTS);
      console.log('Transaction confirmed, syncing...');
      await callSyncMarketplaceActivity();
      onSuccess?.();
      setTransactionSessionId(null);
    } catch (err) {
      console.error('Error monitoring transaction:', err);
      setTransactionSessionId(null);
    }
  };

  const sendMakeGlobalOfferTransaction = async () => {
    const isEGLD = paymentToken === 'EGLD';
    const nftAmountBigInt = BigInt(nftAmount);
    const priceBigInt = BigInt(offerPrice);
    const deadlineBigInt = BigInt(deadline);

    // Args: collection, amount, deadline

    // Construct args part
    let argsPayload =
      '@' +
      Buffer.from(collectionIdentifier, 'utf8').toString('hex') +
      '@' +
      bigToHex(nftAmountBigInt) +
      '@' +
      bigToHex(deadlineBigInt);

    let transaction: Transaction;

    if (isEGLD) {
      // EGLD: sendGlobalOffer@args
      const payload = 'sendGlobalOffer' + argsPayload;

      transaction = new Transaction({
        value: priceBigInt,
        data: new TextEncoder().encode(payload),
        receiver: new Address(marketplaceContractAddress),
        gasLimit: BigInt('14000000'),
        gasPrice: BigInt(GAS_PRICE),
        chainID: network.chainId,
        sender: new Address(address),
        version: 1
      });
    } else {
      // ESDT: ESDTTransfer@Token@Amount@sendGlobalOffer@args
      const payload =
        'ESDTTransfer@' +
        Buffer.from(paymentToken, 'utf8').toString('hex') +
        '@' +
        bigToHex(priceBigInt) +
        '@' +
        Buffer.from('sendGlobalOffer', 'utf8').toString('hex') +
        argsPayload;

      transaction = new Transaction({
        value: BigInt(0),
        data: new TextEncoder().encode(payload),
        receiver: new Address(marketplaceContractAddress),
        gasLimit: BigInt('14000000'),
        gasPrice: BigInt(GAS_PRICE),
        chainID: network.chainId,
        sender: new Address(address),
        version: 1
      });
    }

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing collection offer transaction',
        errorMessage: 'An error occurred while making the collection offer',
        successMessage: 'Collection offer made successfully'
      }
    });

    console.log('Transaction initiated, sessionId:', sessionId);

    if (sessionId) {
      setTransactionSessionId(sessionId);
    }
  };

  return (
    <>
      {!hasPendingTransactions ? (
        <button
          onClick={sendMakeGlobalOfferTransaction}
          disabled={disabled}
          className='inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {label || 'Make Collection Offer'}
        </button>
      ) : (
        <button
          disabled
          className='inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white opacity-50 cursor-not-allowed'
        >
          Processing...
        </button>
      )}
    </>
  );
};
