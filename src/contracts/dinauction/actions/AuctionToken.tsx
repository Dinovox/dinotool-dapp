import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPendingTransactions } from 'lib';
import { signAndSendTransactions } from 'helpers';
import {
  AbiRegistry,
  Address,
  GAS_PRICE,
  SmartContractTransactionsFactory,
  Transaction,
  TransactionsFactoryConfig,
  useGetAccount,
  useGetNetworkConfig,
  useGetAccountInfo
} from 'lib';
import { marketplaceContractAddress } from 'config';
import BigNumber from 'bignumber.js';
import { bigNumToHex } from 'helpers/bigNumToHex';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';
import bigToHex from 'helpers/bigToHex';
import {
  waitForTransactionEvent,
  MARKETPLACE_EVENTS
} from '../../../helpers/transactionEventHelper';

type NumericLike = number | string | bigint;

export interface ActionAuctionTokenProps {
  auctionned_token_identifier: string;
  auctionned_nonce: BigNumber;
  auctionned_amount: BigNumber;
  minimum_bid: BigNumber;
  maximum_bid: BigNumber;
  deadline: NumericLike;
  accepted_payment_token_identifier: string;

  opt_min_bid_diff?: BigNumber;
  opt_sft_max_one_per_payment?: boolean;
  opt_accepted_payment_token_nonce?: NumericLike;
  opt_start_time?: NumericLike;

  disabled?: boolean;
}
export const ActionAuctionToken = ({
  auctionned_token_identifier,
  auctionned_nonce,
  auctionned_amount,
  minimum_bid,
  maximum_bid,
  deadline,
  accepted_payment_token_identifier,

  opt_min_bid_diff,
  opt_sft_max_one_per_payment,
  opt_accepted_payment_token_nonce,
  opt_start_time,

  disabled
}: ActionAuctionTokenProps) => {
  const loading = useLoadTranslations('marketplace');
  const { t } = useTranslation();

  const transactions: Record<string, any> = useGetPendingTransactions();
  const hasPendingTransactions = Object.keys(transactions).length > 0;

  const navigate = useNavigate();
  const [transactionSessionId, setTransactionSessionId] = useState<
    string | null
  >(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();

  // 🎯 Vérifier si on a un txHash après l'envoi de la transaction
  useEffect(() => {
    if (transactionSessionId && hasPendingTransactions && !txHash) {
      let foundHash = null;

      if (Array.isArray(transactions) && transactions.length > 0) {
        foundHash = transactions[0].hash;
      } else if (transactions[transactionSessionId]) {
        foundHash = transactions[transactionSessionId].transactions?.[0]?.hash;
      }

      if (foundHash) {
        setTxHash(foundHash);
        checkTransactionStatus(foundHash);
      }
    }
  }, [transactionSessionId, hasPendingTransactions, transactions, txHash]);

  const sendFundTransaction = async () => {
    const payload =
      'ESDTNFTTransfer@' +
      Buffer.from(auctionned_token_identifier, 'utf8').toString('hex') +
      '@' +
      bigToHex(BigInt(auctionned_nonce.toFixed())) +
      '@' +
      bigToHex(BigInt(auctionned_amount.toFixed())) +
      '@' +
      new Address(marketplaceContractAddress).toHex() +
      '@' +
      Buffer.from('auctionToken', 'utf8').toString('hex') +
      '@' +
      bigToHex(BigInt(minimum_bid.toFixed())) +
      '@' +
      bigToHex(BigInt(maximum_bid.toFixed())) +
      '@' +
      bigToHex(BigInt(deadline)) +
      '@' +
      Buffer.from(accepted_payment_token_identifier, 'utf8').toString('hex');

    // Handle optional arguments positionally
    const args = [];

    // 1. opt_min_bid_diff
    const hasSftMaxOne = opt_sft_max_one_per_payment !== undefined;
    const hasPaymentTokenNonce =
      opt_accepted_payment_token_nonce !== undefined &&
      opt_accepted_payment_token_nonce !== null; // 0 is valid
    const hasStartTime =
      opt_start_time !== undefined && opt_start_time !== null;

    // Determine how many optional args we need to send
    let argsNeeded = 0;
    if (hasStartTime) argsNeeded = 4;
    else if (hasPaymentTokenNonce) argsNeeded = 3;
    else if (hasSftMaxOne) argsNeeded = 2;
    else if (opt_min_bid_diff) argsNeeded = 1;

    if (argsNeeded >= 1) {
      args.push(
        opt_min_bid_diff ? bigToHex(BigInt(opt_min_bid_diff.toFixed())) : ''
      );
    }
    if (argsNeeded >= 2) {
      // Boolean to hex: true -> '01', false -> '' (or '00')
      args.push(opt_sft_max_one_per_payment ? '01' : '');
    }
    if (argsNeeded >= 3) {
      args.push(
        opt_accepted_payment_token_nonce
          ? bigToHex(BigInt(opt_accepted_payment_token_nonce))
          : ''
      );
    }
    if (argsNeeded >= 4) {
      args.push(opt_start_time ? bigToHex(BigInt(opt_start_time)) : '');
    }

    // Append args to payload
    const extraPayload = args.length > 0 ? '@' + args.join('@') : '';
    const fullPayload = payload + extraPayload;

    const transaction = new Transaction({
      value: BigInt(0),
      data: new TextEncoder().encode(fullPayload),
      receiver: new Address(address),
      gasLimit: BigInt('14000000'),

      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing auction transaction',
        errorMessage: 'An error occurred during auction creation',
        successMessage: 'Auction transaction successful'
      }
    });

    if (sessionId) {
      setTransactionSessionId(sessionId);
    }
  };

  // ...

  const checkTransactionStatus = async (hash: string) => {
    try {
      console.log('🔍 Checking transaction status for:', hash);
      const events = await waitForTransactionEvent(hash, MARKETPLACE_EVENTS);

      console.log('✅ Transaction events found:', events);

      // Find the auction_token_event to get the auction ID
      const auctionEvent = events.find(
        (e) => e.identifier === 'auction_token_event'
      );

      if (auctionEvent) {
        const auctionId = auctionEvent.auction_id;
        console.log('🎉 Auction created with ID:', auctionId);
        navigate(`/marketplace/listings/${auctionId}`);
      } else {
        console.warn('⚠️ No auction_token_event found in transaction logs');
      }
    } catch (error) {
      console.error('❌ Error checking transaction status:', error);
    }
  };

  return (
    <>
      {!hasPendingTransactions ? (
        <button
          className='dinoButton'
          onClick={sendFundTransaction}
          disabled={disabled}
        >
          {t('marketplace:create_listing')}
        </button>
      ) : (
        <button className='dinoButton' disabled>
          {t('marketplace:processing')}
        </button>
      )}
    </>
  );
};
