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

export interface ActionAcceptOfferProps {
  offerId: string | number;
  offerNonce?: string | number; // 0 for global, >0 for specific
  nftIdentifier: string;
  nftNonce: string | number;
  nftAmount?: number; // Quantity to send (usually 1)
  onSuccess?: () => void;
  disabled?: boolean;
  label?: React.ReactNode;
}

export const ActionAcceptOffer = ({
  offerId,
  offerNonce = '1', // Default assume specific if not known, but caller should pass it
  nftIdentifier,
  nftNonce,
  nftAmount = 1,
  onSuccess,
  disabled,
  label
}: ActionAcceptOfferProps) => {
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
      console.error('Error monitoring AcceptOffer transaction:', err);
      setTransactionSessionId(null);
    }
  };

  const sendAcceptOfferTransaction = async () => {
    const offerIdBigInt = BigInt(offerId);
    const nftNonceBigInt = BigInt(nftNonce);
    const nftAmountBigInt = BigInt(nftAmount);

    // Check if offer is specific or global based on offerNonce ?
    // Rust logic:
    // acceptOffer checks offer_token.nonce matches sent token nonce.
    // acceptGlobalOffer checks offer_token.nonce == 0 and sent token nonce > 0.

    // We should call 'acceptGlobalOffer' if the OFFER itself was global (nonce 0).
    // The user should pass `offerNonce` (of the offer struct) to this component.
    // If offerNonce is 0, we call acceptGlobalOffer. Else acceptOffer.

    const isGlobal = BigInt(offerNonce) === BigInt(0);
    const functionName = isGlobal ? 'acceptGlobalOffer' : 'acceptOffer';

    // ESDTNFTTransfer@Token@Nonce@Amount@Dest@Func@Args
    const payload =
      'ESDTNFTTransfer@' +
      Buffer.from(nftIdentifier, 'utf8').toString('hex') +
      '@' +
      bigToHex(nftNonceBigInt) +
      '@' +
      bigToHex(nftAmountBigInt) +
      '@' +
      new Address(marketplaceContractAddress).toHex() +
      '@' +
      Buffer.from(functionName, 'utf8').toString('hex') +
      '@' +
      bigToHex(offerIdBigInt);

    const transaction = new Transaction({
      value: BigInt(0), // Value 0 for ESDTNFTTransfer
      data: new TextEncoder().encode(payload),
      receiver: new Address(address), // Send to self to trigger ESDTNFTTransfer
      gasLimit: BigInt('14000000'),
      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing accept offer transaction',
        errorMessage: 'An error occurred while accepting the offer',
        successMessage: 'Offer accepted successfully'
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
          onClick={sendAcceptOfferTransaction}
          disabled={disabled}
          className='inline-flex h-10 items-center justify-center rounded-md bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {label || 'Accept Offer'}
        </button>
      ) : (
        <button
          disabled
          className='inline-flex h-10 items-center justify-center rounded-md bg-green-600 px-4 text-sm font-medium text-white opacity-50 cursor-not-allowed'
        >
          Processing...
        </button>
      )}
    </>
  );
};
