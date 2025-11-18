// If EnvironmentsEnum is defined elsewhere, import from the correct path, e.g.:
// Or define it locally if missing:
export enum EnvironmentsEnum {
  mainnet = 'mainnet',
  testnet = 'testnet',
  devnet = 'devnet'
}
export const environment: EnvironmentsEnum = EnvironmentsEnum.mainnet;
export const internal_api = 'https://internal.mvx.fr';
export const internal_api_v2 = 'https://api.dinovox.com';

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
export const vaultContractAddress =
  'erd1qqqqqqqqqqqqqpgqmfharjsrrng96rhdxt6jtyjf2klqgpmrch9s6w67j8';

export const marketplaceContractAddress =
  'erd1qqqqqqqqqqqqqpgqc5x7tu8a6s6qe23fjzpc47ya6a6pr2fmch9s3zqu48';

export const API_URL = 'https://api.multiversx.com';
export const sampleAuthenticatedDomains = [API_URL];
export const metamaskSnapWalletAddress = 'https://snap-wallet.multiversx.com';

//xGRAOU n'est pas transférable et doit être desactivé dans les formulaires
export const xgraou_identifier = 'XGRAOU-a7441a';
export const graou_identifier = xgraou_identifier;
export const lottery_cost = {
  graou: '100000000000000000000',
  egld: '100000000000000000'
};

// export const dinoclaim_api = 'http://localhost:3000';
export const dinoclaim_api = 'https://claim.dinovox.com';
export const pox_api = 'https://api.poxp.xyz';
export const dino_claim_url = 'https://app.dinovox.com/claim';
