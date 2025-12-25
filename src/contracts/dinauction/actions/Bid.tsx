import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

export interface ActionBidProps {
  auctionId: string | number;
  nftType: string;
  nftNonce: string | number;
  paymentToken: string; // 'EGLD' or token identifier
  amount: string; // Amount in base units (wei-like)
  directBuy?: boolean;
  disabled?: boolean;
  onSuccess?: () => void;
  label?: React.ReactNode;
}

export const ActionBid = ({
  auctionId,
  nftType,
  nftNonce,
  paymentToken,
  amount,
  directBuy,
  disabled,
  onSuccess,
  label
}: ActionBidProps) => {
  const transactions: Record<string, any> = useGetPendingTransactions();
  const hasPendingTransactions = Object.keys(transactions).length > 0;

  const [transactionSessionId, setTransactionSessionId] = useState<
    string | null
  >(null);
  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();
  const { t } = useTranslation();

  useEffect(() => {
    if (transactionSessionId && transactions[transactionSessionId]) {
      const tx = transactions[transactionSessionId]?.transactions[0];
      if (tx?.status === 'success') {
        onSuccess?.();
      }
    }
  }, [transactionSessionId, transactions, onSuccess]);

  const sendBidTransaction = async () => {
    const isEGLD = paymentToken === 'EGLD';

    // Convert auction_id, nft_nonce to BigInt for hex conversion
    const auctionIdBigInt = BigInt(auctionId);
    const nftNonceBigInt = BigInt(nftNonce);
    const amountBigInt = BigInt(amount);

    let transaction: Transaction;

    if (isEGLD) {
      // For EGLD: direct call with value
      const payload =
        'bid@' +
        bigToHex(auctionIdBigInt) +
        '@' +
        Buffer.from(nftType, 'utf8').toString('hex') +
        '@' +
        bigToHex(nftNonceBigInt);

      transaction = new Transaction({
        value: amountBigInt,
        data: new TextEncoder().encode(payload),
        receiver: new Address(marketplaceContractAddress),
        gasLimit: BigInt('10000000'),
        gasPrice: BigInt(GAS_PRICE),
        chainID: network.chainId,
        sender: new Address(address),
        version: 1
      });
    } else {
      // For ESDT: ESDTTransfer
      const payload =
        'ESDTTransfer@' +
        Buffer.from(paymentToken, 'utf8').toString('hex') +
        '@' +
        bigToHex(amountBigInt) +
        '@' +
        Buffer.from('bid', 'utf8').toString('hex') +
        '@' +
        bigToHex(auctionIdBigInt) +
        '@' +
        Buffer.from(nftType, 'utf8').toString('hex') +
        '@' +
        bigToHex(nftNonceBigInt);

      transaction = new Transaction({
        value: BigInt(0),
        data: new TextEncoder().encode(payload),
        receiver: new Address(marketplaceContractAddress),
        gasLimit: BigInt('12000000'),
        gasPrice: BigInt(GAS_PRICE),
        chainID: network.chainId,
        sender: new Address(address),
        version: 1
      });
    }

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: t
          ? t('marketplace:transaction_processing_bid')
          : 'Processing bid transaction',
        errorMessage: t
          ? t('marketplace:transaction_error_bid')
          : 'An error occurred during bid placement',
        successMessage: t
          ? t('marketplace:transaction_success_bid')
          : 'Bid placed successfully'
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
          onClick={sendBidTransaction}
          disabled={disabled}
          className='inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {label ||
            (directBuy
              ? t
                ? t('marketplace:buy_btn')
                : 'Buy'
              : t
              ? t('marketplace:place_bid_btn')
              : 'Place bid')}
        </button>
      ) : (
        <button
          disabled
          className='inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white opacity-50 cursor-not-allowed'
        >
          {t ? t('marketplace:processing_btn') : 'Processing...'}
        </button>
      )}
    </>
  );
};
