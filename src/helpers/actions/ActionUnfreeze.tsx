import React from 'react';
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
import BigNumber from 'bignumber.js';
import { bigNumToHex } from 'helpers/bigNumToHex';
import { t } from 'i18next';
export const ActionUnFreeze: React.FC<{
  tokenIdentifier: string;
  addressTarget: string;
  nonce: BigNumber;
}> = ({ tokenIdentifier, addressTarget, nonce }) => {
  const tokenIdentifierHex = Buffer.from(tokenIdentifier).toString('hex');

  const handleSend = async () => {
    const { network } = useGetNetworkConfig();
    const { address } = useGetAccountInfo();

    const addressHex = new Address(address).toHex();
    let payload = `unFreeze@${tokenIdentifierHex}@${addressHex}`;
    if (nonce.isGreaterThan(0)) {
      payload = `unFreezeSingleNFT@${tokenIdentifierHex}@${bigNumToHex(
        nonce
      )}@${addressHex}`;
    }
    const transaction = new Transaction({
      value: BigInt('0'),
      data: new TextEncoder().encode(payload),
      receiver: new Address(
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u'
      ),
      gasLimit: BigInt('60000000'),

      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    await signAndSendTransactions({
      transactions: [transaction],
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
