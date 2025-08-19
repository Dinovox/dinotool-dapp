import React from 'react';
import { useGetAccountInfo } from 'lib';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { Address } from '@multiversx/sdk-core/out';
import BigNumber from 'bignumber.js';
import { bigNumToHex } from '../bigNumToHex';
import { t } from 'i18next';
import { Collection } from 'helpers/api/accounts/getCollections';
import bigToHex from 'helpers/bigToHex';
export const ActionESDTNFTTransfer: React.FC<{
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
    let transactions = [];
    for (const item of batch) {
      const { collection, nonce, quantity } = item;
      transactions.push({
        value: '0',
        data:
          'ESDTNFTTransfer@' +
          Buffer.from(collection, 'utf8').toString('hex') +
          '@' +
          bigNumToHex(new BigNumber(nonce)) +
          '@' +
          bigNumToHex(new BigNumber(quantity)) +
          '@' +
          new Address(receiver).toHex() +
          methodData,
        receiver: new Address(address).toBech32(),
        gasLimit: 3000000
      });
    }

    const { sessionId, error } = await sendTransactions({
      transactions: transactions,
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
        send {batch.length} NFTs
      </button>
    </>
  );
};
