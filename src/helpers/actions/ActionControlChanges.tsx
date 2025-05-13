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
import { Collection } from 'helpers/api/accounts/getCollections';

interface ActionControlChangesProps {
  tokenIdentifier: string;
  controls: any;
}

export const ActionControlChanges: React.FC<ActionControlChangesProps> = ({
  tokenIdentifier,
  controls
}) => {
  const { address, account } = useGetAccountInfo();
  const { t } = useTranslation();
  const loading = useLoadTranslations('actions');

  const handleIssue = async () => {
    if (!address) return;

    console.log('controls', controls);
    const collectionHex = Buffer.from(tokenIdentifier).toString('hex');

    const controlsMap = {
      canFreeze: Buffer.from('canFreeze').toString('hex'),
      canWipe: Buffer.from('canWipe').toString('hex'),
      canPause: Buffer.from('canPause').toString('hex'),
      canChangeOwner: Buffer.from('canChangeOwner').toString('hex'),
      canUpgrade: Buffer.from('canUpgrade').toString('hex'),
      canAddSpecialRoles: Buffer.from('canAddSpecialRoles').toString('hex')

      // this should be accessible but return
      // Invalid argument
      // canTransferNftCreateRole: Buffer.from(
      //   'canTransferNftCreateRole'
      // ).toString('hex'),
    };

    const trueHex = Buffer.from('true').toString('hex');
    const falseHex = Buffer.from('false').toString('hex');

    const controlPairs = Object.entries(controlsMap).map(([key, hexKey]) => {
      const valueHex = controls[key] ? trueHex : falseHex;
      return `@${hexKey}@${valueHex}`;
    });

    const data = `controlChanges@${collectionHex}${controlPairs.join('')}`;

    const createTransaction = {
      value: 0,
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
    <button onClick={handleIssue} className='dinoButton'>
      {t('actions:issue_token_sft')}
    </button>
  );
};
