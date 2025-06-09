import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';
import { useLocation } from 'react-router-dom';
import { useGetLoginInfo, useGetAccountInfo } from 'hooks';
import { useEffect, useState } from 'react';
import { message } from 'antd';
import { internal_api_v2, graou_identifier } from 'config';
import { FaDiscord, FaTwitter, FaCopy, FaUserCircle } from 'react-icons/fa';
import ShortenedAddress from 'helpers/shortenedAddress';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import BigNumber from 'bignumber.js';

export type DiscordInfo = {
  discordId: string;
  username: string;
  globalName: string | null;
};

export type TwitterInfo = {
  twitterId: string;
  username: string;
  globalName: string | null;
};
export type AuthProfile = {
  walletId: number;
  address: string;
  discord: DiscordInfo | null;
  twitter: TwitterInfo | null;
};

export const Profile = () => {
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  const loading = useLoadTranslations('profile');
  const { t } = useTranslation();
  const { tokenLogin } = useGetLoginInfo();
  const { address, account } = useGetAccountInfo();
  const location = useLocation();

  // Pour les soldes
  const userEsdt = useGetUserESDT();
  const graouToken = userEsdt.find(
    (esdt: any) => esdt.identifier === graou_identifier
  );
  const graouBalance = graouToken
    ? new BigNumber(graouToken.balance).dividedBy(1e18)
    : new BigNumber(0);
  const egldBalance = account?.balance
    ? new BigNumber(account.balance).dividedBy(1e18)
    : new BigNumber(0);

  const [isDiscordLinked, setIsDiscordLinked] = useState(false);
  const [isTwitterLinked, setIsTwitterLinked] = useState(false);

  useEffect(() => {
    const fetchAuthProfile = async () => {
      if (!tokenLogin || (isDiscordLinked && isTwitterLinked)) {
        return;
      }
      try {
        const res = await fetch(`${internal_api_v2}/auth`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
          }
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setProfile(data);
        setIsDiscordLinked(data.discord !== null);
        setIsTwitterLinked(data.twitter !== null);
      } catch (err) {
        message.error('Unable to load profile');
      }
    };

    fetchAuthProfile();
  }, [tokenLogin, isDiscordLinked, isTwitterLinked]);

  const handleConnectDiscord = async () => {
    if (!tokenLogin) return;
    const res = await fetch(`${internal_api_v2}/auth/discord`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
      }
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };
  const handleDisconnectDiscord = async () => {
    if (!tokenLogin) return;
    const res = await fetch(`${internal_api_v2}/auth/discord`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
      }
    });
    const data = await res.json();
    if (data) {
      setIsDiscordLinked(false);
    }
  };

  const handleConnectTwitter = async () => {
    if (!tokenLogin) return;
    const res = await fetch(`${internal_api_v2}/auth/twitter`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
      }
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };
  const handleDisconnectTwitter = async () => {
    if (!tokenLogin) return;
    const res = await fetch(`${internal_api_v2}/auth/twitter`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
      }
    });
    const data = await res.json();
    if (data) {
      setIsTwitterLinked(false);
    }
  };

  if (loading || !profile) {
    return (
      <AuthRedirectWrapper requireAuth={true}>
        <PageWrapper>
          <div className='flex flex-col items-center justify-center min-h-[300px]'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mb-4'></div>
            <span className='text-gray-500'>
              {t('profile:loading_profile')}
            </span>
          </div>
        </PageWrapper>
      </AuthRedirectWrapper>
    );
  }

  return (
    <AuthRedirectWrapper requireAuth={true}>
      <PageWrapper>
        <div className='w-full flex justify-center items-center py-8'>
          <div className='bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full flex flex-col items-center gap-6 border border-yellow-100'>
            {/* Avatar */}
            <div className='relative'>
              <FaUserCircle
                className='text-yellow-400'
                style={{ fontSize: 80 }}
              />
              <span className='absolute bottom-0 right-0 bg-green-400 border-2 border-white rounded-full w-5 h-5'></span>
            </div>
            {/* Username */}
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-800 mb-1'>
                {profile?.twitter?.username ||
                  profile?.discord?.username ||
                  'Utilisateur'}
              </div>
              <div className='text-sm text-gray-400'>
                {profile?.twitter
                  ? 'Connecté via Twitter'
                  : profile?.discord
                  ? 'Connecté via Discord'
                  : 'Connecté via Wallet'}
              </div>
            </div>
            {/* Adresse */}
            <div className='w-full flex flex-col items-center gap-1'>
              <span className='text-xs text-gray-400'>
                {' '}
                {t('profile:multiversx_address')}
              </span>
              <div className='flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200'>
                <ShortenedAddress address={address} />
              </div>
            </div>
            {/* Soldes */}
            <div className='w-full flex flex-col gap-2 mt-2'>
              <div className='flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg border border-gray-200'>
                <span className='font-medium text-gray-700'>
                  {' '}
                  {t('profile:balance_token', {
                    token: 'EGLD'
                  })}
                </span>
                <span className='font-mono text-yellow-600 font-bold'>
                  {egldBalance.toFixed(4)} EGLD
                </span>
              </div>
              <div className='flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg border border-gray-200'>
                <span className='font-medium text-gray-700'>
                  {t('profile:balance_token', {
                    token: graou_identifier
                  })}
                </span>
                <span className='font-mono text-yellow-600 font-bold'>
                  {graouBalance.toFixed(2)} GRAOU
                </span>
              </div>
            </div>
            {/* Réseaux sociaux */}
            <div className='flex flex-col gap-2 w-full mt-4'>
              <div className='flex items-center gap-3 justify-center'>
                {/* Discord */}
                {profile?.discord ? (
                  <button
                    onClick={handleDisconnectDiscord}
                    className='flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5865F2] text-white font-semibold hover:bg-[#4752c4] transition'
                  >
                    <FaDiscord className='text-xl' />
                    {t('profile:disconnect_network', {
                      network: 'Discord'
                    })}{' '}
                  </button>
                ) : (
                  <button
                    onClick={handleConnectDiscord}
                    className='flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5865F2] text-white font-semibold hover:bg-[#4752c4] transition'
                  >
                    <FaDiscord className='text-xl' />
                    {t('profile:connect_network', {
                      network: 'Discord'
                    })}{' '}
                  </button>
                )}
                {/* Twitter */}
                {profile?.twitter ? (
                  <button
                    onClick={handleDisconnectTwitter}
                    className='flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1DA1F2] text-white font-semibold hover:bg-[#0d8ddb] transition'
                  >
                    <FaTwitter className='text-xl' />
                    {t('profile:disconnect_network', {
                      network: 'Twitter'
                    })}{' '}
                  </button>
                ) : (
                  <button
                    onClick={handleConnectTwitter}
                    className='flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1DA1F2] text-white font-semibold hover:bg-[#0d8ddb] transition'
                  >
                    <FaTwitter className='text-xl' />
                    {t('profile:connect_network', {
                      network: 'Twitter'
                    })}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
