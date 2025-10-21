import { useEffect, useState } from 'react';
import {
  Abi,
  Address,
  AddressValue,
  DevnetEntrypoint,
  U64Value,
  U64Type,
  TokenIdentifierType,
  BigUIntType
} from '@multiversx/sdk-core';
import { vaultContractAddress } from 'config';
import { useGetNetworkConfig, useGetPendingTransactions } from 'lib';
import abi_json from 'contracts/dinovault.abi.json';
import { useGetAccount } from 'lib';

import { LockedNFT } from './../../../../../types/nft';

export const useGetUserLockedNft = () => {
  const [lockedNfts, setLockedNfts] = useState<LockedNFT[]>([]);
  const { network } = useGetNetworkConfig();
  const entrypoint = new DevnetEntrypoint({ url: network.apiAddress });
  const contractAddress = Address.newFromBech32(vaultContractAddress);
  const abi = Abi.create(abi_json);
  const controller = entrypoint.createSmartContractController(abi);
  const { address } = useGetAccount();
  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  const fetchLockedNfts = async () => {
    if (!address || hasPendingTransactions) return;

    try {
      const response = await controller.query({
        contract: contractAddress,
        function: 'getUserLockedNfts',
        arguments: [new AddressValue(new Address(address))]
      });

      const multiValue = response[0].valueOf(); // <- tableau de LockedNftWithId
      const nfts: LockedNFT[] = multiValue.map((item: any) => {
        const lockId = item.lock_id.valueOf().toString();
        const info = item.info;

        return {
          lockId,
          creator: info.creator.toString(),
          owner: info.owner.toString(),
          identifier: info.token_identifier.toString(),
          nonce: info.nonce.valueOf().toString(),
          amount: info.amount.valueOf().toString(),
          unlockTimestamp: info.unlock_timestamp.valueOf().toString() * 1000
        };
      });

      setLockedNfts(nfts);
    } catch (err) {
      console.error(
        'Erreur lors de la récupération des NFTs verrouillés :',
        err
      );
    }
  };

  useEffect(() => {
    fetchLockedNfts();
  }, [address, hasPendingTransactions]);

  return { lockedNfts };
};
