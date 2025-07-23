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
import { useGetNetworkConfig } from 'hooks';
import abi_json from 'contracts/dinovault.abi.json';
import { useGetAccount } from '@multiversx/sdk-dapp/hooks';
import { useGetPendingTransactions } from 'hooks';
import { LockedNFT } from './../../../../../types/nft';

export const useGetUserLockedNft = () => {
  const [lockedNfts, setLockedNfts] = useState<LockedNFT[]>([]);
  const { network } = useGetNetworkConfig();
  const entrypoint = new DevnetEntrypoint(network.apiAddress);
  const contractAddress = Address.newFromBech32(vaultContractAddress);
  const abi = Abi.create(abi_json);
  const controller = entrypoint.createSmartContractController(abi);
  const { address } = useGetAccount();
  const { hasPendingTransactions } = useGetPendingTransactions();

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
          identifier: info.token_identifier.toString(),
          nonce: info.nonce.valueOf().toString(),
          amount: info.amount.valueOf().toString(),
          unlockTimestamp: info.unlock_timestamp.valueOf().toString() * 1000
        };
      });

      setLockedNfts(nfts);

      console.log('NFTs verrouillés récupérés avec succès :', nfts);
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
