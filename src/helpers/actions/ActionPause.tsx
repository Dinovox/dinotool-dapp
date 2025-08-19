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
import { bigNumToHex } from '../bigNumToHex';
import { t } from 'i18next';
import { Tooltip } from 'components/Tooltip';
export const ActionPause: React.FC<{
  tokenIdentifier: string;
}> = ({ tokenIdentifier }) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();
  const tokenIdentifierHex = Buffer.from(tokenIdentifier).toString('hex');

  const handleSend = async () => {
    const payload = `pause@${tokenIdentifierHex}`;
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
            <Tooltip content={t('collections:pause_tooltip')}>
              {t('collections:pause')}
            </Tooltip>
          </button>
        </>
      )}
    </>
  );
};
