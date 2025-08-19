import React from 'react';
import { useGetAccountInfo } from 'lib';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
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
