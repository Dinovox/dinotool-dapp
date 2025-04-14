// import { useEffect, useState } from 'react';
// import {
//   Address,
//   AddressValue,
//   ContractFunction,
//   ResultsParser,
//   TokenIdentifierValue,
//   U64Value
// } from '@multiversx/sdk-core/out';
// import { useGetAccount } from '@multiversx/sdk-dapp/hooks';
// import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
// import { BigNumber } from 'bignumber.js';
// import { lotteryContract } from 'utils/smartContract';
// import { useGetNetworkConfig, useGetPendingTransactions } from 'hooks';
// import axios from 'axios';
// import { graou_identifier } from 'config';

// const resultsParser = new ResultsParser();

// export const useGetRunningLottery = () => {
//   const [scData, setScData] = useState([]);
//   const { network } = useGetNetworkConfig();

//   const { address } = useGetAccount();

//   const proxy = new ProxyNetworkProvider(network.apiAddress);

//   const getScData = async () => {
//     try {
//       const query = lotteryContract.createQuery({
//         func: new ContractFunction('getRunningLottery')
//       });
//       //         args: [new U64Value(lottery_id), new AddressValue(new Address(address))]

//       const queryResponse = await proxy.queryContract(query);
//       const endpointDefinition =
//         lotteryContract.getEndpoint('getRunningLottery');
//       const { firstValue: position } = resultsParser.parseQueryResponse(
//         queryResponse,
//         endpointDefinition
//       );
//       setScData(position?.valueOf().toString(10).split(','));
//     } catch (err) {
//       console.error('Unable to call getRunningLottery', err);
//     }
//   };

//   useEffect(() => {
//     getScData();
//   }, []);

//   return scData;
// };
