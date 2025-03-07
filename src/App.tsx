import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LanguageSelector from './components/LanguageSelector';
import './routes/i18n';

import {
  AxiosInterceptorContext, // using this is optional
  DappProvider,
  Layout,
  TransactionsToastList,
  NotificationModal,
  SignTransactionsModals
  // uncomment this to use the custom transaction tracker
  // TransactionsTracker
} from 'components';

import {
  apiTimeout,
  walletConnectV2ProjectId,
  environment,
  sampleAuthenticatedDomains,
  metamaskSnapWalletAddress
} from 'config';
import { RouteNamesEnum } from 'localConstants';
import { PageNotFound, Unlock } from 'pages';
import { useRoutesWithTranslation } from 'routes';
import { BatchTransactionsContextProvider } from 'wrappers';

const AppContent = () => {
  return (
    <DappProvider
      environment={environment}
      customNetworkConfig={{
        name: 'customConfig',
        apiTimeout,
        walletConnectV2ProjectId,
        metamaskSnapWalletAddress
      }}
      dappConfig={{
        shouldUseWebViewProvider: true,
        logoutRoute: RouteNamesEnum.home
      }}
      customComponents={{
        transactionTracker: {
          // uncomment this to use the custom transaction tracker
          // component: TransactionsTracker,
          props: {
            onSuccess: (sessionId: string) => {
              console.log(`Session ${sessionId} successfully completed`);
            },
            onFail: (sessionId: string, errorMessage: string) => {
              console.log(`Session ${sessionId} failed. ${errorMessage ?? ''}`);
            }
          }
        }
      }}
    >
      <AxiosInterceptorContext.Listener>
        <Layout>
          <TransactionsToastList />
          <NotificationModal />
          <SignTransactionsModals />
          <Routes>
            <Route path={RouteNamesEnum.unlock} element={<Unlock />} />
            {useRoutesWithTranslation().map((route) => (
              <Route
                path={route.path}
                key={`route-key-'${route.path}`}
                element={<route.component />}
              />
            ))}
            <Route path='*' element={<PageNotFound />} />
          </Routes>
        </Layout>
      </AxiosInterceptorContext.Listener>
    </DappProvider>
  );
};

export const App = () => {
  return (
    <AxiosInterceptorContext.Provider>
      <LanguageSelector />
      <AxiosInterceptorContext.Interceptor
        authenticatedDomains={sampleAuthenticatedDomains}
      >
        <Router>
          <BatchTransactionsContextProvider>
            <AppContent />
          </BatchTransactionsContextProvider>
        </Router>
      </AxiosInterceptorContext.Interceptor>
    </AxiosInterceptorContext.Provider>
  );
};
