import React from 'react';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { Address } from '@multiversx/sdk-core/out';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import BigNumber from 'bignumber.js';
import { bigNumToHex } from '../bigNumToHex';
export const ActionStopNFTCreate: React.FC<{
  tokenIdentifier: string;
}> = ({ tokenIdentifier }) => {
  const { address } = useGetAccountInfo();
  const handleSend = async () => {
    const createTransaction = {
      value: '0',
      data: `stopNFTCreate@${Buffer.from(tokenIdentifier).toString('hex')}`,
      receiver:
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u',
      gasLimit: 60000000
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
      {tokenIdentifier && (
        <>
          {' '}
          <div>Collection:{tokenIdentifier}</div>
          <button className='dinoButton' onClick={handleSend}>
            STOP Create SFT
          </button>
        </>
      )}
    </>
  );
};
