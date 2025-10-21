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
export const ActionBurnQuantity: React.FC<{
  collection: string;
  nonce: BigNumber;
  quantity: BigNumber;
}> = ({ collection, nonce, quantity }) => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();
  const handleSend = async () => {
    const payload = `ESDTNFTBurn@${Buffer.from(collection).toString(
      'hex'
    )}@${bigNumToHex(nonce)}@${bigNumToHex(quantity)}`;

    // 10M was to high
    // 50000 seems ok for burn
    const transaction = new Transaction({
      value: BigInt('0'),
      data: new TextEncoder().encode(payload),
      receiver: new Address(address),
      gasLimit: BigInt('1000000'),
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
          <button className='dinoButton' onClick={handleSend}>
            Burn quantity{' '}
          </button>
        </>
      )}
    </>
  );
};
