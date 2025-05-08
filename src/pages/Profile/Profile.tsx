import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';
import { useLocation } from 'react-router-dom';
import { useGetLoginInfo } from 'hooks';
import { useEffect, useState } from 'react';
import { message } from 'antd';

export type DiscordInfo = {
  discordId: string;
  username: string;
  globalName: string | null;
};

export type AuthProfile = {
  walletId: number;
  address: string;
  discordLinked: boolean;
  discord: DiscordInfo | null;
};

export const Profile = () => {
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  const loading = useLoadTranslations('home');
  const { t } = useTranslation();
  const { tokenLogin } = useGetLoginInfo();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const discordLinked = params.get('discord') === 'linked';

  useEffect(() => {
    if (discordLinked) {
      alert('Votre compte Discord est bien lié !');
    }
  }, [discordLinked]);

  useEffect(() => {
    const fetchAuthProfile = async () => {
      if (!tokenLogin?.nativeAuthToken) {
        console.warn('No auth token found');
        return;
      }

      try {
        const res = await fetch('https://devnet-api.dinovox.com/auth', {
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
        console.log('Authenticated user profile:', data);
      } catch (err) {
        console.error('Error fetching auth profile:', err);
        message.error('Unable to load profile');
      }
    };

    fetchAuthProfile();
  }, [tokenLogin]);

  const handleConnectDiscord = async () => {
    if (!tokenLogin) {
      return;
    }

    const res = await fetch('https://devnet-api.dinovox.com/auth/discord', {
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

  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <AuthRedirectWrapper requireAuth={true}>
      <PageWrapper>
        <div className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          <div className='navigation-cards '>
            {profile?.discordLinked ? (
              <>GM {profile.discord?.username}</>
            ) : (
              <button onClick={handleConnectDiscord}>Connect Discord</button>
            )}
          </div>
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
