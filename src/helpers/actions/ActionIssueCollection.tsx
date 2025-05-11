import React from 'react';
import { Button } from 'antd';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { Address } from '@multiversx/sdk-core/out';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import BigNumber from 'bignumber.js';
import { bigNumToHex } from '../bigNumToHex';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from 'hooks/useLoadTranslations';

interface ActionIssueProps {
  type: string;
  isDynamic: boolean;
  name: string;
  ticker: string;
  disabled?: boolean;
}

export const ActionIssueCollection: React.FC<ActionIssueProps> = ({
  type,
  isDynamic,
  name,
  ticker,
  disabled = false
}) => {
  const { address, account } = useGetAccountInfo();
  const { t } = useTranslation();
  const loading = useLoadTranslations('actions');

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
    const typeHex = Buffer.from(type).toString('hex');
    const denominator = new BigNumber('0');
    let data = '';
    if (isDynamic) {
      data = `registerDynamic@${nameHex}@${tickerHex}@${typeHex}@${canFreezeHex}@${trueHex}@${canWipeHex}@${trueHex}@${canPauseHex}@${trueHex}@${canTransferNFTCreateRoleHex}@${trueHex}@${canChangeOwnerHex}@${trueHex}@${canUpgradeHex}@${trueHex}@${canAddSpecialRolesHex}@${trueHex}`;
    } else {
      const fn = type === 'NFT' ? 'issueNonFungible' : 'issueSemiFungible';
      data = `${fn}@${nameHex}@${tickerHex}@${canFreezeHex}@${trueHex}@${canWipeHex}@${trueHex}@${canPauseHex}@${trueHex}@${canTransferNFTCreateRoleHex}@${trueHex}@${canChangeOwnerHex}@${trueHex}@${canUpgradeHex}@${trueHex}@${canAddSpecialRolesHex}@${trueHex}`;
    }

    const createTransaction = {
      value: '50000000000000000', // 0.05 EGLD
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
        processingMessage: 'Processing SFT creation transaction',
        errorMessage: 'An error occurred during SFT creation',
        successMessage: 'SFT creation transaction successful'
      }
    });
  };

  return (
    <button
      onClick={handleIssue}
      disabled={disabled || !address}
      className='dinoButton'
    >
      {t('actions:issue_token_sft')}
    </button>
  );
};
