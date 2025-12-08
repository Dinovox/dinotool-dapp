import * as React from 'react';
import { useState, useEffect } from 'react';
import { useGetPendingTransactions, useGetSuccessfulTransactions } from 'lib';
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
import { lotteryContractAddress } from 'config';
import bigToHex from 'helpers/bigToHex';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';
import { red } from '@mui/material/colors';
import { useNavigate } from 'react-router-dom';

export const ActionDelete = ({ lottery_id }: any) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();
  const navigate = useNavigate();

  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();

  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  const successfulTransactions = useGetSuccessfulTransactions();
  const [previousSuccessCount, setPreviousSuccessCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the count on first render
  useEffect(() => {
    if (!isInitialized) {
      setPreviousSuccessCount(successfulTransactions.length);
      setIsInitialized(true);
    }
  }, [isInitialized, successfulTransactions.length]);

  // Redirect when a new successful transaction is detected
  useEffect(() => {
    if (isInitialized && successfulTransactions.length > previousSuccessCount) {
      // A new transaction was successful
      console.log('successfulTransactions', successfulTransactions);
      setPreviousSuccessCount(successfulTransactions.length);
      // Small delay to ensure transaction is fully processed
      setTimeout(() => {
        navigate('/lotteries?page=1&status=owned');
      }, 500);
    }
  }, [
    successfulTransactions.length,
    previousSuccessCount,
    navigate,
    isInitialized
  ]);

  // console.log('price_identifier', price_identifier);
  // console.log('price_nonce', price_nonce.toFixed());
  // console.log('price_amount', price_amount.toFixed());
  const sendFundTransaction = async () => {
    const payload = 'delete@' + bigToHex(BigInt(lottery_id));

    const transaction = new Transaction({
      value: BigInt('0'),
      data: new TextEncoder().encode(payload),
      receiver: new Address(lotteryContractAddress),
      gasLimit: BigInt('14000000'),

      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing Delete transaction',
        errorMessage: 'An error has occured delete',
        successMessage: 'Delete transaction successful'
      }
    });
    // Transaction will be tracked via successfulTransactions hook
  };
  if (!address) {
    return null;
  }
  return (
    <>
      {!hasPendingTransactions ? (
        <>
          <button className='dinoButton reverse' onClick={sendFundTransaction}>
            {t('lotteries:delete_lottery')}{' '}
          </button>
        </>
      ) : (
        <>
          <button className='dinoButton' disabled>
            {t('lotteries:processing')}{' '}
          </button>
        </>
      )}
    </>
  );
};
