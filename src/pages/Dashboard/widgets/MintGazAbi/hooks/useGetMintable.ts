import { useEffect, useState } from 'react';
import { Abi, Address, DevnetEntrypoint } from '@multiversx/sdk-core';
import { mintcontractAddress } from 'config';
import { useGetNetworkConfig } from 'lib';
import mintgaz_json from 'contracts/mintgaz.abi.json';

import { BigNumber } from 'bignumber.js';

export const useGetMintable = () => {
  const [mintable, setMintable] = useState<any>({
    token_identifier: '',
    amount: new BigNumber(0),
    nonce: new BigNumber(0),
    payment_token: '',
    payment_price: new BigNumber(0),
    start_time: new Date(),
    end_time: new Date(),
    paused: false
  });

  const { network } = useGetNetworkConfig();
  const entrypoint = new DevnetEntrypoint({ url: network.apiAddress });
  const contractAddress = Address.newFromBech32(mintcontractAddress);
  const abi = Abi.create(mintgaz_json);
  const controller = entrypoint.createSmartContractController(abi);

  const getMintable = async () => {
    try {
      const response = await controller.query({
        contract: contractAddress,
        function: 'mintable',
        arguments: []
      });

      if (response && response.length > 0) {
        setMintable(response[0]);
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
