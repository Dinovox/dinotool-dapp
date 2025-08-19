import * as React from 'react';
import { useState } from 'react';
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
import { lotteryContractAddress } from 'config';
// import toHex from 'helpers/toHex';
import bigToHex from 'helpers/bigToHex';
import BigNumber from 'bignumber.js';
import { useTranslation } from 'react-i18next';

export const ActionDraw = ({ lottery_id, disabled, tickets }: any) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();

  const { t } = useTranslation();

  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;
  const fees = new BigNumber(140669180000000);

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  // 0-50 ? 14000000
  // 100 : 14,736,515
  const sendFundTransaction = async () => {
    const payload = 'draw@' + bigToHex(BigInt(lottery_id));
    const transaction = new Transaction({
      value: BigInt('0'),
      data: new TextEncoder().encode(payload),
      receiver: new Address(lotteryContractAddress),
      gasLimit: BigInt('60000000'),

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
          <button
            className='dinoButton'
            onClick={sendFundTransaction}
            disabled={disabled}
          >
            {t('lotteries:draw_lottery')}
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
