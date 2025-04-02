import React from 'react';
import { useGetAccountInfo } from '../../hooks/useGetAccountInfo';
import { Transaction } from '@multiversx/sdk-core';
import { gasLimit } from '../../config/gasLimit';
import { chainID } from '../../config/chainID';
import { Button } from '../../components/Button';
import { useTranslation } from 'react-i18next';

interface ActionIssueProps {
  name: string;
  ticker: string;
  disabled?: boolean;
}

export const ActionIssue: React.FC<ActionIssueProps> = ({
  name,
  ticker,
  disabled = false
}) => {
  const { address, account } = useGetAccountInfo();
  const { sendTransaction } = useTransaction();
  const { t } = useTranslation();

  const handleIssue = async () => {
    if (!address) return;

    const nameHex = Buffer.from(name).toString('hex');
    const tickerHex = Buffer.from(ticker).toString('hex');
    const canFreezeHex = Buffer.from('canFreeze').toString('hex');
    const canWipeHex = Buffer.from('canWipe').toString('hex');
    const canPauseHex = Buffer.from('canPause').toString('hex');
    const canTransferNFTCreateRoleHex = Buffer.from(
      'canTransferNFTCreateRole'
    ).toString('hex');
    const canChangeOwnerHex = Buffer.from('canChangeOwner').toString('hex');
    const canUpgradeHex = Buffer.from('canUpgrade').toString('hex');
    const canAddSpecialRolesHex =
      Buffer.from('canAddSpecialRoles').toString('hex');
    const trueHex = Buffer.from('true').toString('hex');
    const falseHex = Buffer.from('false').toString('hex');

    const data = `issueSemiFungible@${nameHex}@${tickerHex}@${canFreezeHex}@${trueHex}@${canWipeHex}@${trueHex}@${canPauseHex}@${trueHex}@${canTransferNFTCreateRoleHex}@${trueHex}@${canChangeOwnerHex}@${trueHex}@${canUpgradeHex}@${trueHex}@${canAddSpecialRolesHex}@${trueHex}`;

    const issueTransaction = new Transaction({
      value: '50000000000000000', // 0.05 EGLD
      data: new Uint8Array(Buffer.from(data)),
      gasLimit: 60000000,
      receiver:
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u',
      sender: address,
      chainID: chainID
    });

    await sendTransaction(issueTransaction);
  };

  return (
    <Button
      onClick={handleIssue}
      disabled={disabled || !address}
      className='dinoButton'
    >
      {t('home:issue_token')}
    </Button>
  );
};
