import type {
  ExtensionLoginButtonPropsType,
  WebWalletLoginButtonPropsType,
  OperaWalletLoginButtonPropsType,
  LedgerLoginButtonPropsType,
  WalletConnectLoginButtonPropsType
} from '@multiversx/sdk-dapp/UI';
import {
  ExtensionLoginButton,
  LedgerLoginButton,
  OperaWalletLoginButton,
  WalletConnectLoginButton,
  WebWalletLoginButton as WebWalletUrlLoginButton,
  CrossWindowLoginButton
} from 'components/sdkDappComponents';
import { nativeAuth } from 'config';
import { RouteNamesEnum } from 'localConstants';
import { useNavigate } from 'react-router-dom';
import { AuthRedirectWrapper } from 'wrappers';
import { WebWalletLoginWrapper, XaliasLoginWrapper } from './components';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';

type CommonPropsType =
  | OperaWalletLoginButtonPropsType
  | ExtensionLoginButtonPropsType
  | WebWalletLoginButtonPropsType
  | LedgerLoginButtonPropsType
  | WalletConnectLoginButtonPropsType;

// choose how you want to configure connecting to the web wallet
const USE_WEB_WALLET_CROSS_WINDOW = true;

const WebWalletLoginButton = USE_WEB_WALLET_CROSS_WINDOW
  ? CrossWindowLoginButton
  : WebWalletUrlLoginButton;

export const Unlock = () => {
  const loading = useLoadTranslations('global');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const previousPage =
    sessionStorage.getItem('redirectAfterLogin') || RouteNamesEnum.home;
  const commonProps: CommonPropsType = {
    callbackRoute: RouteNamesEnum.home,
    nativeAuth,
    onLoginRedirect: () => {
      navigate(previousPage);
    }
  };

  return (
    <AuthRedirectWrapper requireAuth={false}>
      <div className='flex justify-center items-center'>
        <div
          className='flex flex-col p-6 items-center justify-center gap-4 rounded-xl bg-[#f6f8fa]'
          data-testid='unlockPage'
        >
          <div className='flex flex-col items-center gap-1'>
            <h2 className='text-2xl'>{t('global:login')}</h2>

            <p className='text-center text-gray-400'>
              {t('global:login_method')}
            </p>
          </div>

          <div className='flex flex-col md:flex-row'>
            <WalletConnectLoginButton
              loginButtonText='xPortal App'
              {...commonProps}
            />
            <LedgerLoginButton loginButtonText='Ledger' {...commonProps} />
            <ExtensionLoginButton
              loginButtonText='DeFi Wallet'
              {...commonProps}
            />
            <OperaWalletLoginButton
              loginButtonText='Opera Crypto Wallet - Beta'
              {...commonProps}
            />
            {/* <XaliasCrossWindowLoginButton
              loginButtonText='xAlias'
              data-testid='xAliasLoginBtn'
              customWalletAddress='https://127.0.0.1:3000'
              {...commonProps}
            /> */}
            {/* <XaliasLoginWrapper {...commonProps} /> */}
            <WebWalletLoginWrapper {...commonProps} />
            {/* <MetamaskProxyButton
              loginButtonText='Metamask Proxy'
              {...commonProps}
            /> */}
          </div>
        </div>
      </div>
    </AuthRedirectWrapper>
  );
};
