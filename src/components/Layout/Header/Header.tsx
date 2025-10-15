import { useState, useRef, useEffect } from 'react';
import { Button } from 'components/Button';
import { MxLink } from 'components/MxLink';
import {
  getAccountProvider,
  useGetAccount,
  useGetIsLoggedIn,
  useGetNetworkConfig
} from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { Link, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { environment } from 'config';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';
import { FaUserCircle, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { ConnectButton } from 'components/Button/ConnectButton';
const dinovoxLogo = '/DinoVoxDinoTools.png';
const DinoToolsAlpha = '/DinoToolsAlpha.png';
import LanguageSelector from 'components/LanguageSelector';
export const Header = () => {
  const loading = useLoadTranslations('global');
  const { t } = useTranslation();
  const isLoggedIn = useGetIsLoggedIn();
  const isUnlockRoute = Boolean(useMatch(RouteNamesEnum.unlock));
  const network = useGetNetworkConfig();
  const currentRouteName = useMatch('*')?.pathname || 'unknown';
  const navigate = useNavigate();
  const provider = getAccountProvider();

  const { address } = useGetAccount();

  // Dropdown state
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    sessionStorage.clear();
    // logout(callbackUrl, onRedirect, shouldAttemptReLogin, options);
    await provider.logout();
    navigate(RouteNamesEnum.home);
  };

  const handleProfile = () => {
    setOpen(false);
    navigate(RouteNamesEnum.profile);
  };

  // function ConnectButton({
  //   t,
  //   isUnlockRoute
  // }: {
  //   t: any;
  //   isUnlockRoute: boolean;
  // }) {
  //   const location = useLocation();
  //   if (isUnlockRoute) return null;

  //   const from = encodeURIComponent(
  //     location.pathname + location.search + location.hash
  //   );

  //   console.log({ from });
  //   return (
  //     <Link
  //       to={`${RouteNamesEnum.unlock}?from=${from}`}
  //       state={{ background: location }} // garde l’effet “modale au-dessus”
  //     >
  //       {t('global:connect')}
  //     </Link>
  //   );
  // }

  return (
    <div>
      <LanguageSelector />
      <header className='flex flex-row align-center justify-between pl-6 pr-6 pt-6'>
        <MxLink
          className='flex items-center justify-between'
          to={isLoggedIn ? RouteNamesEnum.home : RouteNamesEnum.home}
        >
          <img
            src={
              ['/lotteries', '/drop', '/collections', '/nfts'].some((route) =>
                currentRouteName.startsWith(route)
              )
                ? DinoToolsAlpha
                : dinovoxLogo
            }
            alt='Dinovox Logo'
            className='w-64 h-auto'
          />
        </MxLink>

        <nav className='h-full w-full sm:flex sm:w-auto sm:flex-row sm:justify-end sm:bg-transparent'>
          <div className='flex justify-end container mx-auto items-center gap-2'>
            {isLoggedIn ? (
              <div className='relative' ref={dropdownRef}>
                <button
                  className='flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400 transition hover:bg-yellow-100 px-2 py-1'
                  onClick={() => setOpen((v) => !v)}
                  aria-label={t('global:profile')}
                  style={{
                    background: open ? '#f5ed43' : 'transparent',
                    borderRadius: '9999px'
                  }}
                >
                  <FaUserCircle
                    style={{
                      fontSize: '2.1rem',
                      color: open ? '#453922' : '#bfae6a',
                      transition: 'color 0.2s'
                    }}
                  />
                  <span className='hidden sm:inline text-base font-semibold text-gray-700'>
                    {t('global:profile')}
                  </span>
                </button>
                {open && (
                  <div
                    className='absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-fade-in'
                    style={{
                      minWidth: '160px'
                    }}
                  >
                    <button
                      className='w-full flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-yellow-50 transition rounded-t-xl'
                      onClick={handleProfile}
                    >
                      <FaUser className='text-yellow-500' />
                      <span>{t('global:profile')}</span>
                    </button>
                    <button
                      className='w-full flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-yellow-50 transition rounded-b-xl'
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt className='text-red-500' />
                      <span>{t('global:close')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <ConnectButton />
            )}
          </div>
        </nav>
      </header>
    </div>
  );
};
