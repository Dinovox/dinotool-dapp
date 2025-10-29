import { CrossWindowProviderStrategy } from '@multiversx/sdk-dapp/out/providers/strategies/CrossWindowProviderStrategy/CrossWindowProviderStrategy';
import { environment } from 'config';
import { EnvironmentsEnum } from 'lib';

const baseUrlByEnv: Record<string, string> = {
  [EnvironmentsEnum.mainnet]: 'https://login.gaupa.xyz/connect',
  [EnvironmentsEnum.testnet]: 'https://testnet-login.gaupa.xyz/connect',
  [EnvironmentsEnum.devnet]: 'https://devnet-login.gaupa.xyz/connect'
};

const iconUrlByEnv: Record<string, string> = {
  [EnvironmentsEnum.mainnet]: 'https://login.gaupa.xyz/static/favicon.svg',
  [EnvironmentsEnum.testnet]:
    'https://testnet-login.gaupa.xyz/static/favicon.svg',
  [EnvironmentsEnum.devnet]: 'https://devnet-login.gaupa.xyz/static/favicon.svg'
};

const gaupaURL =
  baseUrlByEnv[environment as unknown as string] ??
  baseUrlByEnv[EnvironmentsEnum.devnet];
const gaupaPublicKey = 'GAWR6dYyKTn25EGv1qV4SPCvUJdL5CRcymfrSkef'; // TODO: Replace with your public key

type GaupaProviderConfig = {
  address?: string;
  walletAddress?: string;
};

export class GaupaProvider extends CrossWindowProviderStrategy {
  static iconUrl =
    iconUrlByEnv[environment as unknown as string] ??
    iconUrlByEnv[EnvironmentsEnum.devnet];
  constructor(config?: GaupaProviderConfig) {
    const walletAddress =
      config?.walletAddress ?? `${gaupaURL}?public=${gaupaPublicKey}`;
    super({ ...config, walletAddress });
  }

  async init() {
    return super.init();
  }

  async login(options?: any) {
    if (!this.isInitialized()) {
      await this.init();
    }
    return super.login(options);
  }

  getType() {
    return 'gaupaProvider';
  }
}
