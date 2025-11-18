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

type NumericLike = number | string | bigint;

export interface ActionAuctionTokenProps {
  auction_id: BigNumber;
  disabled?: boolean;
}
export const ActionWithdraw = ({
  auction_id,

  disabled
}: ActionAuctionTokenProps) => {
  const loading = useLoadTranslations('auctions');
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
    if (transactionSessionId && transactions[transactionSessionId]) {
      const tx = transactions[transactionSessionId]?.transactions[0]?.hash;
      if (tx) {
        setTxHash(tx);
        checkTransactionStatus(tx);
      }
    }
  }, [transactionSessionId, hasPendingTransactions]);

  const sendFundTransaction = async () => {
    const payload = 'withdraw@' + bigToHex(BigInt(auction_id.toFixed()));

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
        processingMessage: 'Processing auction transaction',
        errorMessage: 'An error occurred during auction creation',
        successMessage: 'Auction transaction successful'
      }
    });

    if (sessionId) {
      setTransactionSessionId(sessionId);
    }
  };

  const checkTransactionStatus = async (hash: string) => {
    const apiUrl = `${network.apiAddress}/transactions/${hash}`;

    for (let i = 0; i < 10; i++) {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Transaction not found');

        const txData = await response.json();
        if (txData.status === 'success' && txData.logs) {
          for (const event of txData.logs.events) {
            const encoded_topic = Buffer.from(
              'lotteryCreated',
              'utf8'
            ).toString('base64');

            if (
              event.identifier === 'create' &&
              event.topics[0] === encoded_topic
            ) {
              const lotteryIdBase64 = event.topics[2];
              // const lotteryId = BigInt(
              //   Buffer.from(lotteryIdBase64, 'base64').toString('hex')
              // );
              const lotteryId = BigInt(
                '0x' + Buffer.from(lotteryIdBase64, 'base64').toString('hex')
              );
              navigate(`/lotteries/${lotteryId}`);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching transaction:', error);
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    console.warn('⚠️ LotteryCreated event not found');
  };

  return (
    <>
      {!hasPendingTransactions ? (
        <button
          className='dinoButton'
          onClick={sendFundTransaction}
          disabled={disabled}
        >
          {t('auction:withdraw_auction')}
        </button>
      ) : (
        <button className='dinoButton' disabled>
          {t('auction:processing')}
        </button>
      )}
    </>
  );
};
