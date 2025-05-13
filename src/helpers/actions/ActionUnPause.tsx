import React from 'react';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
export const ActionUnPause: React.FC<{
  tokenIdentifier: string;
}> = ({ tokenIdentifier }) => {
  const { address } = useGetAccountInfo();
  const tokenIdentifierHex = Buffer.from(tokenIdentifier).toString('hex');

  const handleSend = async () => {
    const createTransaction = {
      value: '0',
      data: `unPause@${tokenIdentifierHex}`,
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
          <button className='dinoButton' onClick={handleSend}>
            UnPause
          </button>
        </>
      )}
    </>
  );
};
