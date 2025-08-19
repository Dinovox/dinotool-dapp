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
import BigNumber from 'bignumber.js';
import { bigNumToHex } from '../bigNumToHex';
import { useTranslation } from 'react-i18next';

interface ActionChangeToDynamic {
  tokenIdentifier: string;
}

export const ActionChangeToDynamic: React.FC<ActionChangeToDynamic> = ({
  tokenIdentifier
}) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();
  const { t } = useTranslation();

  const handleSend = async () => {
    if (!address) return;

    // Convert token identifier and address to hex
    const tokenIdentifierHex = Buffer.from(tokenIdentifier).toString('hex');

    // Construct the data field
    const payload = `changeToDynamic@${tokenIdentifierHex}`;

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
        processingMessage: 'Processing set roles transaction',
        errorMessage: 'An error occurred during set roles',
        successMessage: 'SFT set roles successful'
      }
    });
  };

  return (
    <button onClick={handleSend} className='dinoButton'>
      {t('collections:proceed_with_conversion')}
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
