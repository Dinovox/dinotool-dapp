import * as React from 'react';
import { useState } from 'react';
import { useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetPendingTransactions';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import { lotteryContractAddress } from 'config';
import { Address } from '@multiversx/sdk-core/out';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import bigToHex from 'helpers/bigToHex';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';
import { red } from '@mui/material/colors';

export const ActionDelete = ({ lottery_id }: any) => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();

  const { hasPendingTransactions } = useGetPendingTransactions();

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  const addressTobech32 = new Address(lotteryContractAddress);
  const { address } = useGetAccountInfo();

  // console.log('price_identifier', price_identifier);
  // console.log('price_nonce', price_nonce.toFixed());
  // console.log('price_amount', price_amount.toFixed());
  const sendFundTransaction = async () => {
    const fundTransaction = {
      value: 0,
      data: 'delete@' + bigToHex(BigInt(lottery_id)),
      receiver: addressTobech32,
      gasLimit: '14000000'
    };

    await refreshAccount();

    const { sessionId /*, error*/ } = await sendTransactions({
      transactions: fundTransaction,
      transactionsDisplayInfo: {
        processingMessage: 'Processing Delete transaction',
        errorMessage: 'An error has occured delete',
        successMessage: 'Delete transaction successful'
      },
      redirectAfterSign: true,
      redirectPath: '/lotteries'
    });
    if (sessionId != null) {
      setTransactionSessionId(sessionId);
    }
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
