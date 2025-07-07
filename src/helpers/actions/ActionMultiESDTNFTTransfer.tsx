import React from 'react';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { Address } from '@multiversx/sdk-core/out';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import BigNumber from 'bignumber.js';
import { bigNumToHex } from '../bigNumToHex';
import { t } from 'i18next';
import { Collection } from 'helpers/api/accounts/getCollections';
import bigToHex from 'helpers/bigToHex';
export const ActionMultiESDTNFTTransfer: React.FC<{
  receiver: string;
  batch: { collection: string; nonce: number; quantity: number }[];
  method?: string;
  arguments?: string[];
}> = ({ receiver, batch, method }) => {
  const { address } = useGetAccountInfo();

  // const batch = [
  //   { nonce: 1, quantity: 1 },
  //   { nonce: 2, quantity: 2 }
  // ];

  let methodData = '';
  if (method) {
    methodData = '@' + Buffer.from('addCards', 'utf8').toString('hex');
  }
  const handleSend = async () => {
    const batchData = batch
      .map(
        ({ collection, nonce, quantity }) =>
          Buffer.from(collection, 'utf8').toString('hex') +
          '@' +
          bigNumToHex(new BigNumber(nonce)) +
          '@' +
          bigNumToHex(new BigNumber(quantity))
      )
      .join('@');

    const transaction = {
      value: '0',
      data:
        'MultiESDTNFTTransfer@' +
        new Address(receiver).toHex() +
        '@' +
        bigNumToHex(new BigNumber(batch.length)) +
        '@' +
        batchData +
        methodData,
      receiver: new Address(address).toBech32(),
      gasLimit: 3000000 + 2000000 * batch.length
    };

    await refreshAccount();

    const { sessionId, error } = await sendTransactions({
      transactions: transaction,
      transactionsDisplayInfo: {
        processingMessage: 'Processing SFT creation transaction',
        errorMessage: 'An error occurred during SFT creation',
        successMessage: 'SFT creation transaction successful'
      }
    });
  };

  return (
    <>
      <button className='dinoButton' onClick={handleSend}>
        send Multi {batch.length} NFTs v2
      </button>
    </>
  );
};
