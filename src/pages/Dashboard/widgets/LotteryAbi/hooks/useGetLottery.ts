import { useEffect, useState } from 'react';

import { useGetNetworkConfig, useGetPendingTransactions } from 'hooks';
import { ContractFunction, ResultsParser, ProxyNetworkProvider } from 'utils';
import { lotteryContract } from 'utils/smartContract';
import { BigNumber } from 'bignumber.js';
import { graou_identifier } from 'config';
import { start } from 'repl';
import { Address, U64Value } from '@multiversx/sdk-core/out';

const resultsParser = new ResultsParser();

export const useGetLottery = (lottery_id: any) => {
  const { network } = useGetNetworkConfig();
  const [mintable, setMintable] = useState<any>({
    id: 0,
    owner_id: 0,
    winner_id: 0,
    start: 0,
    end: 0,
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
    owner: '',
    winner: '',
    auto_draw: false
  });

  const { hasPendingTransactions } = useGetPendingTransactions();

  const proxy = new ProxyNetworkProvider(network.apiAddress);

  const getMintable = async () => {
    if (hasPendingTransactions) {
      return;
    }
    if (!lottery_id || lottery_id === 0) {
      setMintable({
        id: 0,
        owner_id: 0,
        winner_id: 0,
        start: 0,
        end: 0,
        prize_identifier: '',
        prize_nonce: 0,
        prize_amount: new BigNumber(0),
        price_identifier: '',
        price_nonce: 0,
        price_amount: new BigNumber(0),
        max_tickets: new BigNumber(0),
        max_per_wallet: new BigNumber(0),
        tickets_sold: new BigNumber(0),
        fee_percentage: 0,
        owner: '',
        winner: '',
        auto_draw: false
      });
      return;
    }
    try {
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
        console.error('No lottery data found' + lottery_id);
        return;
      }
      const { field0, field1, field2 } = lotteryData;
      const owner = field1?.bech32?.() || '';
      const winner = field2?.bech32?.() || '';
      if (lotteryData) {
        setMintable({
          ...field0,
          owner,
          winner
        });
      }
    } catch (err) {
      console.error('Unable to call getMintable', err);
    }
  };

  useEffect(() => {
    getMintable();
  }, [hasPendingTransactions, lottery_id]);

  return mintable;
};
