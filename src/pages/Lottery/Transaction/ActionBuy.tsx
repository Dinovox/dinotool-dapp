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

export const ActionBuy = ({
  lottery_id,
  price_identifier,
  price_nonce,
  price_amount,
  buyed,
  balance
}: any) => {
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
  const sendFundTransaction = async () => {
    let fundTransaction;
    if (price_identifier == 'EGLD-000000') {
      fundTransaction = {
        value: price_amount,
        data: 'buy@' + bigToHex(BigInt(lottery_id)),
        receiver: addressTobech32,
        gasLimit: '14000000'
      };
    } else if (price_nonce == 0) {
      fundTransaction = {
        value: 0,
        data:
          'ESDTTransfer@' +
          Buffer.from(price_identifier, 'utf8').toString('hex') +
          '@' +
          bigToHex(BigInt(price_amount)) +
          '@' +
          Buffer.from('buy', 'utf8').toString('hex') +
          '@' +
          bigToHex(BigInt(lottery_id)),
        receiver: addressTobech32,
        gasLimit: '14000000'
      };
    } else {
      fundTransaction = {
        value: 0,
        data:
          'ESDTNFTTransfer@' +
          Buffer.from(price_identifier, 'utf8').toString('hex') +
          '@' +
          bigToHex(BigInt(price_nonce)) +
          '@' +
          bigToHex(BigInt(price_amount)) +
          '@' +
          addressTobech32.hex() +
          '@' +
          Buffer.from('buy', 'utf8').toString('hex') +
          '@' +
          bigToHex(BigInt(lottery_id)),
        receiver: address,
        gasLimit: '14000000'
      };
    }
    await refreshAccount();

    const { sessionId /*, error*/ } = await sendTransactions({
      transactions: fundTransaction,
      transactionsDisplayInfo: {
        processingMessage: 'Processing buy transaction',
        errorMessage: 'An error has occured buy',
        successMessage: 'Buy transaction successful'
      },
      redirectAfterSign: false
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
          <Button
            buttonWidth='100%'
            borderRadius={10}
            background={'rgba(245, 237, 67, 1)'}
            textColor=''
            fontSize='32px'
            text={
              balance.isLessThan(new BigNumber(price_amount).plus(fees))
                ? 'balance too low'
                : buyed
                ? 'One mint per wallet'
                : 'Buy ticket'
            }
            disabled={
              buyed ||
              balance.isLessThan(new BigNumber(price_amount).plus(fees))
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
