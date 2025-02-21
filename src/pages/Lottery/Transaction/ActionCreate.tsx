import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetPendingTransactions';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import { lotteryContractAddress } from 'config';
import { Address } from '@multiversx/sdk-core/out';
import {
  useGetAccountInfo,
  useGetNetworkConfig
} from '@multiversx/sdk-dapp/hooks';
import BigNumber from 'bignumber.js';
import bigNumToHex from 'helpers/bigNumToHex';

export const ActionCreate = ({
  prize_identifier,
  prize_nonce,
  prize_amount,
  price_identifier,
  price_nonce,
  price_amount,
  max_tickets,
  max_per_wallet,
  start_time,
  end_time,
  fee_percentage,
  disabled
}: any) => {
  const { hasPendingTransactions, pendingTransactions } =
    useGetPendingTransactions();
  const navigate = useNavigate();
  const [transactionSessionId, setTransactionSessionId] = useState<
    string | null
  >(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();

  // 🎯 Vérifier si on a un txHash après l'envoi de la transaction
  useEffect(() => {
    if (transactionSessionId && pendingTransactions[transactionSessionId]) {
      const tx =
        pendingTransactions[transactionSessionId]?.transactions[0]?.hash;
      if (tx) {
        setTxHash(tx);
        checkTransactionStatus(tx);
      }
    }
  }, [transactionSessionId, pendingTransactions]);

  const sendFundTransaction = async () => {
    const graou_identifier = 'GRAOU-c9dd53';
    const graou_amount = new BigNumber(10000000000000000000);

    const sub =
      '@' +
      Buffer.from(price_identifier, 'utf8').toString('hex') +
      '@' +
      bigNumToHex(new BigNumber(price_nonce)) +
      '@' +
      bigNumToHex(new BigNumber(price_amount)) +
      '@' +
      bigNumToHex(new BigNumber(max_tickets)) +
      '@' +
      bigNumToHex(new BigNumber(max_per_wallet)) +
      '@' +
      bigNumToHex(new BigNumber(start_time)) +
      '@' +
      bigNumToHex(new BigNumber(end_time)) +
      '@' +
      bigNumToHex(new BigNumber(fee_percentage));

    const fundTransaction = {
      value: 0,
      data:
        'MultiESDTNFTTransfer@' +
        new Address(lotteryContractAddress).toHex() +
        '@02@' +
        Buffer.from(graou_identifier, 'utf8').toString('hex') +
        '@' +
        bigNumToHex(new BigNumber(0)) +
        '@' +
        bigNumToHex(graou_amount) +
        '@' +
        Buffer.from(prize_identifier, 'utf8').toString('hex') +
        '@' +
        bigNumToHex(
          new BigNumber(prize_nonce).isGreaterThan(0)
            ? new BigNumber(prize_nonce)
            : new BigNumber(0)
        ) +
        '@' +
        bigNumToHex(new BigNumber(prize_amount)) +
        '@' +
        Buffer.from('create', 'utf8').toString('hex') +
        sub,
      receiver: address,
      gasLimit: '14000000'
    };

    await refreshAccount();

    const { sessionId } = await sendTransactions({
      transactions: fundTransaction,
      transactionsDisplayInfo: {
        processingMessage: 'Processing create transaction',
        errorMessage: 'An error occurred during creation',
        successMessage: 'Create transaction successful'
      },
      redirectAfterSign: false
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
          Create Lottery
        </button>
      ) : (
        <button className='dinoButton' disabled>
          Processing
        </button>
      )}
    </>
  );
};
