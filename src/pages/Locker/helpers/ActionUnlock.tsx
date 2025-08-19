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
import { vaultContractAddress } from 'config';
// import toHex from 'helpers/toHex';
import bigToHex from 'helpers/bigToHex';
import BigNumber from 'bignumber.js';
import { useTranslation } from 'react-i18next';

export const ActionUnlockNft = ({ lockId }: any) => {
  const { t } = useTranslation();
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();

  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  const fees = new BigNumber(140669180000000);

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  const addressTobech32 = new Address(vaultContractAddress);

  // 0-50 ? 14000000
  // 100 : 14,736,515
  const sendFundTransaction = async () => {
    const payload = 'unlockNft@' + bigToHex(BigInt(lockId));

    const transaction = new Transaction({
      value: BigInt('0'),
      data: new TextEncoder().encode(payload),
      receiver: addressTobech32,
      gasLimit: BigInt('60000000'),

      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing unlock transaction',
        errorMessage: 'An error has occured unlocking the NFT',
        successMessage: 'Unlock transaction successful'
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
            {t('locker:unlock_nft')}
          </button>
        </>
      ) : (
        <>
          <button className='dinoButton' disabled>
            {t('locker:processing')}
          </button>
        </>
      )}
    </>
  );
};
