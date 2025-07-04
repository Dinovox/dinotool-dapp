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

// export const useGetUserParticipations = (filter: string) => {
//   const [buyed, setHasBuyed] = useState(<any>[]);
//   const { network } = useGetNetworkConfig();
//   const { address } = useGetAccount();
//   const { hasPendingTransactions } = useGetPendingTransactions();
//   const proxy = new ProxyNetworkProvider(network.apiAddress);

//   const getHasBuyed = async () => {
//     if (!address || hasPendingTransactions || filter !== 'user') {
//       return;
//     }

//     try {
//       const query = lotteryContract.createQuery({
//         func: new ContractFunction('getUserParticipation'),
//         args: [new AddressValue(new Address(address))]
//       });

//       const queryResponse = await proxy.queryContract(query);
//       const endpointDefinition = lotteryContract.getEndpoint(
//         'getUserParticipation'
//       );
//       const { firstValue: position } = resultsParser.parseQueryResponse(
//         queryResponse,
//         endpointDefinition
//       );
//       setHasBuyed(
//         position
//           ?.valueOf()
//           .toString(10)
//           .split(',')
//           .map((id: string) => Number(id))
//           .sort((a: any, b: any) => b - a)
//       );
//     } catch (err) {
//       console.error('Unable to call getAllUserRewards', err);
//     }
//   };

//   // const getEsdtAmount = async () => {
//   //   if (!address || hasPendingTransactions) {
//   //     return;
//   //   }
//   //   try {
//   //     const balance = await axios.get(
//   //       network.apiAddress +
//   //         '/accounts/' +
//   //         address +
//   //         '/tokens/' +
//   //         graou_identifier
//   //     );

//   //     if (balance?.data?.balance) {
//   //       setEsdtAmount(new BigNumber(balance?.data?.balance));
//   //     } else {
//   //       setEsdtAmount(new BigNumber(0));
//   //     }
//   //   } catch (err: any) {
//   //     //wallet with no esdt return a 404
//   //     // https://devnet-api.multiversx.com/accounts/erd1s2tstpvulqzhppydk876ydf6zce8svfznpe460plqnj0je5qx83qew5k2l/tokens/CACAT-672714
//   //     // {"statusCode":404,"message":"Token for given account not found"}
//   //     console.error('Unable to call usergraou', err);
//   //   }
//   // };
//   useEffect(() => {
//     getHasBuyed();
//   }, [filter, address, hasPendingTransactions]);

//   return buyed;
// };
