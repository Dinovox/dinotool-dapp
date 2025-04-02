import React from 'react';
import { useGetAccountInfo } from '../../hooks/useGetAccountInfo';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { Transaction } from '@multiversx/sdk-core';
import { gasLimit } from '../../config/gasLimit';
import { chainID } from '../../config/chainID';
import { Button } from '../../components/Button';
import { useTranslation } from 'react-i18next';

interface ActionAssignRoleProps {
  tokenIdentifier: string;
  addressToAssign: string;
  roles: string[];
  disabled?: boolean;
}

export const ActionAssignRole: React.FC<ActionAssignRoleProps> = ({
  tokenIdentifier,
  addressToAssign,
  roles,
  disabled = false
}) => {
  const { address, account } = useGetAccountInfo();
  const { sendTransaction } = useTransaction();
  const { t } = useTranslation();

  const handleAssignRole = async () => {
    if (!address) return;

    // Convert token identifier and address to hex
    const tokenIdentifierHex = Buffer.from(tokenIdentifier).toString('hex');
    const addressHex = Buffer.from(addressToAssign).toString('hex');

    // Convert all roles to hex and join with @
    const rolesHex = roles
      .map((role) => Buffer.from(role).toString('hex'))
      .join('@');

    // Construct the data field
    const data = `setSpecialRole@${tokenIdentifierHex}@${addressHex}@${rolesHex}`;

    const assignRoleTransaction = new Transaction({
      value: '0',
      data: new Uint8Array(Buffer.from(data)),
      gasLimit: gasLimit.setSpecialRole,
      receiver:
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u',
      sender: address,
      chainID: chainID
    });

    await sendTransaction(assignRoleTransaction);
  };

  return (
    <Button
      onClick={handleAssignRole}
      disabled={disabled || !address}
      className='dinoButton'
    >
      {t('home:assign_role')}
    </Button>
  );
};
