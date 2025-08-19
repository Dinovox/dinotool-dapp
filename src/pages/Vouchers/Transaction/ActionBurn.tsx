import * as React from 'react';
import { useState } from 'react';
import { useGetPendingTransactions, useGetIsLoggedIn } from 'lib';
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

import { mintcontractAddress } from 'config';
// import toHex from 'helpers/toHex';
import bigToHex from 'helpers/bigToHex';
import BigNumber from 'bignumber.js';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const ActionBurn = ({ identifier, nonce, quantity }: any) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();

  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();
  const fees = new BigNumber(140669180000000);
  const { t } = useTranslation();

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  const sendTransaction = async () => {
    const payload =
      'ESDTNFTBurn@' +
      Buffer.from(identifier, 'utf8').toString('hex') +
      '@' +
      bigToHex(BigInt(nonce)) +
      '@' +
      bigToHex(BigInt(quantity));

    const transaction = new Transaction({
      value: BigInt('0'),
      data: new TextEncoder().encode(payload),
      receiver: new Address(address),
      gasLimit: BigInt('300000'),

      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing burn transaction',
        errorMessage: 'An error has occured burn',
        successMessage: 'Burn transaction successful'
      }
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
