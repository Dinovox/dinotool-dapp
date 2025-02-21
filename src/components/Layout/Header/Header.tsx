import { Button } from 'components/Button';
import { MxLink } from 'components/MxLink';
import { logout } from 'helpers';
import { useGetAccount, useGetIsLoggedIn, useGetNetworkConfig } from 'hooks';
import { RouteNamesEnum } from 'localConstants';
import MultiversXLogo from '../../../assets/img/multiversx-logo.svg?react';
import { useMatch } from 'react-router-dom';
import dinovoxLogo from '/dinovox_logo.webp';
import ShortenedAddress from 'helpers/shortenedAddress';
import { EnvironmentsEnum } from 'types';
import { environment } from 'config';

const callbackUrl = `${window.location.origin}/`;
const onRedirect = undefined; // use this to redirect with useNavigate to a specific page after logout
const shouldAttemptReLogin = false; // use for special cases where you want to re-login after logout
const options = {
  /*
   * @param {boolean} [shouldBroadcastLogoutAcrossTabs=true]
   * @description If your dApp supports multiple accounts on multiple tabs,
   * this param will broadcast the logout event across all tabs.
   */
  shouldBroadcastLogoutAcrossTabs: true,
  /*
   * @param {boolean} [hasConsentPopup=false]
   * @description Set it to true if you want to perform async calls before logging out on Safari.
   * It will open a consent popup for the user to confirm the action before leaving the page.
   */
  hasConsentPopup: false
};

export const Header = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const isUnlockRoute = Boolean(useMatch(RouteNamesEnum.unlock));
  const network = useGetNetworkConfig();
  const ConnectButton = isUnlockRoute ? null : (
    <MxLink to={RouteNamesEnum.unlock}>Connect</MxLink>
  );

  const handleLogout = () => {
    sessionStorage.clear();
    logout(
      callbackUrl,
      /*
       * following are optional params. Feel free to remove them in your implementation
       */
      onRedirect,
      shouldAttemptReLogin,
      options
    );
  };
  const { address } = useGetAccount();

  return (
    <div>
      <header className='flex flex-row align-center justify-between pl-6 pr-6 pt-6'>
        <MxLink
          className='flex items-center justify-between'
          to={isLoggedIn ? RouteNamesEnum.home : RouteNamesEnum.home}
        >
          {/* <MultiversXLogo className='w-full h-6' /> */}
          <img src={dinovoxLogo} alt='Dinovox Logo' className='w-64 h-auto' />
        </MxLink>

        <nav className='h-full w-full text-sm sm:relative sm:left-auto sm:top-auto sm:flex sm:w-auto sm:flex-row sm:justify-end sm:bg-transparent'>
          <div className='flex justify-end container mx-auto items-center gap-2'>
            <div className='flex gap-1 items-center'>
              <div className='w-2 h-2 rounded-full bg-green-500' />
              <p className='text-gray-600'>{environment}</p>
            </div>
            {/* {environment === 'devnet' && (
              <MxLink className='' to={RouteNamesEnum.lotteries}>
                <div
                  style={{ width: '100%' }}
                  className='mintGazTitle dinoTitle'
                >
                  LOTTERIES
                </div>
              </MxLink>
            )} */}
            {isLoggedIn ? (
              <>
                {/* {['devnet', 'mainnet'].includes(environment) && (
                  <MxLink
                    className=''
                    to={isLoggedIn ? RouteNamesEnum.mint : RouteNamesEnum.home}
                  >
                    <div
                      style={{ width: '100%' }}
                      className='mintGazTitle dinoTitle'
                    >
                      GAZETTE
                    </div>
                  </MxLink>
                )}
                {['devnet', 'mainnet'].includes(environment) && (
                  <MxLink
                    className=''
                    to={isLoggedIn ? RouteNamesEnum.drop : RouteNamesEnum.home}
                  >
                    <div
                      style={{ width: '100%' }}
                      className='mintGazTitle dinoTitle'
                    >
                      DROP
                    </div>
                  </MxLink>
                )} */}
                {environment === 'testnet' && (
                  <MxLink
                    className=''
                    to={isLoggedIn ? RouteNamesEnum.quiz : RouteNamesEnum.home}
                  >
                    <div
                      style={{ width: '100%' }}
                      className='mintGazTitle dinoTitle'
                    >
                      QUIZ
                    </div>
                  </MxLink>
                )}{' '}
                <button onClick={handleLogout} className='dinoButton reverse'>
                  Close
                </button>
              </>
            ) : (
              ConnectButton
            )}
          </div>{' '}
        </nav>
      </header>
      {/* <div style={{ margin: 'auto', textAlign: 'center' }}>
        <ShortenedAddress address={address} />
      </div> */}
    </div>
  );
};
