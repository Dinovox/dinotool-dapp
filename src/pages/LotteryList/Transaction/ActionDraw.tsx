import * as React from 'react';
import { useState } from 'react';
import { useGetPendingTransactions, useGetAccountInfo } from 'lib';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { lotteryContractAddress } from 'config';
// import toHex from 'helpers/toHex';
import { Address } from '@multiversx/sdk-core/out';
import { Button } from './Button';
import bigToHex from 'helpers/bigToHex';
import BigNumber from 'bignumber.js';
import { useTranslation } from 'react-i18next';

export const ActionDraw = ({ lottery_id, disabled, tickets }: any) => {
  const { t } = useTranslation();

  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  const fees = new BigNumber(140669180000000);

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  const addressTobech32 = new Address(lotteryContractAddress);
  const { address } = useGetAccountInfo();

  // 0-50 ? 14000000
  // 100 : 14,736,515
  const sendFundTransaction = async () => {
    const fundTransaction = {
      value: 0,
      data: 'draw@' + bigToHex(BigInt(lottery_id)),
      receiver: addressTobech32,
      gasLimit: '60000000'
    };

    const { sessionId /*, error*/ } = await sendTransactions({
      transactions: fundTransaction,
      transactionsDisplayInfo: {
        processingMessage: 'Processing draw transaction',
        errorMessage: 'An error has occured draw',
        successMessage: 'Draw transaction successful'
      },
      redirectAfterSign: false
    });
    if (sessionId != null) {
      setTransactionSessionId(sessionId);
    }
  };
  return (
    <>
      {!hasPendingTransactions ? (
        <>
          <button
            className='dinoButton'
            onClick={sendFundTransaction}
            disabled={disabled}
          >
            {t('lotteries:draw_lottery')}
          </button>
        </>
      ) : (
        <>
          <button className='dinoButton' disabled>
            {t('lotteries:processing')}
          </button>
        </>
      )}
    </>
  );
};
