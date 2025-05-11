import React from 'react';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { Address } from '@multiversx/sdk-core/out';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import BigNumber from 'bignumber.js';
import { bigNumToHex } from '../bigNumToHex';
import { useTranslation } from 'react-i18next';
import { h } from 'framer-motion/dist/types.d-B50aGbjN';

interface ActionTransfertNFTCreateRoleProps {
  tokenIdentifier: string;
  currentAddress: string;
  newAddress: string;
  disabled?: boolean;
}

export const ActionTransfertNFTCreateRole: React.FC<
  ActionTransfertNFTCreateRoleProps
> = ({ tokenIdentifier, currentAddress, newAddress, disabled = false }) => {
  const { address, account } = useGetAccountInfo();
  const { t } = useTranslation();

  const handleSend = async () => {
    if (!address) return;

    // Convert token identifier and address to hex
    const tokenIdentifierHex = Buffer.from(tokenIdentifier).toString('hex');
    const currentAddressHex = new Address(currentAddress).toHex();
    const newAddressHex = new Address(newAddress).toHex();

    // Construct the data field
    const data = `transferNFTCreateRole@${tokenIdentifierHex}@${currentAddressHex}@${newAddressHex}`;

    const createTransaction = {
      value: '0',
      data: data,
      gasLimit: 60000000,
      receiver:
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u',
      sender: address
    };

    await refreshAccount();
    const { sessionId, error } = await sendTransactions({
      transactions: createTransaction,
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
      {t('actions:assign_role')}
    </button>
  );
};
