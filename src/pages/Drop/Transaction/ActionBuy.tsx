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
import { graou_identifier, mintcontractAddress, dropContract } from 'config';
// import toHex from 'helpers/toHex';
import { BigNumber } from 'bignumber.js';
import { bigNumToHex } from 'helpers/bigNumToHex';
import { useNavigate } from 'react-router-dom';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';

export const ActionBuy = ({
  identifier,
  nonce,
  batches,
  submitted,
  onSubmit,
  disabled
}: any) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();

  const loading = useLoadTranslations('drop');
  const { t } = useTranslation();
  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

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

      const payload =
        'MultiESDTNFTTransfer@' +
        new Address(dropContract).toHex() +
        '@01@' +
        Buffer.from(identifier, 'utf8').toString('hex') +
        '@' +
        bigNumToHex(nonce > 0 ? nonce : new BigNumber(0)) +
        '@' +
        bigNumToHex(batch.totalQuantity) +
        '@' +
        Buffer.from('graou', 'utf8').toString('hex') +
        sub;
      batchTx.push(
        new Transaction({
          value: BigInt('0'),
          data: new TextEncoder().encode(payload),
          receiver: new Address(address),
          gasLimit: BigInt(3000000 + batch.addresses.length * 580000),

          gasPrice: BigInt(GAS_PRICE),
          chainID: network.chainId,
          sender: new Address(address),
          version: 1
        })
      );
    }

    const sessionId = await signAndSendTransactions({
      transactions: batchTx,
      transactionsDisplayInfo: {
        processingMessage: 'Processing batch transaction',
        errorMessage: 'An error has occured batch',
        successMessage: 'Batch transaction successful'
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
                {t('drop:processing')}
              </button>
            </>
          )}
        </>
      )}
    </>
  );
};
