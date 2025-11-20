import { useEffect, useState } from 'react';

import { Abi, Address, DevnetEntrypoint, U64Value } from '@multiversx/sdk-core';
import { lotteryContractAddress } from 'config';
import abi_json from 'contracts/dinodraw.abi.json';

import { useGetNetworkConfig, useGetPendingTransactions } from 'lib';
import { BigNumber } from 'bignumber.js';
import { internal_api } from 'config';
import { useNavigate } from 'react-router-dom';

export const useGetLottery = (lottery_id: any) => {
  const navigate = useNavigate();

  const [mintable, setMintable] = useState<any>({
    id: 0,
    owner_id: 0,
    winner_id: 0,
    start_time: 0,
    end_time: 0,
    prize_identifier: '',
    prize_nonce: 0,
    prize_amount: new BigNumber(0),
    pricet_type: '',
    price_identifier: '',
    price_nonce: 0,
    price_amount: new BigNumber(0),
    max_tickets: new BigNumber(0),
    max_per_wallet: new BigNumber(0),
    tickets_sold: new BigNumber(0),
    fee_percentage: 0,
    vm_owner: '',
    vm_winner: '',
    auto_draw: false,
    description: '',
    drawn: false,
    cancelled: false,
    deleted: false,
    winner: {
      address: '',
      id: 0,
      herotag: ''
    },
    owner: {
      address: '',
      id: 0,
      herotag: ''
    },
    loading: true
  });
  const { network } = useGetNetworkConfig();
  const entrypoint = new DevnetEntrypoint({
    url: network.apiAddress
  });
  const contractAddress = Address.newFromBech32(lotteryContractAddress);
  const abi = Abi.create(abi_json);
  const controller = entrypoint.createSmartContractController(abi);

  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  const getMintableOffChain = async () => {
    // if (hasPendingTransactions) {
    //   return;
    // }
    if (!lottery_id || lottery_id === 0) {
      // setMintable({
      //   id: 0,
      //   owner_id: 0,
      //   winner_id: 0,
      //   start_time: 0,
      //   end_time: 0,
      //   prize_identifier: '',
      //   prize_nonce: 0,
      //   prize_amount: new BigNumber(0),
      //   price_identifier: '',
      //   price_nonce: 0,
      //   price_amount: new BigNumber(0),
      //   max_tickets: new BigNumber(0),
      //   max_per_wallet: new BigNumber(0),
      //   tickets_sold: new BigNumber(0),
      //   fee_percentage: 0,
      //   vm_owner: '',
      //   vm_winner: '',
      //   auto_draw: false,
      //   description: '',
      //   loading: false
      // });
      return;
    }

    /*off-chain datas*/
    /*using internal api & cache*/
    try {
      if (!mintable.loading) {
        return;
      }
      const response = await fetch(
        `${internal_api}/dinovox/lotteries/${lottery_id}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch lottery details: ${response.statusText}`
        );
      }
      const data = await response.json();
      if (data) {
        setMintable((prev: any) => ({
          ...prev,
          id: data.id,
          cancelled: data.cancelled,
          deleted: data.deleted,
          drawn: data.drawn,

          winner_id: data.winner_id,
          prize_identifier: data.prize_identifier,
          prize_nonce: data.prize_nonce,
          prize_amount: new BigNumber(data.prize_amount),
          price_identifier: data.price_identifier,
          price_nonce: data.price_nonce,
          price_amount: new BigNumber(data.price_amount),
          tickets_sold: new BigNumber(data.tickets_sold),
          max_tickets: new BigNumber(data.max_tickets),
          start_time: Number(data.start_time),
          end_time: Number(data.end_time),
          price_type: data.price_type,

          description: data.description,
          owner: data.owner,
          winner: data.winner,
          loading: false
        }));
      }
      // setMintable(data);
    } catch (err) {
      console.error('Unable to call getMintable', err);
    }
  };

  const getMintableOnChain = async () => {
    /*on-chain datas*/

    try {
      if (mintable.deleted) {
        // console.log('Lottery deleted ignore vm');
        return;
      }
      if (mintable.loading) {
        // console.log('Lottery loading ignore vm');
        return;
      }
      // console.log('Lottery not deleted get vm');

      const response = await controller.query({
        contract: contractAddress,
        function: 'getLotteryDetails',
        arguments: [new U64Value(lottery_id)]
      });

      if (!response || response.length === 0) {
        console.error('Lottery not found in SC: ' + lottery_id);

        // lottery not found in SC == probably deleted run the last action call
        try {
          const lastActionsResponse = await fetch(
            `${internal_api}/dinovox/lotteries/last-actions`
          );
          if (!lastActionsResponse.ok) {
            throw new Error(
              `Failed to fetch last actions: ${lastActionsResponse.statusText}`
            );
          }
          const lastActionsData = await lastActionsResponse.json();
        } catch (err) {
          console.error('Unable to fetch last actions', err);
        }

        navigate(`/lotteries/`, { replace: true });
        return;
      }
      const { field0, field1, field2 } = response[0];
      const vm_owner = field1?.toBech32?.() || '';
      const vm_winner = field2?.toBech32?.() || '';
      if (response && response.length > 0) {
        setMintable((prev: { description: any }) => ({
          ...prev,
          description: prev.description, // garde l'existante
          ...field0,
          price: new BigNumber(field0.price_amount),
          price_type: field0?.price_type?.name,
          vm_owner,
          vm_winner
        }));
      }
    } catch (err) {
      console.error('Unable to call getLotteryDetails', err);
    }
  };

  useEffect(() => {
    getMintableOnChain();
    getMintableOffChain();
  }, [hasPendingTransactions, lottery_id, mintable.loading]);

  return mintable;
};
