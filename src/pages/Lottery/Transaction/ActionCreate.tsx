import * as React from 'react';
import { useState } from 'react';
import { useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetPendingTransactions';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import { lotteryContractAddress } from 'config';
// import toHex from 'helpers/toHex';
import { Address } from '@multiversx/sdk-core/out';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { Button } from './Button';
import BigNumber from 'bignumber.js';
import { lotteryContract } from 'utils/smartContract';
import bigNumToHex from 'helpers/bigNumToHex';

export const ActionCreate = ({
  prize_identifier,
  prize_nonce,
  prize_amount,
  price_identifier,
  price_nonce,
  price_amount,
  max_tickets,
  max_per_wallet,
  start_time,
  end_time,
  fee_percentage,
  disabled
}: any) => {
  const { hasPendingTransactions } = useGetPendingTransactions();

  const fees = new BigNumber(140669180000000);

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  const addressTobech32 = new Address(lotteryContractAddress);
  const { address } = useGetAccountInfo();

  const sendFundTransaction = async () => {
    //     mxpy contract call erd12stex47hwg0hvx8cfvukj3y3ugs7dm0686k3wasycffexva6ch9s7tvj29 --ledger --ledger-address-index 1 --pem="~/MultiversX/wallets/wallet.pem" --gas-limit=6000000 --recall-nonce --proxy="https://devnet-gateway.multiversx.com" --chain D --send --function="MultiESDTNFTTransfer" --arguments erd1qqqqqqqqqqqqqpgqyfrc02kk63ln5a83w0w55lme4u2d3c94ch9s3u5lmj 2 str:"GRAOU-c9dd53" 0 10000000000000000000 str:"GRAOU-c9dd53" 0 10000000000000000000 str:"create" \
    // str:"GRAOU-c9dd53" 0 1000000000000000000 \
    // 5 0 \
    // 0 0 \
    // 1
    // #price_identifier price_nonce price_amount
    // #max_tickets 4-100 max_per_wallet 0-25
    // #start_time end_time
    // #fee_percentage 0-1000 (10%)

    //multiesdt send :
    const graou_identifier = 'GRAOU-c9dd53';
    const graou_amount = new BigNumber(10000000000000000000); //STATIC ~ 10 GRAOU

    // //second send (prize)
    // const prize_identifier = 'GRAOU-c9dd53';
    // const prize_nonce = new BigNumber(0);
    // const prize_amount = new BigNumber(10000000000000000000);

    // //params for create
    // const price_identifier = 'GRAOU-c9dd53';
    // const price_nonce = new BigNumber(0);
    // const price_amount = new BigNumber(10000000000000000000);
    // const max_tickets = 5;
    // const max_per_wallet = 0;
    // const start_time = 0;
    // const end_time = 0;
    // const fee_percentage = 10;

    const sub =
      '@' +
      Buffer.from(price_identifier, 'utf8').toString('hex') +
      '@' +
      bigNumToHex(new BigNumber(price_nonce)) +
      '@' +
      bigNumToHex(new BigNumber(price_amount)) +
      '@' +
      bigNumToHex(new BigNumber(max_tickets)) +
      '@' +
      bigNumToHex(new BigNumber(max_per_wallet)) +
      '@' +
      bigNumToHex(new BigNumber(start_time)) +
      '@' +
      bigNumToHex(new BigNumber(end_time)) +
      '@' +
      bigNumToHex(new BigNumber(fee_percentage));

    const fundTransaction = {
      value: 0,
      data:
        'MultiESDTNFTTransfer@' +
        addressTobech32.toHex() +
        '@02@' +
        Buffer.from(graou_identifier, 'utf8').toString('hex') +
        '@' +
        bigNumToHex(new BigNumber(0)) +
        '@' +
        bigNumToHex(graou_amount) +
        '@' +
        Buffer.from(prize_identifier, 'utf8').toString('hex') +
        '@' +
        bigNumToHex(
          new BigNumber(prize_nonce).isGreaterThan(0)
            ? new BigNumber(prize_nonce)
            : new BigNumber(0)
        ) +
        '@' +
        bigNumToHex(new BigNumber(prize_amount)) +
        '@' +
        Buffer.from('create', 'utf8').toString('hex') +
        sub,
      receiver: address,
      gasLimit: '14000000'
    };

    await refreshAccount();

    const { sessionId /*, error*/ } = await sendTransactions({
      transactions: fundTransaction,
      transactionsDisplayInfo: {
        processingMessage: 'Processing create transaction',
        errorMessage: 'An error has occured create',
        successMessage: 'Create transaction successful'
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
          <Button
            buttonWidth='100%'
            borderRadius={10}
            background={'rgba(245, 237, 67, 1)'}
            textColor=''
            fontSize='32px'
            text={'Create Lottery'}
            disabled={disabled}
            onClick={sendFundTransaction}
            padding='20px'
          />
        </>
      ) : (
        <>
          <Button
            buttonWidth='100%'
            borderRadius={40}
            background={'#f7ea43'}
            textColor='rgb(255 119 75)'
            borderColor={'black'}
            text='Processing'
            fontSize='32px'
            disabled={true}
            padding='20px'
          />
        </>
      )}
    </>
  );
};
