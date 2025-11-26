import { useEffect, useState } from 'react';
import {
  Abi,
  Address,
  AddressValue,
  DevnetEntrypoint
} from '@multiversx/sdk-core';
import { mintcontractAddress } from 'config';
import abi_json from 'contracts/mintgaz.abi.json';

import {
  useGetNetworkConfig,
  useGetAccount,
  useGetPendingTransactions
} from 'lib';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import { BigNumber } from 'bignumber.js';
import axios from 'axios';
import { graou_identifier } from 'config';

export const useGetUserHasBuyed = (tokenIdentifier: string) => {
  const [hasBuyed, setHasBuyed] = useState(false);
  const [esdtAmount, setEsdtAmount] = useState(new BigNumber(0));

  const { network } = useGetNetworkConfig();
  const entrypoint = new DevnetEntrypoint({ url: network.apiAddress });
  const contractAddress = Address.newFromBech32(mintcontractAddress);
  const abi = Abi.create(abi_json);
  const controller = entrypoint.createSmartContractController(abi);

  const { address } = useGetAccount();

  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;
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
      setHasBuyed(response[0] ? response[0] : false);
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
          tokenIdentifier
      );

      console.log(balance);
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
