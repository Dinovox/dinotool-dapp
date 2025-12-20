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
import BigNumber from 'bignumber.js';
import bigToHex from 'helpers/bigToHex';

export interface ActionEndAuctionProps {
  auction_id: BigNumber;
  disabled?: boolean;
  onSuccess?: () => void;
  label?: React.ReactNode;
}

export const ActionEndAuction = ({
  auction_id,
  disabled,
  onSuccess,
  label
}: ActionEndAuctionProps) => {
  const transactions: Record<string, any> = useGetPendingTransactions();
  const hasPendingTransactions = Object.keys(transactions).length > 0;

  const [transactionSessionId, setTransactionSessionId] = useState<
    string | null
  >(null);
  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();

  useEffect(() => {
    if (transactionSessionId && transactions[transactionSessionId]) {
      const tx = transactions[transactionSessionId]?.transactions[0];
      if (tx?.status === 'success') {
        onSuccess?.();
      }
    }
  }, [transactionSessionId, transactions, onSuccess]);

  const sendEndAuctionTransaction = async () => {
    const auctionIdBigInt = BigInt(auction_id.toFixed());

    const payload = 'endAuction@' + bigToHex(auctionIdBigInt);

    const transaction = new Transaction({
      value: BigInt(0),
      data: new TextEncoder().encode(payload),
      receiver: new Address(marketplaceContractAddress),
      gasLimit: BigInt('14000000'),
      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing end auction transaction',
        errorMessage: 'An error occurred while ending the auction',
        successMessage: 'Auction ended successfully'
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
          onClick={sendEndAuctionTransaction}
          disabled={disabled}
          className='inline-flex h-10 w-full items-center justify-center rounded-md bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {label || 'End Auction'}
        </button>
      ) : (
        <button
          disabled
          className='inline-flex h-10 w-full items-center justify-center rounded-md bg-green-600 px-4 text-sm font-medium text-white opacity-50 cursor-not-allowed'
        >
          Processing...
        </button>
      )}
    </>
  );
};
