export enum EnvironmentsEnum {
  mainnet = 'mainnet',
  testnet = 'testnet',
  devnet = 'devnet'
}
export const internal_api = 'https://devnet-internal.mvx.fr';

export * from './sharedConfig';

export const contractAddress =
  'erd1qqqqqqqqqqqqqpgqm6ad6xrsjvxlcdcffqe8w58trpec09ug9l5qde96pq';
export const mintcontractAddress =
  'erd1qqqqqqqqqqqqqpgqe40zc2wv37s48ts04wgsld3p0svfxfsech9sufy67x';
export const dropContract =
  'erd1qqqqqqqqqqqqqpgqhc8uwawel9treyrc2ltp3r7qqj3520j0ch9sqswc2v';
export const lotteryContractAddress =
  'erd1qqqqqqqqqqqqqpgqpf4zy76u8nhdlvsa0eq0mfsd53qprm46ch9ssyyqm6';
export const vaultContractAddress =
  'erd1qqqqqqqqqqqqqpgq8uctjpczcsv49xr0clc3wfn98r5e48hcch9s2l2j55';
export const marketplaceContractAddress =
  'erd1qqqqqqqqqqqqqpgqgt7l8mmynwtyfw9y34en8u75vcdq8mpxch9stzzjcq';

export const API_URL = 'https://devnet-api.multiversx.com';
export const sampleAuthenticatedDomains = [API_URL];
export const environment: EnvironmentsEnum = EnvironmentsEnum.devnet;
export const metamaskSnapWalletAddress =
  'https://devnet-snap-wallet.multiversx.com';
//Tout le monde peut trnasferer des tokens
export const graou_identifier = 'GRAOU-c9dd53';
//Seul le contract peut transferer des tokens
export const xgraou_identifier = 'GRAOU-96c360';

export const lottery_cost = {
  graou: '100000000000000000000',
  egld: '100000000000000000'
};

//export const dinoclaim_api = 'http://localhost:3000';
export const dinoclaim_api = 'https://devnet-claim.dinovox.com';
export const dino_claim_url = 'https://devnet-app.dinovox.com/claim';
export const dinovox_collections = ['FAAPU-28e0bc', 'DINOCARDS-ddaf7a'];
export const friends_collections = ['DINOBOOST-9f6811'];

export const auction_tokens = [
  { token: 'EGLD', identifier: 'EGLD', decimals: 18 },
  { token: 'USDC', identifier: 'USDC-350c4e', decimals: 6 }
];
