import {
  contractAddress,
  mintcontractAddress,
  lotteryContractAddress
} from 'config';
import json from 'contracts/ping-pong.abi.json';
import mint_json from 'contracts/mintgaz.abi.json';
import lottery_json from 'contracts/dinodraw.abi.json';
import { AbiRegistry, Address, SmartContract } from './sdkDappCore';

const abi = AbiRegistry.create(json);
const mint_abi = AbiRegistry.create(mint_json);
const lottery_abi = AbiRegistry.create(lottery_json);

export const smartContract = new SmartContract({
  address: new Address(contractAddress),
  abi
});

export const mintContract = new SmartContract({
  address: new Address(mintcontractAddress),
  abi: mint_abi
});

export const lotteryContract = new SmartContract({
  address: new Address(lotteryContractAddress),
  abi: lottery_abi
});
