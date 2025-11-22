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
              [
                '/lotteries',
                '/drop',
                '/collections',
                '/nfts',
                '/claim',
                '/claimadmin'
              ].some((route) => currentRouteName.startsWith(route))
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
                  onClick={() => setOpen((v) => !v)}
                  className='flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-yellow-400 hover:bg-yellow-50/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2'
                  aria-label={t('global:profile')}
                >
                  {/* Avatar circle with user icon */}
                  <div className='w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-sm'>
                    <FaUserCircle className='text-yellow-900 text-lg' />
                  </div>

                  {/* Profile text - hidden on mobile */}
                  <span className='hidden sm:block text-sm font-medium text-gray-700'>
                    {t('global:profile')}
                  </span>

                  {/* Chevron indicator */}
                  <svg
                    className={`hidden sm:block w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      open ? 'rotate-180' : ''
                    }`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {open && (
                  <div className='absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50'>
                    {/* User info section */}
                    <div className='px-4 py-3 border-b border-gray-100 bg-gray-50'>
                      <p className='text-xs text-gray-500 mb-1'>Connected as</p>
                      <p className='text-sm font-medium text-gray-900 truncate'>
                        {address.slice(0, 8)}...{address.slice(-6)}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div className='py-1'>
                      <button
                        onClick={handleProfile}
                        className='w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors duration-150'
                      >
                        <FaUser className='text-gray-400 text-sm' />
                        <span className='text-sm font-medium'>
                          {t('global:profile')}
                        </span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className='w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors duration-150'
                      >
                        <FaSignOutAlt className='text-red-500 text-sm' />
                        <span className='text-sm font-medium'>
                          {t('global:close')}
                        </span>
                      </button>
                    </div>
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
