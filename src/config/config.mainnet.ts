import { EnvironmentsEnum } from 'types';
export const environment: EnvironmentsEnum = EnvironmentsEnum.mainnet;
export const internal_api = 'https://internal.mvx.fr';
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

export const lotteryContractAddress =
  'erd1qqqqqqqqqqqqqpgqzkjlnqccnqqyhlhthmxhv6klhx4r0vy4ytsqqqrlxw';

export const API_URL = 'https://api.multiversx.com';
export const sampleAuthenticatedDomains = [API_URL];
export const metamaskSnapWalletAddress = 'https://snap-wallet.multiversx.com';

//xGRAOU n'est pas transférable et doit être desactivé dans les formulaires
export const xgraou_identifier = 'XGRAOU-a7441a';
export const graou_identifier = xgraou_identifier;
export const lottery_cost = {
  graou: '500000000000000000000',
  egld: '250000000000000000'
};
