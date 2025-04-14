import * as React from 'react';
import { useState } from 'react';
import { useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetPendingTransactions';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import { mintcontractAddress } from 'config';
// import toHex from 'helpers/toHex';
import { Address } from '@multiversx/sdk-core/out';
import {
  useGetAccountInfo,
  useGetIsLoggedIn
} from '@multiversx/sdk-dapp/hooks';
import bigToHex from 'helpers/bigToHex';
import BigNumber from 'bignumber.js';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const ActionBurn = ({ identifier, nonce, quantity }: any) => {
  const { hasPendingTransactions } = useGetPendingTransactions();
  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();
  const fees = new BigNumber(140669180000000);
  const { t } = useTranslation();

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  // const addressTobech32 = new Address(mintcontractAddress);
  const { address } = useGetAccountInfo();

  const sendTransaction = async () => {
    const transaction = {
      value: 0,
      data:
        'ESDTNFTBurn@' +
        Buffer.from(identifier, 'utf8').toString('hex') +
        '@' +
        bigToHex(BigInt(nonce)) +
        '@' +
        bigToHex(BigInt(quantity)),
      receiver: address,
      gasLimit: '300000'
    };

    await refreshAccount();

    const { sessionId /*, error*/ } = await sendTransactions({
      transactions: transaction,
      transactionsDisplayInfo: {
        processingMessage: 'Processing burn transaction',
        errorMessage: 'An error has occured burn',
        successMessage: 'Burn transaction successful'
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
          <button className='dinoButton dinoDanger' onClick={sendTransaction}>
            {t('vouchers:burn')}
          </button>
        </>
      ) : (
        <>
          <button className='dinoButton' disabled>
            {t('vouchers:processing')}
          </button>
        </>
      )}
    </>
  );
};
