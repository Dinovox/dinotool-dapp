import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPendingTransactions } from 'lib';
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
import {
  lottery_cost,
  lotteryContractAddress,
  xgraou_identifier
} from 'config';
import BigNumber from 'bignumber.js';
import { bigNumToHex } from 'helpers/bigNumToHex';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';

export const ActionTransfert = ({
  egld_amout,
  token_amount,
  token_identifier,
  token_nonce,
  receiver_address
}: any) => {
  const { t } = useTranslation();
  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();

  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  const fees = new BigNumber(140669180000000);

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  // 0-50 ? 14000000
  // 100 : 14,736,515
  const sendFundTransaction = async () => {
    const payload =
      'MultiESDTNFTTransfer@' +
      new Address(receiver_address).toHex() +
      '@02@' +
      Buffer.from('EGLD-000000', 'utf8').toString('hex') +
      '@' +
      bigNumToHex(new BigNumber(0)) +
      '@' +
      bigNumToHex(
        new BigNumber(egld_amout).isGreaterThan(0)
          ? egld_amout
          : new BigNumber(1)
      ) +
      '@' +
      Buffer.from(token_identifier, 'utf8').toString('hex') +
      '@' +
      bigNumToHex(
        new BigNumber(token_nonce).isGreaterThan(0)
          ? new BigNumber(token_nonce)
          : new BigNumber(0)
      ) +
      '@' +
      bigNumToHex(new BigNumber(token_amount));

    const transaction = new Transaction({
      value: BigInt('0'),
      data: new TextEncoder().encode(payload),
      receiver: new Address(address),
      gasLimit: BigInt(500000),

      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing draw transaction',
        errorMessage: 'An error has occured draw',
        successMessage: 'Draw transaction successful'
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
          <button className='dinoButton' onClick={sendFundTransaction}>
            Transfert {token_amount} SFT &&{' '}
            {Number(
              new BigNumber(egld_amout).dividedBy(10 ** 18).toFixed()
            ).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 5
            })}{' '}
            EGLD to hosted wallet
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
