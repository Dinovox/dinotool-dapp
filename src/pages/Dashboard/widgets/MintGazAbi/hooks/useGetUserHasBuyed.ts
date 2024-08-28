import { useEffect, useState } from 'react';
import {
  Address,
  AddressValue,
  ContractFunction,
  ResultsParser,
  TokenIdentifierValue
} from '@multiversx/sdk-core/out';
import { useGetAccount } from '@multiversx/sdk-dapp/hooks';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import { BigNumber } from 'bignumber.js';
import { mintContract } from 'utils/smartContract';
import { useGetNetworkConfig, useGetPendingTransactions } from 'hooks';
import axios from 'axios';
import { graou_identifier } from 'config';

const resultsParser = new ResultsParser();

export const useGetUserHasBuyed = () => {
  const [hasBuyed, setHasBuyed] = useState(false);
  const [esdtAmount, setEsdtAmount] = useState(new BigNumber(0));
  const { network } = useGetNetworkConfig();

  const { address } = useGetAccount();

  const { hasPendingTransactions } = useGetPendingTransactions();
  const proxy = new ProxyNetworkProvider(network.apiAddress);

  const getHasBuyed = async () => {
    if (!address || hasPendingTransactions) {
      return;
    }

    try {
      const query = mintContract.createQuery({
        func: new ContractFunction('hasBuyed'),
        args: [new AddressValue(new Address(address))]
      });

      const queryResponse = await proxy.queryContract(query);
      const endpointDefinition = mintContract.getEndpoint('hasBuyed');
      const { firstValue: position } = resultsParser.parseQueryResponse(
        queryResponse,
        endpointDefinition
      );
      setHasBuyed(position?.valueOf());
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
      console.error('Unable to call usercacat', err);
    }
  };
  useEffect(() => {
    getHasBuyed();
    getEsdtAmount();
  }, [address, hasPendingTransactions]);

  return { hasBuyed, esdtAmount };
};
