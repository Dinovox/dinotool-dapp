import { EnvironmentsEnum } from 'types';

export * from './sharedConfig';

export const contractAddress =
  'erd1qqqqqqqqqqqqqpgqm6ad6xrsjvxlcdcffqe8w58trpec09ug9l5qde96pq';
export const mintcontractAddress =
  'erd1qqqqqqqqqqqqqpgqe40zc2wv37s48ts04wgsld3p0svfxfsech9sufy67x';
export const dropContract =
  'erd1qqqqqqqqqqqqqpgqhc8uwawel9treyrc2ltp3r7qqj3520j0ch9sqswc2v';

export const lotteryContractAddress =
  'erd1qqqqqqqqqqqqqpgq6y2t8z7u7rlnkn5qt8fm7vfkjg92v3wuch9slg8ang';

export const API_URL = 'https://devnet-api.multiversx.com';
export const sampleAuthenticatedDomains = [API_URL];
export const environment: EnvironmentsEnum = EnvironmentsEnum.devnet;
export const metamaskSnapWalletAddress =
  'https://devnet-snap-wallet.multiversx.com';
//Tout le monde peut trnasferer des tokens
export const graou_identifier = 'GRAOU-c9dd53';
//Seul le contract peut transferer des tokens
export const xgraou_identifier = 'GRAOU-96c360';

export const lottery_cost = '10000000000000000000';
