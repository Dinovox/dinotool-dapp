import * as React from 'react';
import { useState } from 'react';
import { useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetPendingTransactions';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import {
  lotteryContractAddress,
  xgraou_identifier,
  graou_identifier
} from 'config';
// import toHex from 'helpers/toHex';
import { Address } from '@multiversx/sdk-core/out';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { Button } from './Button';
import bigToHex from 'helpers/bigToHex';
import BigNumber from 'bignumber.js';
import { lotteryContract } from 'utils/smartContract';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';

// import './../../Mint/MintSFT.css';

export const ActionBuy = ({
  lottery_id,
  price_identifier,
  price_nonce,
  price_amount,
  buyed,
  balance,
  esdt_balance,
  graou_balance,
  sft_balance,
  started,
  ended
}: any) => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();
  const { hasPendingTransactions } = useGetPendingTransactions();

  const fees = new BigNumber(100000000000000);

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
    } else if (price_identifier == 'FREE-000000') {
      fundTransaction = {
        value: 0,
        data:
          'ESDTTransfer@' +
          Buffer.from(graou_identifier, 'utf8').toString('hex') +
          '@' +
          bigToHex(BigInt(price_amount)) +
          '@' +
          Buffer.from('buy', 'utf8').toString('hex') +
          '@' +
          bigToHex(BigInt(lottery_id)),
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
      transactions: [fundTransaction],
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
          <button
            disabled={
              ended ||
              balance.isLessThan(fees) ||
              (price_identifier == 'FREE-000000' &&
                graou_balance.isLessThan(new BigNumber(price_amount))) ||
              buyed ||
              (price_identifier == 'EGLD-000000' &&
                balance.isLessThan(new BigNumber(price_amount).plus(fees))) ||
              (price_identifier != 'EGLD-000000' &&
                price_identifier != 'FREE-000000' &&
                price_nonce == 0 &&
                esdt_balance.isLessThan(new BigNumber(price_amount))) ||
              (price_identifier != 'EGLD-000000' &&
                price_nonce > 0 &&
                sft_balance.isLessThan(new BigNumber(price_amount)))
                ? true
                : false
            }
            onClick={sendFundTransaction}
            className={'dinoButton'}
          >
            {ended
              ? 'Lottery ended'
              : balance.isLessThan(fees) ||
                (price_identifier == 'FREE-000000' &&
                  graou_balance.isLessThan(new BigNumber(price_amount))) ||
                (price_identifier == 'EGLD-000000' &&
                  balance.isLessThan(new BigNumber(price_amount).plus(fees))) ||
                (price_identifier != 'EGLD-000000' &&
                  price_identifier != 'FREE-000000' &&
                  price_nonce == 0 &&
                  esdt_balance.isLessThan(new BigNumber(price_amount))) ||
                (price_identifier != 'EGLD-000000' &&
                  price_nonce != 0 &&
                  sft_balance.isLessThan(new BigNumber(price_amount)))
              ? t('lotteries:balance_not_enough')
              : buyed
              ? t('lotteries:max_buy_reached')
              : t('lotteries:buy_ticket')}
          </button>
        </>
      ) : (
        <>
          <button className='dinoButton' disabled={true}>
            {t('lotteries:Processing')}
          </button>
        </>
      )}
    </>
  );
};
