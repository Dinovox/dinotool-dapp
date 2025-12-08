import './styles/globals.css';

import { environment, walletConnectV2ProjectId } from 'config';
import { EnvironmentsEnum, ICustomProvider, InitAppType } from './lib';
import { InMemoryProvider } from './provider/inMemoryProvider';
import { GaupaProvider } from './provider/gaupaProvider';

const providers: ICustomProvider[] = [];

if (environment == 'devnet') {
  providers.push({
    name: 'Gaupa Login',
    type: 'gaupaProvider',
    iconUrl: GaupaProvider.iconUrl,
    constructor: async (options) => new GaupaProvider(options)
  });
}

(window as any).multiversx = {};
// Option 1: Add providers using the `window.providers` array
if (providers.length > 0) {
  (window as any).multiversx.providers = providers;
}

export const config: InitAppType = {
  storage: { getStorageCallback: () => sessionStorage },
  dAppConfig: {
    nativeAuth: true,
    environment: environment,
    theme: 'mvx:dark-theme',
    providers: {
      walletConnect: {
        walletConnectV2ProjectId
      }
    }
  }

  // Option 2: Add providers using the config `customProviders` array
  // customProviders: [providers]
};
