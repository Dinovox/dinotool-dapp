import React from 'react';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { Address } from '@multiversx/sdk-core/out';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import BigNumber from 'bignumber.js';
import { bigNumToHex } from '../bigNumToHex';
export const ActionAddQuantity: React.FC<{
  collection: string;
  nonce: BigNumber;
  quantity: BigNumber;
}> = ({ collection, nonce, quantity }) => {
  const { address } = useGetAccountInfo();
  const handleSend = async () => {
    const createTransaction = {
      value: '0',
      data: `ESDTNFTAddQuantity@${Buffer.from(collection).toString(
        'hex'
      )}@${bigNumToHex(nonce)}@${bigNumToHex(quantity)}`,
      receiver: new Address(address).toBech32(),
      gasLimit: 10000000
    };

    await refreshAccount();

    const { sessionId, error } = await sendTransactions({
      transactions: createTransaction,
      transactionsDisplayInfo: {
        processingMessage: 'Processing SFT creation transaction',
        errorMessage: 'An error occurred during SFT creation',
        successMessage: 'SFT creation transaction successful'
      }
    });
  };

  return (
    <>
      {collection && (
        <>
          {' '}
          <button className='dinoButton' onClick={handleSend}>
            Add quantity{' '}
          </button>
        </>
      )}
    </>
  );
};
