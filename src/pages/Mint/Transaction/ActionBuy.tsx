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
import { t } from 'i18next';

export const ActionBuy = ({ price, hasBuyed, payment_token, balance }: any) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();

  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;
  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();
  const fees = new BigNumber(140669180000000);

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  const sendFundTransaction = async () => {
    let transaction: Transaction | Transaction[] = [];
    let payload = 'buy';

    if (payment_token == 'EGLD') {
      transaction = new Transaction({
        value: BigInt(price),
        data: new TextEncoder().encode(payload),
        receiver: new Address(mintcontractAddress),
        gasLimit: BigInt('14000000'),

        gasPrice: BigInt(GAS_PRICE),
        chainID: network.chainId,
        sender: new Address(address),
        version: 1
      });
    } else {
      payload =
        'ESDTTransfer@' +
        Buffer.from(payment_token, 'utf8').toString('hex') +
        '@' +
        bigToHex(BigInt(price)) +
        '@' +
        Buffer.from('buy', 'utf8').toString('hex');
      transaction = new Transaction({
        value: BigInt(0),
        data: new TextEncoder().encode(payload),
        receiver: new Address(mintcontractAddress),
        gasLimit: BigInt('14000000'),

        gasPrice: BigInt(GAS_PRICE),
        chainID: network.chainId,
        sender: new Address(address),
        version: 1
      });
    }

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing mint transaction',
        errorMessage: 'An error has occured mint',
        successMessage: 'Mint transaction successful'
      }
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
          <button className='dinoButton' onClick={() => navigate('/unlock')}>
            Connect
          </button>
        </>
      ) : (
        <>
          {!hasPendingTransactions ? (
            <>
              <button
                className='dinoButton'
                onClick={sendFundTransaction}
                disabled={
                  hasBuyed ||
                  balance.isLessThan(new BigNumber(price).plus(fees))
                    ? true
                    : false
                }
              >
                {balance.isLessThan(new BigNumber(price).plus(fees))
                  ? 'balance too low'
                  : hasBuyed
                  ? 'One mint per wallet'
                  : 'Mint'}
              </button>
            </>
          ) : (
            <>
              <button className='dinoButton' disabled>
                Processing
              </button>
            </>
          )}
        </>
      )}
    </>
  );
};
