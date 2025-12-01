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
  useGetAccountInfo,
  useGetIsLoggedIn
} from 'lib';
import BigNumber from 'bignumber.js';
import { bigNumToHex } from '../bigNumToHex';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { LoginModal } from 'provider/LoginModal';
import { ConnectButton } from 'components/Button/ConnectButton';

interface ActionIssueProps {
  type: string;
  isDynamic: boolean;
  name: string;
  ticker: string;
  decimals?: number;
  disabled?: boolean;
}

export const ActionIssueCollection: React.FC<ActionIssueProps> = ({
  type,
  isDynamic,
  name,
  ticker,
  decimals = 0,
  disabled = false
}) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();
  const { t } = useTranslation();
  const loading = useLoadTranslations('actions');
  const isLoggedIn = useGetIsLoggedIn();

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
    const denominator = bigNumToHex(new BigNumber(decimals));

    let payload = '';

    if (type === 'META') {
      if (isDynamic) {
        payload = `registerDynamic@${nameHex}@${tickerHex}@${typeHex}@${denominator}@${canFreezeHex}@${falseHex}@${canWipeHex}@${falseHex}@${canPauseHex}@${falseHex}@${canTransferNFTCreateRoleHex}@${trueHex}@${canChangeOwnerHex}@${falseHex}@${canUpgradeHex}@${trueHex}@${canAddSpecialRolesHex}@${trueHex}`;
      } else {
        payload = `registerMetaESDT@${nameHex}@${tickerHex}@${denominator}@${canFreezeHex}@${falseHex}@${canWipeHex}@${falseHex}@${canPauseHex}@${falseHex}@${canTransferNFTCreateRoleHex}@${trueHex}@${canChangeOwnerHex}@${falseHex}@${canUpgradeHex}@${trueHex}@${canAddSpecialRolesHex}@${trueHex}`;
      }
    } else {
      if (isDynamic) {
        payload = `registerDynamic@${nameHex}@${tickerHex}@${typeHex}@${canFreezeHex}@${falseHex}@${canWipeHex}@${falseHex}@${canPauseHex}@${falseHex}@${canTransferNFTCreateRoleHex}@${trueHex}@${canChangeOwnerHex}@${falseHex}@${canUpgradeHex}@${trueHex}@${canAddSpecialRolesHex}@${trueHex}`;
      } else {
        const fn = type === 'NFT' ? 'issueNonFungible' : 'issueSemiFungible';
        payload = `${fn}@${nameHex}@${tickerHex}@${canFreezeHex}@${falseHex}@${canWipeHex}@${falseHex}@${canPauseHex}@${falseHex}@${canTransferNFTCreateRoleHex}@${trueHex}@${canChangeOwnerHex}@${falseHex}@${canUpgradeHex}@${trueHex}@${canAddSpecialRolesHex}@${trueHex}`;
      }
    }

    const transaction = new Transaction({
      value: BigInt('50000000000000000'), // 0.05 EGLD
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
        processingMessage: 'Processing creation',
        errorMessage: 'An error occurred creation',
        successMessage: 'Creation successful'
      }
    });
  };

  return (
    <>
      {isLoggedIn ? (
        <button
          onClick={handleIssue}
          disabled={disabled || name.length < 3 || ticker.length < 3 || loading}
          className='dinoButton'
        >
          {t('collections:new_collection_button')} (0.05 EGLD)
        </button>
      ) : (
        <ConnectButton />
      )}
    </>
  );
};
