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
import {
  lotteryContractAddress,
  xgraou_identifier,
  graou_identifier
} from 'config';
// import toHex from 'helpers/toHex';
import bigToHex from 'helpers/bigToHex';
import BigNumber from 'bignumber.js';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from 'components/Button/ConnectButton';

// import './../../Mint/MintSFT.css';

export const ActionBuy = ({
  lottery_id,
  price_identifier,
  price_nonce,
  price_amount,
  price_decimals,
  buyed,
  balance,
  esdt_balance,
  graou_balance,
  sft_balance,
  time_start,
  ended
}: any) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();

  const loading = useLoadTranslations('lotteries');
  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();

  const { t } = useTranslation();
  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  const fees = new BigNumber(100000000000000);

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  const addressTobech32 = new Address(lotteryContractAddress);

  const sendFundTransaction = async () => {
    let transaction: Transaction | Transaction[] = [];
    let payload = 'buy@' + bigToHex(BigInt(lottery_id));
    if (price_identifier == 'EGLD-000000') {
      //Pay with EGLD
      transaction = new Transaction({
        value: BigInt(price_amount),
        data: new TextEncoder().encode(payload),
        receiver: addressTobech32,
        gasLimit: BigInt('20000000'),

        gasPrice: BigInt(GAS_PRICE),
        chainID: network.chainId,
        sender: new Address(address),
        version: 1
      });
    } else if (price_nonce == 0) {
      //Pay witt ESDT
      payload =
        'ESDTTransfer@' +
        Buffer.from(price_identifier, 'utf8').toString('hex') +
        '@' +
        bigToHex(price_amount.toFixed()) +
        '@' +
        Buffer.from('buy', 'utf8').toString('hex') +
        '@' +
        bigToHex(BigInt(lottery_id));
      transaction = new Transaction({
        value: BigInt('0'),
        data: new TextEncoder().encode(payload),
        receiver: addressTobech32,
        gasLimit: BigInt('20000000'),

        gasPrice: BigInt(GAS_PRICE),
        chainID: network.chainId,
        sender: new Address(address),
        version: 1
      });
    } else {
      //Pay with SFT
      payload =
        'ESDTNFTTransfer@' +
        Buffer.from(price_identifier, 'utf8').toString('hex') +
        '@' +
        bigToHex(BigInt(price_nonce)) +
        '@' +
        bigToHex(price_amount.toFixed()) +
        '@' +
        addressTobech32.toHex() +
        '@' +
        Buffer.from('buy', 'utf8').toString('hex') +
        '@' +
        bigToHex(BigInt(lottery_id));
      transaction = new Transaction({
        value: BigInt('0'),
        data: new TextEncoder().encode(payload),
        receiver: new Address(address),
        gasLimit: BigInt('20000000'),

        gasPrice: BigInt(GAS_PRICE),
        chainID: network.chainId,
        sender: new Address(address),
        version: 1
      });
    }

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing buy transaction',
        errorMessage: 'An error has occured buy',
        successMessage: 'Buy transaction successful'
      }
    });
    if (sessionId != null) {
      setTransactionSessionId(sessionId);
    }
  };
  // if (!address) {
  //   return null;
  // }

  return (
    <>
      {!isLoggedIn ? (
        <>
          {' '}
          <ConnectButton />
        </>
      ) : (
        <>
          {' '}
          {!hasPendingTransactions ? (
            <>
              <button
                disabled={
                  time_start > 0 ||
                  ended ||
                  balance.isLessThan(fees) ||
                  buyed ||
                  (price_identifier == 'EGLD-000000' &&
                    balance.isLessThan(
                      new BigNumber(price_amount).plus(fees)
                    )) ||
                  (price_identifier != 'EGLD-000000' &&
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
                {time_start > 0
                  ? t('lotteries:not_started')
                  : ended
                  ? t('lotteries:ended')
                  : balance.isLessThan(fees) ||
                    (price_identifier == 'EGLD-000000' &&
                      balance.isLessThan(
                        new BigNumber(price_amount).plus(fees)
                      )) ||
                    (price_identifier != 'EGLD-000000' &&
                      price_nonce == 0 &&
                      esdt_balance.isLessThan(new BigNumber(price_amount))) ||
                    (price_identifier != 'EGLD-000000' &&
                      price_nonce != 0 &&
                      sft_balance.isLessThan(new BigNumber(price_amount)))
                  ? t('lotteries:balance_not_enough')
                  : buyed
                  ? t('lotteries:max_buy_reached')
                  : t('lotteries:buy_ticket')}

                {/* Pay with EGLD ? */}
                {balance.isLessThan(fees) ||
                  (price_identifier == 'EGLD-000000' &&
                    balance.isLessThan(
                      new BigNumber(price_amount).plus(fees)
                    ) && (
                      <>
                        {' '}
                        {Number(
                          balance.dividedBy(10 ** 18).toFixed()
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 8
                        })}{' '}
                        /{' '}
                        {Number(
                          price_amount.dividedBy(10 ** 18).toFixed()
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 8
                        })}{' '}
                      </>
                    ))}

                {/* Pay with ESDT ? */}
                {price_identifier != 'EGLD-000000' &&
                  price_nonce == 0 &&
                  esdt_balance.isLessThan(new BigNumber(price_amount)) && (
                    <>
                      {' '}
                      {Number(
                        esdt_balance.dividedBy(10 ** price_decimals).toFixed()
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 8
                      })}{' '}
                      /{' '}
                      {Number(
                        price_amount.dividedBy(10 ** price_decimals).toFixed()
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 8
                      })}{' '}
                    </>
                  )}

                {/* Pay with SFT ? */}
                {price_identifier != 'EGLD-000000' &&
                  price_nonce != 0 &&
                  sft_balance.isLessThan(new BigNumber(price_amount)) && (
                    <>
                      {' '}
                      {sft_balance.toFixed()} / {price_amount.toFixed()}{' '}
                    </>
                  )}
              </button>
            </>
          ) : (
            <>
              <button className='dinoButton' disabled={true}>
                {t('lotteries:processing')}
              </button>
            </>
          )}
        </>
      )}
    </>
  );
};
