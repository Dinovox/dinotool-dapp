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

interface ActionTransferOwnershipProps {
  tokenIdentifier: string;
  newAddress: string;
  disabled?: boolean;
}

export const ActionTransferOwnership: React.FC<
  ActionTransferOwnershipProps
> = ({ tokenIdentifier, newAddress, disabled = false }) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();
  const { t } = useTranslation();

  const handleSend = async () => {
    if (!address) return;

    // Convert token identifier and address to hex
    const tokenIdentifierHex = Buffer.from(tokenIdentifier).toString('hex');
    const newAddressHex = new Address(newAddress).toHex();

    // Construct the data field
    const payload = `transferOwnership@${tokenIdentifierHex}@${newAddressHex}`;

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
      {t('collections:transfer_role')}
    </button>
  );
};
