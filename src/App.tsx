import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LanguageSelector from './components/LanguageSelector';
import './routes/i18n';
import { AxiosInterceptors, BatchTransactionsContextProvider } from 'wrappers';
import { Layout } from './components';
import { useRoutesWithTranslation } from 'routes';
// import {
//   AxiosInterceptorContext, // using this is optional
//   DappProvider,
//   Layout,
//   TransactionsToastList,
//   NotificationModal,
//   SignTransactionsModals
//   // uncomment this to use the custom transaction tracker
//   // TransactionsTracker
// } from 'components';

import {
  apiTimeout,
  walletConnectV2ProjectId,
  environment,
  sampleAuthenticatedDomains,
  metamaskSnapWalletAddress
} from 'config';
import { RouteNamesEnum } from 'localConstants';
import { PageNotFound, Unlock } from 'pages';

export const App = () => {
  const routes = useRoutesWithTranslation();
  return (
    <Router>
      <AxiosInterceptors>
        <BatchTransactionsContextProvider>
          <Layout>
            <Routes>
              {routes.map((route) => (
                <Route
                  key={`route-key-${route.path}`}
                  path={route.path}
                  element={<route.component />}
                >
                  {route.children?.map((child) => (
                    <Route
                      key={`route-key-${route.path}-${child.path}`}
                      path={child.path}
                      element={<child.component />}
                    />
                  ))}
                </Route>
              ))}
              <Route path='*' element={<PageNotFound />} />
            </Routes>
          </Layout>
        </BatchTransactionsContextProvider>
      </AxiosInterceptors>
    </Router>
  );
};
