import { useEffect, useState } from 'react';
import {
  Address,
  AddressValue,
  ContractFunction,
  ResultsParser,
  TokenIdentifierValue,
  U64Value
} from '@multiversx/sdk-core/out';
import { useGetAccount } from '@multiversx/sdk-dapp/hooks';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import { BigNumber } from 'bignumber.js';
import { lotteryContract } from 'utils/smartContract';
import { useGetNetworkConfig, useGetPendingTransactions } from 'hooks';
import axios from 'axios';
import { graou_identifier } from 'config';

const resultsParser = new ResultsParser();

export const useGetLotteries = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const [lotteries, setLotteries] = useState({
    running: <any>[],
    endend: <any>[],
    user: <any>[]
  });

  const proxy = new ProxyNetworkProvider(network.apiAddress);

  const getScData = async () => {
    try {
      let sc_args: any = [];
      if (address) {
        sc_args = [new AddressValue(new Address(address))];
      }

      const query = lotteryContract.createQuery({
        func: new ContractFunction('getLotteries'),
        args: sc_args
      });
      //         args: [new U64Value(lottery_id), new AddressValue(new Address(address))]

      const queryResponse = await proxy.queryContract(query);
      const endpointDefinition = lotteryContract.getEndpoint('getLotteries');
      const { firstValue } = resultsParser.parseQueryResponse(
        queryResponse,
        endpointDefinition
      );
      const lotteries = firstValue?.valueOf();
      if (!lotteries) {
        console.error('No lotteries data found' + address);
        return;
      }
      const { running_lotteries, ended_lotteries, user_lotteries } = lotteries;
      setLotteries({
        running: running_lotteries
          ? running_lotteries
              .map((id: string) => Number(id))
              .sort((a: any, b: any) => b - a)
          : [],
        endend: ended_lotteries
          ? ended_lotteries
              .map((id: string) => Number(id))
              .sort((a: any, b: any) => b - a)
          : [],
        user: user_lotteries
          ? user_lotteries
              .map((id: string) => Number(id))
              .sort((a: any, b: any) => b - a)
          : []
      });
    } catch (err) {
      console.error('Unable to call getRunningLottery', err);
    }
  };

  useEffect(() => {
    getScData();
  }, []);

  return lotteries;
};
