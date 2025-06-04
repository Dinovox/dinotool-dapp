import React from 'react';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { Address } from '@multiversx/sdk-core/out';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import BigNumber from 'bignumber.js';
import { bigNumToHex } from 'helpers/bigNumToHex';
import { t } from 'i18next';
export const ActionUnFreeze: React.FC<{
  tokenIdentifier: string;
  address: string;
  nonce: BigNumber;
}> = ({ tokenIdentifier, address, nonce }) => {
  const tokenIdentifierHex = Buffer.from(tokenIdentifier).toString('hex');

  const handleSend = async () => {
    const addressHex = new Address(address).hex();
    let tx_data = `unFreeze@${tokenIdentifierHex}@${addressHex}`;
    if (nonce.isGreaterThan(0)) {
      tx_data = `unFreezeSingleNFT@${tokenIdentifierHex}@${bigNumToHex(
        nonce
      )}@${addressHex}`;
    }
    const createTransaction = {
      value: '0',
      data: tx_data,
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
            {t('collections:unfreeze_wallet')}
          </button>
        </>
      )}
    </>
  );
};
