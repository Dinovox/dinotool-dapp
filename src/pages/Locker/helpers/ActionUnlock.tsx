import * as React from 'react';
import { useState } from 'react';
import { useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetPendingTransactions';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import { vaultContractAddress } from 'config';
// import toHex from 'helpers/toHex';
import { Address } from '@multiversx/sdk-core/out';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import bigToHex from 'helpers/bigToHex';
import BigNumber from 'bignumber.js';
import { useTranslation } from 'react-i18next';

export const ActionUnlockNft = ({ lockId }: any) => {
  const { t } = useTranslation();

  const { hasPendingTransactions } = useGetPendingTransactions();

  const fees = new BigNumber(140669180000000);

  const /*transactionSessionId*/ [, setTransactionSessionId] = useState<
      string | null
    >(null);

  const addressTobech32 = new Address(vaultContractAddress);
  const { address } = useGetAccountInfo();

  // 0-50 ? 14000000
  // 100 : 14,736,515
  const sendFundTransaction = async () => {
    const fundTransaction = {
      value: 0,
      data: 'unlockNft@' + bigToHex(BigInt(lockId)),
      receiver: addressTobech32,
      gasLimit: '60000000'
    };

    await refreshAccount();

    const { sessionId /*, error*/ } = await sendTransactions({
      transactions: fundTransaction,
      transactionsDisplayInfo: {
        processingMessage: 'Processing unlock transaction',
        errorMessage: 'An error has occured unlocking the NFT',
        successMessage: 'Unlock transaction successful'
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
