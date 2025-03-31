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
import { graou_identifier, internal_api } from 'config';
import { to } from 'react-spring';

const resultsParser = new ResultsParser();
export const useGetLotteriesDB = ({ page, limit }: any) => {
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getDbData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${internal_api}/dinovox/lotteries/?page=${page}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch lotteries list: ${response.statusText}`
        );
      }
      const data = await response.json();
      if (data?.lotteries) {
        setLotteries(data.lotteries);
      } else {
        console.error('No lotteries found in response:', data);
        setLotteries([]);
      }
    } catch (err) {
      console.error('Unable to call getMintable', err);
      setLotteries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getDbData();
  }, [page, limit]);

  return { lotteries, isLoading };
};

export const useGetLotteriesVM = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const [lotteries, setLotteries] = useState({
    running: <any>[],
    ended: <any>[],
    to_draw: <any>[],
    user_owned: <any>[],
    user_tickets: <any>[]
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
      // console.log('lotteries', lotteries);
      const {
        running_lotteries,
        ended_lotteries,
        to_draw_lotteries,
        user_lotteries,
        user_tickets
      } = lotteries;
      setLotteries({
        running: running_lotteries
          ? running_lotteries
              .map((id: string) => Number(id))
              .sort((a: any, b: any) => b - a)
          : [],
        ended: ended_lotteries
          ? ended_lotteries
              .map((id: string) => Number(id))
              .sort((a: any, b: any) => b - a)
          : [],
        to_draw: to_draw_lotteries
          ? to_draw_lotteries
              .map((id: string) => Number(id))
              .sort((a: any, b: any) => b - a)
          : [],
        user_owned: user_lotteries
          ? user_lotteries
              .map((id: string) => Number(id))
              .sort((a: any, b: any) => b - a)
          : [],
        user_tickets: user_tickets
          ? user_tickets
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
