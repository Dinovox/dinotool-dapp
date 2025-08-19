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
import { useTranslation } from 'react-i18next';
import { bigNumToHex } from 'helpers/bigNumToHex';
import useLoadTranslations from 'hooks/useLoadTranslations';
import BigNumber from 'bignumber.js';

interface ActionModifyCreatorProps {
  tokenIdentifier: string;
  nonce: BigNumber;
  disabled?: boolean;
}

export const ActionModifyCreator: React.FC<ActionModifyCreatorProps> = ({
  tokenIdentifier,
  nonce,
  disabled = false
}) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();
  const { t } = useTranslation();
  const loading = useLoadTranslations('collections');

  const handleSend = async () => {
    if (!address) return;

    // Convert token identifier and address to hex
    const tokenIdentifierHex = Buffer.from(tokenIdentifier).toString('hex');
    const nonceHex = bigNumToHex(nonce);

    // Construct the data field
    const payload = `ESDTModifyCreator@${tokenIdentifierHex}@${nonceHex}`;

    const transaction = new Transaction({
      value: BigInt('0'),
      data: new TextEncoder().encode(payload),
      receiver: new Address(address),
      gasLimit: BigInt('60000000'),

      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Processing set roles transaction',
        errorMessage: 'An error occurred during set roles',
        successMessage: 'SFT set roles successful'
      }
    });
  };

  return (
    <button
      onClick={handleSend}
      disabled={disabled || !address}
      className='dinoButton'
    >
      {t('collections:claim_creator')}
    </button>
  );
};
