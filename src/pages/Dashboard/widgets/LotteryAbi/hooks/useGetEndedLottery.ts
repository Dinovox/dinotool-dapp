import { useEffect, useState } from 'react';
import { Abi, Address, DevnetEntrypoint } from '@multiversx/sdk-core';
import { lotteryContractAddress } from 'config';
import { useGetNetworkConfig } from 'lib';
import lottery_json from 'contracts/dinodraw.abi.json';

export const useGetEndedLottery = () => {
  const [scData, setScData] = useState<any[]>([]);

  const { network } = useGetNetworkConfig();
  const entrypoint = new DevnetEntrypoint({ url: network.apiAddress });
  const contractAddress = Address.newFromBech32(lotteryContractAddress);
  const abi = Abi.create(lottery_json);
  const controller = entrypoint.createSmartContractController(abi);

  // const api = entrypoint.createNetworkProvider();

  // const proxy = new ProxyNetworkProvider(network.apiAddress);

  const getScData = async () => {
    try {
      const response = await controller.query({
        contract: contractAddress,
        function: 'getEndedLottery',
        arguments: []
      });

      // const queryResponse = await proxy.queryContract(query);
      // const endpointDefinition = lotteryContract.getEndpoint('getEndedLottery');
      // const { firstValue: position } = resultsParser.parseDeploy(
      //   queryResponse,
      //   endpointDefinition
      // );
      // setScData(position?.valueOf().toString(10).split(','));
      setScData(response);
    } catch (err) {
      console.error('Unable to call getEndedLottery', err);
    }
  };

  useEffect(() => {
    getScData();
  }, []);

  return scData;
};
