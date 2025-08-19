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

interface ActionUnsetSpecialRoleProps {
  tokenIdentifier: string;
  addressToAssign: string;
  roles: string[];
  disabled?: boolean;
}

export const ActionUnsetSpecialRole: React.FC<ActionUnsetSpecialRoleProps> = ({
  tokenIdentifier,
  addressToAssign,
  roles,
  disabled = false
}) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();
  const { t } = useTranslation();

  const handleSend = async () => {
    if (!address) return;

    // Convert token identifier and address to hex
    const tokenIdentifierHex = Buffer.from(tokenIdentifier).toString('hex');
    const addressHex = new Address(addressToAssign).toHex();
    // Convert all roles to hex and join with @
    const rolesHex = roles
      .map((role) => Buffer.from(role).toString('hex'))
      .join('@');

    // Construct the data field
    const payload = `unSetSpecialRole@${tokenIdentifierHex}@${addressHex}@${rolesHex}`;

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
        processingMessage: 'Processing unset role transaction',
        errorMessage: 'An error occurred during unset role',
        successMessage: 'Unset role transaction successful'
      }
    });
  };

  return (
    <button
      onClick={handleSend}
      disabled={disabled || !address}
      className='dinoButton'
    >
      {t('collections:assign_roles')}
    </button>
  );
};

// For NFT:

// ESDTRoleNFTCreate : this role allows one to create a new NFT
// ESDTRoleNFTBurn : this role allows one to burn a specific NFT
// ESDTRoleNFTUpdateAttributes : this role allows one to change the attributes of a specific NFT
// ESDTRoleNFTAddURI : this role allows one add URIs for a specific NFT
// ESDTTransferRole : this role enables transfer only to specified addresses. The addresses with the transfer role can transfer anywhere.
// ESDTRoleNFTUpdate : this role allows one to update meta data attributes of a specific NFT
// ESDTRoleModifyRoyalties : this role allows one to modify royalities of a specific NFT
// ESDTRoleSetNewURI : this role allows one to set new uris of a specific NFT
// ESDTRoleModifyCreator : this role allows one to rewrite the creator of a specific token
// ESDTRoleNFTRecreate : this role allows one to recreate the whole NFT with new attributes

// For SFT:

// ESDTRoleNFTCreate : this role allows one to create a new SFT
// ESDTRoleNFTBurn : this role allows one to burn quantity of a specific SFT
// ESDTRoleNFTAddQuantity : this role allows one to add quantity of a specific SFT
// ESDTTransferRole : this role enables transfer only to specified addresses. The addresses with the transfer role can transfer anywhere.
// ESDTRoleNFTUpdate : this role allows one to update meta data attributes of a specific SFT
// ESDTRoleModifyRoyalties : this role allows one to modify royalities of a specific SFT
// ESDTRoleSetNewURI : this role allows one to set new uris of a specific SFT
// ESDTRoleModifyCreator : this role allows one to rewrite the creator of a specific token
// ESDTRoleNFTRecreate : this role allows one to recreate the whole NFT with new attributes
