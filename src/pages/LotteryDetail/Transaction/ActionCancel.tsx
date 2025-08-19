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

export const ActionCancel = ({ lottery_id, is_disabled }: any) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();
  const { t } = useTranslation();
  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;
  const fees = new BigNumber(140669180000000);

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  // console.log('price_identifier', price_identifier);
  // console.log('price_nonce', price_nonce.toFixed());
  // console.log('price_amount', price_amount.toFixed());
  // 100 : 38,444,516 => 40000000 (EGLD)
  const sendFundTransaction = async () => {
    const payload = 'cancel@' + bigToHex(BigInt(lottery_id));
    const transaction = new Transaction({
      value: BigInt('0'),
      data: new TextEncoder().encode(payload),
      receiver: new Address(lotteryContractAddress),
      gasLimit: BigInt('40000000'),

      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing Cancel transaction',
        errorMessage: 'An error has occured cancel',
        successMessage: 'Cancel transaction successful'
      }
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
          <button
            className='dinoButton reverse'
            onClick={sendFundTransaction}
            disabled={is_disabled}
          >
            {t('lotteries:cancel_lottery')}
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
