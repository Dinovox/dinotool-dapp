import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation
} from 'react-router-dom';
import './routes/i18n';
import { AxiosInterceptors, BatchTransactionsContextProvider } from 'wrappers';
import { Layout } from './components';
import { useRoutesWithTranslation } from 'routes';
import { PageNotFound, Unlock } from 'pages';
import { NftProvider } from './helpers/contexts/NftContext';
import { MarketplaceNotification } from 'components/MarketplaceNotification/MarketplaceNotification';
import { LotteryNotification } from 'components/LotteryNotification/LotteryNotification';

export const App = () => {
  const routes = useRoutesWithTranslation();

  const location = useLocation();
  const state = location.state as { background?: Location };
  const background = state?.background;
  return (
    <AxiosInterceptors>
      <BatchTransactionsContextProvider>
        <Layout>
          <MarketplaceNotification />
          <LotteryNotification />
          <Routes location={background || location}>
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
                ))}{' '}
              </Route>
            ))}
            <Route path='*' element={<PageNotFound />} />
          </Routes>{' '}
          {background && (
            <Routes>
              <Route path='/unlock' element={<Unlock />} />
            </Routes>
          )}
        </Layout>
      </BatchTransactionsContextProvider>
    </AxiosInterceptors>
  );
};
