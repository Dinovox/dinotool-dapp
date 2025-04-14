import { useEffect, useState } from 'react';

import { useGetNetworkConfig, useGetPendingTransactions } from 'hooks';
import { ContractFunction, ResultsParser, ProxyNetworkProvider } from 'utils';
import { lotteryContract } from 'utils/smartContract';
import { BigNumber } from 'bignumber.js';
import { graou_identifier, internal_api } from 'config';
import { start } from 'repl';
import { Address, U64Value } from '@multiversx/sdk-core/out';
import { useNavigate } from 'react-router-dom';

const resultsParser = new ResultsParser();

export const useGetLottery = (lottery_id: any) => {
  const navigate = useNavigate();

  const { network } = useGetNetworkConfig();
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

  const { hasPendingTransactions } = useGetPendingTransactions();

  const proxy = new ProxyNetworkProvider(network.apiAddress);

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
        console.log('Lottery loaded');
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
      const query = lotteryContract.createQuery({
        func: new ContractFunction('getLotteryDetails'),
        args: [new U64Value(lottery_id)]
      });
      const queryResponse = await proxy.queryContract(query);

      const endpointDefinition =
        lotteryContract.getEndpoint('getLotteryDetails');

      const { firstValue } = resultsParser.parseQueryResponse(
        queryResponse,
        endpointDefinition
      );
      const lotteryData = firstValue?.valueOf();

      if (!lotteryData) {
        console.error('Lottery not found in SC: ' + lottery_id);
        navigate(`/lotteries/`, { replace: true });
        return;
      }
      const { field0, field1, field2 } = lotteryData;
      const vm_owner = field1?.bech32?.() || '';
      const vm_winner = field2?.bech32?.() || '';
      if (lotteryData) {
        setMintable((prev: { description: any }) => ({
          ...prev,
          description: prev.description, // garde l'existante
          ...field0,
          price: new BigNumber(field0.price_amount),
          vm_owner,
          vm_winner
        }));
      }
    } catch (err) {
      console.error('Unable to call getMintable', err);
    }
  };

  useEffect(() => {
    getMintableOnChain();
    getMintableOffChain();
  }, [hasPendingTransactions, lottery_id, mintable.loading]);

  return mintable;
};
