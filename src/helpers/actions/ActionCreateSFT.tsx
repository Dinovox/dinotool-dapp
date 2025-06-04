import React from 'react';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { Address } from '@multiversx/sdk-core/out';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
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
  const { address } = useGetAccountInfo();
  const handleSend = async () => {
    const createTransaction = {
      value: '0',
      data: `ESDTNFTCreate@${Buffer.from(collection.collection).toString(
        'hex'
      )}@${bigNumToHex(quantity)}@${Buffer.from(name).toString(
        'hex'
      )}@${bigNumToHex(royalties)}@${Buffer.from(hash).toString(
        'hex'
      )}@${Buffer.from(attributes).toString('hex')}${uris
        .map((uri) => `@${Buffer.from(uri).toString('hex')}`)
        .join('')}`,
      receiver: new Address(address).toBech32(),
      gasLimit: 10000000
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
