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
import useLoadTranslations from 'hooks/useLoadTranslations';

interface ActionControlChangesProps {
  tokenIdentifier: string;
  controls: any;
}

export const ActionControlChanges: React.FC<ActionControlChangesProps> = ({
  tokenIdentifier,
  controls
}) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();
  const { t } = useTranslation();
  const loading = useLoadTranslations('actions');

  const handleIssue = async () => {
    if (!address) return;

    const collectionHex = Buffer.from(tokenIdentifier).toString('hex');

    const controlsMap = {
      canFreeze: Buffer.from('canFreeze').toString('hex'),
      canWipe: Buffer.from('canWipe').toString('hex'),
      canPause: Buffer.from('canPause').toString('hex'),
      canChangeOwner: Buffer.from('canChangeOwner').toString('hex'),
      canUpgrade: Buffer.from('canUpgrade').toString('hex'),
      canAddSpecialRoles: Buffer.from('canAddSpecialRoles').toString('hex'),
      canTransferNFTCreateRole: Buffer.from(
        'canTransferNFTCreateRole'
      ).toString('hex')
    };

    const trueHex = Buffer.from('true').toString('hex');
    const falseHex = Buffer.from('false').toString('hex');

    const controlPairs = Object.entries(controlsMap).map(([key, hexKey]) => {
      const valueHex = controls[key] ? trueHex : falseHex;
      return `@${hexKey}@${valueHex}`;
    });

    const payload = `controlChanges@${collectionHex}${controlPairs.join('')}`;

    const transaction = new Transaction({
      value: BigInt('0'),
      data: new TextEncoder().encode(payload),
      gasLimit: BigInt('60000000'),
      receiver: new Address(
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u'
      ),

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
    <button onClick={handleIssue} className='dinoButton'>
      {t('collections:update_properties')}
    </button>
  );
};
