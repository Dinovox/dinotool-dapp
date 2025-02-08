import * as React from 'react';
import { useState } from 'react';
import { useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetPendingTransactions';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import { mintcontractAddress } from 'config';
// import toHex from 'helpers/toHex';
import { Address } from '@multiversx/sdk-core/out';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { Button } from './Button';
import bigToHex from 'helpers/bigToHex';
import BigNumber from 'bignumber.js';

export const ActionBuy = ({ price, hasBuyed, payment_token, balance }: any) => {
  const { hasPendingTransactions } = useGetPendingTransactions();

  const fees = new BigNumber(140669180000000);

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  const addressTobech32 = new Address(mintcontractAddress);
  const { address } = useGetAccountInfo();

  const sendFundTransaction = async () => {
    let fundTransaction;
    if (payment_token == 'EGLD') {
      fundTransaction = {
        value: price,
        data: 'buy',
        receiver: addressTobech32,
        gasLimit: '14000000'
      };
    } else {
      fundTransaction = {
        value: 0,
        data:
          'ESDTTransfer@' +
          Buffer.from(payment_token, 'utf8').toString('hex') +
          '@' +
          bigToHex(BigInt(price)) +
          '@' +
          Buffer.from('buy', 'utf8').toString('hex'),
        receiver: addressTobech32,
        gasLimit: '14000000'
      };
    }
    await refreshAccount();

    const { sessionId /*, error*/ } = await sendTransactions({
      transactions: fundTransaction,
      transactionsDisplayInfo: {
        processingMessage: 'Processing mint transaction',
        errorMessage: 'An error has occured mint',
        successMessage: 'Mint transaction successful'
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
          <Button
            buttonWidth='100%'
            borderRadius={10}
            background={'rgba(245, 237, 67, 1)'}
            textColor=''
            fontSize='32px'
            text={
              balance.isLessThan(new BigNumber(price).plus(fees))
                ? 'balance too low'
                : hasBuyed
                ? 'One mint per wallet'
                : 'Mint'
            }
            disabled={
              hasBuyed || balance.isLessThan(new BigNumber(price).plus(fees))
                ? true
                : false
            }
            onClick={sendFundTransaction}
            padding='20px'
          />
        </>
      ) : (
        <>
          <Button
            buttonWidth='100%'
            borderRadius={40}
            background={'#f7ea43'}
            textColor='rgb(255 119 75)'
            borderColor={'black'}
            text='Processing'
            fontSize='32px'
            disabled={true}
            padding='20px'
          />
        </>
      )}
    </>
  );
};
