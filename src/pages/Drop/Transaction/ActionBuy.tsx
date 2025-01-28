import * as React from 'react';
import { useState } from 'react';
import { useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetPendingTransactions';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import { graou_identifier, mintcontractAddress, dropContract } from 'config';
// import toHex from 'helpers/toHex';
import { Address } from '@multiversx/sdk-core/out';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { Button } from './Button';
import { BigNumber } from 'bignumber.js';
import bigNumToHex from 'helpers/bigNumToHex';
export const ActionBuy = ({
  identifier,
  nonce,
  batches,
  submitted,
  onSubmit,
  disabled
}: any) => {
  const { hasPendingTransactions } = useGetPendingTransactions();

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  const dropTobech32 = new Address(dropContract);
  const { address } = useGetAccountInfo();

  const sendFundTransaction = async () => {
    if (onSubmit) {
      onSubmit();
    }
    const batchTx = [];
    for (const batch of batches) {
      let sub = '';
      for (const addr of batch.addresses) {
        const receiver = new Address(addr.address).toHex();
        sub = sub + '@' + receiver + '@' + bigNumToHex(addr.quantity);
      }

      // console.log(
      //   'sub',
      //   batch.totalQuantity,
      //   batch.totalQuantity.toString(16),
      //   batch.totalQuantity.toFixed(),
      //   bigNumToHex(batch.totalQuantity)
      // );
      batchTx.push({
        value: 0,
        data: 'addDrop' + sub,
        receiver: dropTobech32,
        gasLimit: 3000000 + batch.addresses.length * 580000
      });
    }
    // console.log('batchTx', batchTx);

    await refreshAccount();

    const { sessionId /*, error*/ } = await sendTransactions({
      transactions: batchTx,
      transactionsDisplayInfo: {
        processingMessage: 'Processing batch transaction',
        errorMessage: 'An error has occured batch',
        successMessage: 'Batch transaction successful'
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
            fontFamily='Bit Cell'
            text={submitted ? 'Submited' : 'Submit '}
            disabled={disabled}
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
            fontFamily='Bit Cell'
            disabled={true}
            padding='20px'
          />
        </>
      )}
    </>
  );
};
