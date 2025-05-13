import React from 'react';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { Address } from '@multiversx/sdk-core/out';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
export const ActionUnFreeze: React.FC<{
  tokenIdentifier: string;
  addressToAssign: string;
}> = ({ tokenIdentifier, addressToAssign }) => {
  const tokenIdentifierHex = Buffer.from(tokenIdentifier).toString('hex');
  const addressHex = new Address(addressToAssign).hex();

  const handleSend = async () => {
    const createTransaction = {
      value: '0',
      data: `unFreeze@${tokenIdentifierHex}@${addressHex}`,
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
            UnFreeze Address
          </button>
        </>
      )}
    </>
  );
};
