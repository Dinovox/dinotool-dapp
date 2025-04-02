import React from 'react';
import { Button } from 'antd';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { Address } from '@multiversx/sdk-core/out';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import BigNumber from 'bignumber.js';
import { bigNumToHex } from '../../helpers/bigNumToHex';
export const ActionCreateSFT: React.FC<{
  collection: string;
  name: string;
  quantity: BigNumber;
  royalties: number;
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
      data: `ESDTNFTCreate@${Buffer.from(collection).toString(
        'hex'
      )}@${bigNumToHex(quantity)}@${Buffer.from(name).toString(
        'hex'
      )}@${bigNumToHex(new BigNumber(royalties))}@${Buffer.from(hash).toString(
        'hex'
      )}@${Buffer.from(attributes).toString('hex')}${uris
        .map((uri) => `@${Buffer.from(uri).toString('hex')}`)
        .join('')}`,
      receiver: new Address(address).bech32(),
      gasLimit: 60000000
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
      {[
        'erd10p0ke87tg4g2wnpah6ngmqmmlv604avfqwrlw7f3a7xpl8p3ugws7t3828',
        'erd1yfxtk0s7eu9eq8zzwsvgsnuq85xrj0yysjhsp28tc2ldrps25mwqztxgph'
      ].includes(address) && (
        <>
          {' '}
          <div>Collection:{collection}</div>
          <div>Name:{name}</div>
          <div>Quantity:{quantity.toFixed()}</div>
          <div>Royalties:{royalties}</div>
          <div>Attributes:{attributes}</div>
          {uris.map((uri) => (
            <div>{`${uri}`}</div>
          ))}
          <Button type='primary' onClick={handleSend} disabled={disabled}>
            Create SFT
          </Button>
        </>
      )}
    </>
  );
};
