import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';
import { useLocation } from 'react-router-dom';
import { useGetLoginInfo } from 'hooks';
import { useEffect, useState } from 'react';
import { message } from 'antd';
import { is } from '@react-spring/shared';
import { internal_api_v2 } from 'config';

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

  const loading = useLoadTranslations('home');
  const { t } = useTranslation();
  const { tokenLogin } = useGetLoginInfo();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [isDiscordLinked, setIsDiscordLinked] = useState(false);
  const [isTwitterLinked, setIsTwitterLinked] = useState(false);
  useEffect(() => {
    const fetchAuthProfile = async () => {
      if (!tokenLogin || (isDiscordLinked && isTwitterLinked)) {
        console.warn('No auth token found');
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

        console.log('Authenticated user profile:', data);
      } catch (err) {
        console.error('Error fetching auth profile:', err);
        message.error('Unable to load profile');
      }
    };

    fetchAuthProfile();
  }, [tokenLogin, isDiscordLinked, isTwitterLinked]);

  const handleConnectDiscord = async () => {
    if (!tokenLogin) {
      return;
    }
    const res = await fetch(`${internal_api_v2}/auth/discord`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
      }
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url; // redirection vers Discord OAuth
    }
  };
  const handleDisconnectDiscord = async () => {
    if (!tokenLogin) {
      return;
    }

    const res = await fetch(`${internal_api_v2}/auth/discord`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
      }
    });

    const data = await res.json();
    console.log('Discord unlink response:', data);

    if (data) {
      setIsDiscordLinked(false);
    }
  };

  const handleConnectTwitter = async () => {
    if (!tokenLogin) {
      return;
    }
    const res = await fetch(`${internal_api_v2}/auth/twitter`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
      }
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url; // redirection vers Discord OAuth
    }
  };
  const handleDisconnectTwitter = async () => {
    if (!tokenLogin) {
      return;
    }

    const res = await fetch(`${internal_api_v2}/auth/twitter`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
      }
    });

    const data = await res.json();
    console.log('Twitter unlink response:', data);

    if (data) {
      setIsTwitterLinked(false);
    }
  };

  if (loading || !profile) {
    return (
      <AuthRedirectWrapper requireAuth={true}>
        {' '}
        <PageWrapper>Loading...</PageWrapper>
      </AuthRedirectWrapper>
    );
  }
  return (
    <AuthRedirectWrapper requireAuth={true}>
      <PageWrapper>
        <div className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          <div className='navigation-cards '>
            {profile?.discord ? (
              <>
                GM {profile.discord?.username}
                <button onClick={handleDisconnectDiscord}>
                  Disconnect Discord
                </button>
              </>
            ) : (
              <button onClick={handleConnectDiscord}>Connect Discord</button>
            )}
          </div>{' '}
          <div className='navigation-cards '>
            {profile?.twitter ? (
              <>
                GM {profile.twitter?.username}
                <button onClick={handleDisconnectTwitter}>
                  Disconnect Twitter
                </button>
              </>
            ) : (
              <button onClick={handleConnectTwitter}>Connect Twitter</button>
            )}
          </div>
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
