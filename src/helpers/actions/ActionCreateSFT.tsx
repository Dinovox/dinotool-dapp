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
import { t } from 'i18next';
import { Collection } from 'helpers/api/accounts/getCollections';
export const ActionCreateSFT: React.FC<{
  collection: Collection;
  name: string;
  quantity: BigNumber;
  royalties: BigNumber;
  hash: string;
  attributes: string;
  uris: string[];
  disabled?: boolean;
}> = ({
  collection,
  name,
  quantity,
  royalties,
  hash,
  attributes,
  uris,
  disabled
}) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();

  const handleSend = async () => {
    const payload = `ESDTNFTCreate@${Buffer.from(
      collection.collection
    ).toString('hex')}@${bigNumToHex(quantity)}@${Buffer.from(name).toString(
      'hex'
    )}@${bigNumToHex(royalties)}@${Buffer.from(hash).toString(
      'hex'
    )}@${Buffer.from(attributes).toString('hex')}${uris
      .map((uri) => `@${Buffer.from(uri).toString('hex')}`)
      .join('')}`;
    const baseGas = 3000000;
    const gasPerByte = 1500;
    const dataSize = Buffer.from(payload).length;
    const estimatedGas = baseGas + dataSize * gasPerByte;

    const transaction = new Transaction({
      value: BigInt('0'),
      data: new TextEncoder().encode(payload),
      receiver: new Address(address),
      gasLimit: BigInt(estimatedGas),

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
    <>
      {collection && (
        <>
          {' '}
          {/* <div>Collection:{collection.collection}</div>
          <div>Name:{name}</div>
          <div>Quantity:{quantity.toFixed()}</div>
          <div>Royalties:{royalties.toFixed()}</div>
          <div>Attributes:{attributes}</div> */}
          {/* {uris && uris.map((uri, key) => <div key={key}>{`${uri}`}</div>)} */}
          <button
            className='dinoButton'
            onClick={handleSend}
            disabled={disabled || uris.length === 0 || !name}
          >
            {t('collections:create_type', {
              type:
                collection.type == 'MetaESDT'
                  ? 'MetaESDT'
                  : collection.type == 'NonFungibleESDT'
                  ? 'NFT'
                  : 'SFT'
            })}
          </button>
        </>
      )}
    </>
  );
};
