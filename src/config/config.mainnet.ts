import { EnvironmentsEnum } from 'types';
export const environment: EnvironmentsEnum = EnvironmentsEnum.mainnet;

export * from './sharedConfig';

//WHY?
export const contractAddress =
  'erd1qqqqqqqqqqqqqpgqtmcuh307t6kky677ernjj9ulk64zq74w9l5qxyhdn7';
//NOT READY
export const mintcontractAddress =
  'erd1qqqqqqqqqqqqqpgqt434nktxkn8grnvfr9rjx0743sdv05maytsq92c48x';
//DROP CONTRACT MAINNET OK
export const dropContract =
  'erd1qqqqqqqqqqqqqpgqtmj6zwec4llv8m9fnvyjytcy9gmht78l5gcsev3xm2';

export const lotteryContract = 'erd1qqqqqqqqqqqqqpgq';

export const API_URL = 'https://api.multiversx.com';
export const sampleAuthenticatedDomains = [API_URL];
export const metamaskSnapWalletAddress = 'https://snap-wallet.multiversx.com';
//PAS MAINNET
export const graou_identifier = 'GRAOU-c9dd53';
