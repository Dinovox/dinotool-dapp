import * as React from 'react';
import { useState } from 'react';
import { useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetPendingTransactions';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import { graou_identifier, mintcontractAddress, dropContract } from 'config';
// import toHex from 'helpers/toHex';
import { Address } from '@multiversx/sdk-core/out';
import {
  useGetAccountInfo,
  useGetIsLoggedIn
} from '@multiversx/sdk-dapp/hooks';
import { Button } from './Button';
import { BigNumber } from 'bignumber.js';
import bigNumToHex from 'helpers/bigNumToHex';
import { useNavigate } from 'react-router-dom';

export const ActionBuy = ({
  identifier,
  nonce,
  batches,
  submitted,
  onSubmit,
  disabled
}: any) => {
  const { hasPendingTransactions } = useGetPendingTransactions();
  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  const addressTobech32 = new Address(dropContract);
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
        data:
          'MultiESDTNFTTransfer@' +
          addressTobech32.toHex() +
          '@01@' +
          Buffer.from(identifier, 'utf8').toString('hex') +
          '@' +
          bigNumToHex(nonce > 0 ? nonce : new BigNumber(0)) +
          '@' +
          bigNumToHex(batch.totalQuantity) +
          '@' +
          Buffer.from('graou', 'utf8').toString('hex') +
          sub,
        receiver: address,
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
      {!isLoggedIn ? (
        <>
          {' '}
          <button onClick={() => navigate('/lotteries')}>Connect</button>
        </>
      ) : (
        <>
          {!hasPendingTransactions ? (
            <>
              <button className='dinoButton' onClick={sendFundTransaction}>
                {submitted ? 'Submited' : 'Submit '}
              </button>
            </>
          ) : (
            <>
              <button
                className='dinoButton'
                onClick={sendFundTransaction}
                disabled
              >
                Processing
              </button>
            </>
          )}
        </>
      )}
    </>
  );
};
