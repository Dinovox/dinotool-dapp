import { useEffect, useState } from 'react';
import {
  Abi,
  Address,
  AddressValue,
  DevnetEntrypoint
} from '@multiversx/sdk-core';
import { lotteryContractAddress } from 'config';
import { useGetNetworkConfig, useGetAccount } from 'lib';
import abi_json from 'contracts/dinodraw.abi.json';
import { internal_api } from 'config';

export const useGetLotteriesDB = ({ page, limit, status, ids, price }: any) => {
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total_count, setTotalCount] = useState<number>(0);
  const getDbData = async () => {
    try {
      // console.log('ids', ids);
      setIsLoading(true);
      const response = await fetch(
        `${internal_api}/dinovox/lotteries/?page=${page}&limit=${limit}&status=${status}` +
          (ids.length > 0 ? `&ids=${ids}` : '') +
          (price ? `&price=${price}` : '')
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch lotteries list: ${response.statusText}`
        );
      }
      const data = await response.json();
      if (data?.lotteries) {
        setLotteries(data.lotteries);
        setTotalCount(data.total_count);
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
  }, [page, limit, status, price]);

  return { lotteries, total_count, isLoading };
};

export const useGetLotteriesVM = () => {
  const [lotteries, setLotteries] = useState({
    running: <any>[],
    ended: <any>[],
    to_draw: <any>[],
    user_owned: <any>[],
    user_tickets: <any>[]
  });

  const { network } = useGetNetworkConfig();
  const entrypoint = new DevnetEntrypoint({ url: network.apiAddress });
  const contractAddress = Address.newFromBech32(lotteryContractAddress);
  const abi = Abi.create(abi_json);
  const controller = entrypoint.createSmartContractController(abi);

  const { address } = useGetAccount();

  const getScData = async () => {
    try {
      let sc_args: any = [];
      if (address) {
        sc_args = [new AddressValue(new Address(address))];
      }

      const response = await controller.query({
        contract: contractAddress,
        function: 'getLotteries',
        arguments: sc_args
      });

      if (!response || response.length === 0) {
        console.error('No lotteries data found' + address);
        return;
      }
      const {
        running_lotteries,
        ended_lotteries,
        to_draw_lotteries,
        user_lotteries,
        user_tickets
      } = response[0];
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
      console.error('Unable to call getLotteriesVMlist', err);
    }
  };

  useEffect(() => {
    getScData();
  }, []);

  return lotteries;
};
