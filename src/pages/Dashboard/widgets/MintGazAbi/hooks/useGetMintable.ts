import { useEffect, useState } from 'react';

import { useGetNetworkConfig } from 'hooks';
import { ContractFunction, ResultsParser, ProxyNetworkProvider } from 'utils';
import { mintContract } from 'utils/smartContract';
import { BigNumber } from 'bignumber.js';
import { graou_identifier } from 'config';
import { start } from 'repl';

const resultsParser = new ResultsParser();

export const useGetMintable = () => {
  const { network } = useGetNetworkConfig();
  const [mintable, setMintable] = useState<any>({
    token_identifier: '',
    amount: new BigNumber(0),
    nonce: new BigNumber(0),
    payment_token: graou_identifier,
    payment_price: new BigNumber(0),
    start_time: new Date(),
    end_time: new Date(),
    paused: false
  });

  const proxy = new ProxyNetworkProvider(network.apiAddress);

  const getMintable = async () => {
    try {
      const query = mintContract.createQuery({
        func: new ContractFunction('mintable')
      });
      const queryResponse = await proxy.queryContract(query);

      const endpointDefinition = mintContract.getEndpoint('mintable');

      const { firstValue: position } = resultsParser.parseQueryResponse(
        queryResponse,
        endpointDefinition
      );

      const tab = position?.valueOf();
      console.log('tab', tab);
      if (tab) {
        setMintable(tab);
      }
    } catch (err) {
      console.error('Unable to call getMintable', err);
    }
  };

  useEffect(() => {
    getMintable();
  }, []);

  return mintable;
};
