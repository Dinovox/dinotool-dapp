import { useEffect, useState } from 'react';
import {
  Abi,
  Address,
  AddressValue,
  DevnetEntrypoint
} from '@multiversx/sdk-core';
import { mintcontractAddress } from 'config';
import { useGetNetworkConfig } from 'hooks';
import abi_json from 'contracts/mintgaz.abi.json';

import { useGetAccount } from '@multiversx/sdk-dapp/hooks';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import { BigNumber } from 'bignumber.js';
import { useGetPendingTransactions } from 'hooks';
import axios from 'axios';
import { graou_identifier } from 'config';

export const useGetUserHasBuyed = () => {
  const [hasBuyed, setHasBuyed] = useState(false);
  const [esdtAmount, setEsdtAmount] = useState(new BigNumber(0));

  const { network } = useGetNetworkConfig();
  const entrypoint = new DevnetEntrypoint(network.apiAddress);
  const contractAddress = Address.newFromBech32(mintcontractAddress);
  const abi = Abi.create(abi_json);
  const controller = entrypoint.createSmartContractController(abi);

  const { address } = useGetAccount();

  const { hasPendingTransactions } = useGetPendingTransactions();
  const proxy = new ProxyNetworkProvider(network.apiAddress);

  const getHasBuyed = async () => {
    if (!address || hasPendingTransactions) {
      return;
    }

    try {
      const response = await controller.query({
        contract: contractAddress,
        function: 'hasBuyed',
        arguments: [new AddressValue(new Address(address))]
      });

      setHasBuyed(Array.isArray(response) && response.length > 0);
    } catch (err) {
      console.error('Unable to call getAllUserRewards', err);
    }
  };

  const getEsdtAmount = async () => {
    if (!address || hasPendingTransactions) {
      return;
    }
    try {
      const balance = await axios.get(
        network.apiAddress +
          '/accounts/' +
          address +
          '/tokens/' +
          graou_identifier
      );

      if (balance?.data?.balance) {
        setEsdtAmount(new BigNumber(balance?.data?.balance));
      } else {
        setEsdtAmount(new BigNumber(0));
      }
    } catch (err: any) {
      //wallet with no esdt return a 404
      // https://devnet-api.multiversx.com/accounts/erd1s2tstpvulqzhppydk876ydf6zce8svfznpe460plqnj0je5qx83qew5k2l/tokens/CACAT-672714
      // {"statusCode":404,"message":"Token for given account not found"}
      console.error('Unable to call usergraou', err);
    }
  };
  useEffect(() => {
    getHasBuyed();
    getEsdtAmount();
  }, [address, hasPendingTransactions]);

  return { hasBuyed, esdtAmount };
};
