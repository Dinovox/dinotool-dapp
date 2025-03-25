import * as React from 'react';
import { useState } from 'react';
import { useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetPendingTransactions';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import { lotteryContractAddress } from 'config';
// import toHex from 'helpers/toHex';
import { Address } from '@multiversx/sdk-core/out';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { Button } from './Button';
import bigToHex from 'helpers/bigToHex';
import BigNumber from 'bignumber.js';
import { lotteryContract } from 'utils/smartContract';
import { useTranslation } from 'react-i18next';

export const ActionCancel = ({ lottery_id, is_disabled }: any) => {
  const { t } = useTranslation();
  const { hasPendingTransactions } = useGetPendingTransactions();

  const fees = new BigNumber(140669180000000);

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  const addressTobech32 = new Address(lotteryContractAddress);
  const { address } = useGetAccountInfo();

  // console.log('price_identifier', price_identifier);
  // console.log('price_nonce', price_nonce.toFixed());
  // console.log('price_amount', price_amount.toFixed());
  // 100 : 38,444,516 => 40000000 (EGLD)
  const sendFundTransaction = async () => {
    const fundTransaction = {
      value: 0,
      data: 'cancel@' + bigToHex(BigInt(lottery_id)),
      receiver: addressTobech32,
      gasLimit: '40000000'
    };

    await refreshAccount();

    const { sessionId /*, error*/ } = await sendTransactions({
      transactions: fundTransaction,
      transactionsDisplayInfo: {
        processingMessage: 'Processing Cancel transaction',
        errorMessage: 'An error has occured cancel',
        successMessage: 'Cancel transaction successful'
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
          <button
            className='dinoButton reverse'
            onClick={sendFundTransaction}
            disabled={is_disabled}
          >
            {t('lotteries:cancel_lottery')}
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
