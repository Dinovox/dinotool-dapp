import React from 'react';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { Address } from '@multiversx/sdk-core/out';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import { useTranslation } from 'react-i18next';
import { bigNumToHex } from 'helpers/bigNumToHex';
import useLoadTranslations from 'hooks/useLoadTranslations';

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
  const { address, account } = useGetAccountInfo();
  const { t } = useTranslation();
  const loading = useLoadTranslations('collections');

  const handleSend = async () => {
    if (!address) return;

    // Convert token identifier and address to hex
    const tokenIdentifierHex = Buffer.from(tokenIdentifier).toString('hex');
    const nonceHex = bigNumToHex(nonce);

    // Construct the data field
    const data = `ESDTModifyCreator@${tokenIdentifierHex}@${nonceHex}`;

    const createTransaction = {
      value: '0',
      data: data,
      gasLimit: 60000000,
      receiver: address,
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
      {t('collections:claim_creator')}
    </button>
  );
};
