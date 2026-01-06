import { PageWrapper } from 'wrappers';
import { Breadcrumb } from 'components/ui/Breadcrumb';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';
import { useLocation } from 'react-router-dom';
import { useGetLoginInfo, useGetAccountInfo, useGetIsLoggedIn } from 'lib';
import { useEffect, useState } from 'react';
import { message } from 'antd';
import { graou_identifier, dinoclaim_api } from 'config';
import { FaDiscord, FaTwitter, FaCopy, FaUserCircle } from 'react-icons/fa';
import ShortenedAddress from 'helpers/shortenedAddress';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import BigNumber from 'bignumber.js';
import { ConnectButton } from 'components/Button/ConnectButton';
import { motion } from 'framer-motion';
import { User, MessageCircle, Gift, ShieldCheck, Tag } from 'lucide-react';
import { useGetOffers } from 'helpers/api/useGetOffers';
import { ActionWithdrawOffer } from 'contracts/dinauction/actions/WithdrawOffer';
import { FormatAmount } from 'helpers/api/useGetEsdtInformations';
import { useGetAuctions } from 'helpers/api/useGetAuctions';
import { Gavel } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const isLoggedIn = useGetIsLoggedIn();

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

  const { data: offersData, loading: offersLoading } = useGetOffers({
    owner: address,
    limit: 50,
    enabled: !!address
  });

  const { data: auctionsData, loading: auctionsLoading } = useGetAuctions({
    owner: address,
    limit: 50,
    enabled: !!address
  });

  useEffect(() => {
    const fetchAuthProfile = async () => {
      if (!tokenLogin || (isDiscordLinked && isTwitterLinked)) {
        return;
      }
      try {
        const res = await fetch(`${dinoclaim_api}/auth`, {
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
    const res = await fetch(`${dinoclaim_api}/auth/discord`, {
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
    const res = await fetch(`${dinoclaim_api}/auth/discord`, {
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
    const res = await fetch(`${dinoclaim_api}/auth/twitter`, {
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
    const res = await fetch(`${dinoclaim_api}/auth/twitter`, {
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

  const tr = (t: any, key: string, def: string) =>
    t && typeof t === 'function' && t(key) !== key ? t(key) : def;

  if (loading || !profile) {
    return (
      <PageWrapper>
        <div className='container mx-auto px-4 py-6'>
          <Breadcrumb
            items={[
              { label: 'Home', path: '/' },
              { label: t('global:profile') }
            ]}
            className='mb-8'
          />

          {isLoggedIn ? (
            <div className='flex flex-col items-center justify-center min-h-[400px]'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mb-4'></div>
              <span className='text-gray-500 font-medium'>
                {t('profile:loading_profile')}
              </span>
            </div>
          ) : (
            <div className='flex items-center justify-center min-h-[60vh]'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className='w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-yellow-100/50 border border-yellow-100'
              >
                <div className='mb-8 text-center'>
                  <div className='w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-yellow-500'>
                    <User size={32} />
                  </div>
                  <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                    {tr(t, 'profile:connect_title', 'Connect Profile')}
                  </h1>
                  <p className='text-gray-500 leading-relaxed'>
                    {tr(
                      t,
                      'profile:connect_sub',
                      'Sign in with your wallet to access your profile, manage settings, and link your social accounts.'
                    )}
                  </p>
                </div>

                <div className='space-y-3 mb-8'>
                  {[
                    { icon: User, text: t('profile:edit_profile_details') },
                    {
                      icon: MessageCircle,
                      text: t('profile:link_discord_perks')
                    },
                    { icon: Gift, text: t('profile:claim_rewards_drops') }
                  ].map((item, i) => (
                    <div
                      key={i}
                      className='flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100'
                    >
                      <div className='p-2 bg-white rounded-lg shadow-sm text-yellow-500'>
                        <item.icon size={16} />
                      </div>
                      <span className='text-sm font-medium text-gray-700'>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className='flex justify-center mb-6'>
                  <ConnectButton />
                </div>

                <p className='text-center text-xs text-gray-400 flex items-center justify-center gap-1.5'>
                  <ShieldCheck size={14} />
                  <span>{t('profile:secure_connection')}</span>
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </PageWrapper>
    );
  }

  return (
    <div className='container mx-auto px-4 py-6 max-w-7xl'>
      <Breadcrumb
        items={[{ label: 'Home', path: '/' }, { label: t('global:profile') }]}
        className='mb-8'
      />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Left Column - Identity Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className='lg:col-span-1'
        >
          <div className='bg-white rounded-3xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden sticky top-24'>
            <div className='h-32 bg-gradient-to-br from-yellow-400 to-yellow-300 relative'>
              <div className='absolute -bottom-12 left-1/2 -translate-x-1/2'>
                <div className='relative'>
                  <div className='w-24 h-24 rounded-full bg-white p-1 shadow-lg'>
                    <div className='w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden'>
                      <FaUserCircle className='text-gray-400 text-6xl' />
                    </div>
                  </div>
                  <div className='absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full'></div>
                </div>
              </div>
            </div>

            <div className='pt-16 pb-8 px-6 text-center'>
              <h2 className='text-xl font-bold text-gray-900 mb-1'>
                {profile?.twitter?.username ||
                  profile?.discord?.username ||
                  t('profile:explorer')}
              </h2>
              <p className='text-sm text-gray-500 mb-6'>
                {profile?.twitter
                  ? '@' + profile.twitter.username
                  : t('profile:dinovox_member')}
              </p>

              <div className='bg-gray-50 rounded-xl p-3 border border-gray-100 mb-6'>
                <p className='text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2'>
                  {t('profile:wallet_address')}
                </p>
                <div className='flex items-center justify-center gap-2'>
                  <ShortenedAddress address={address} />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                      message.success(t('profile:address_copied'));
                    }}
                    className='p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-gray-600'
                  >
                    <FaCopy size={12} />
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='bg-yellow-50 rounded-xl p-3 border border-yellow-100'>
                  <p className='text-xs text-yellow-600 font-medium mb-1'>
                    {t('profile:egld_balance')}
                  </p>
                  <p className='text-lg font-bold text-gray-900'>
                    <FormatAmount amount={egldBalance} identifier='egld' />
                  </p>
                </div>
                <div className='bg-green-50 rounded-xl p-3 border border-green-100'>
                  <p className='text-xs text-green-600 font-medium mb-1'>
                    {t('profile:graou_balance')}
                  </p>
                  <p className='text-lg font-bold text-gray-900'>
                    <FormatAmount amount={graouBalance} identifier='graou' />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Settings & Connections */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className='lg:col-span-2 space-y-6'
        >
          {/* Social Connections */}
          <div className='bg-white rounded-3xl shadow-lg shadow-gray-100/50 border border-gray-100 p-8'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='p-2 bg-blue-50 rounded-xl text-blue-500'>
                <MessageCircle size={20} />
              </div>
              <div>
                <h3 className='text-lg font-bold text-gray-900'>
                  {t('profile:social_connections')}
                </h3>
                <p className='text-sm text-gray-500'>
                  {t('profile:social_connections_sub')}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Discord Card */}
              <div
                className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                  profile?.discord
                    ? 'bg-[#5865F2]/5 border-[#5865F2]/20'
                    : 'bg-white border-gray-200 hover:border-[#5865F2]/50 hover:shadow-md'
                }`}
              >
                <div className='p-5'>
                  <div className='flex justify-between items-start mb-4'>
                    <FaDiscord
                      className={`text-3xl ${
                        profile?.discord ? 'text-[#5865F2]' : 'text-gray-300'
                      }`}
                    />
                    {profile?.discord && (
                      <span className='px-2 py-1 bg-[#5865F2]/10 text-[#5865F2] text-xs font-bold rounded-lg'>
                        {t('profile:connected')}
                      </span>
                    )}
                  </div>

                  {profile?.discord ? (
                    <>
                      <p className='font-bold text-gray-900 mb-1'>
                        {profile.discord.username}
                      </p>
                      <p className='text-xs text-gray-500 mb-4'>
                        ID: {profile.discord.discordId}
                      </p>
                      <button
                        onClick={handleDisconnectDiscord}
                        className='w-full py-2 px-4 bg-white border border-gray-200 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors'
                      >
                        {t('profile:disconnect_btn')}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className='font-bold text-gray-900 mb-1'>
                        {t('profile:discord_title')}
                      </p>
                      <p className='text-xs text-gray-500 mb-4'>
                        {t('profile:discord_connect_sub')}
                      </p>
                      <button
                        onClick={handleConnectDiscord}
                        className='w-full py-2 px-4 bg-[#5865F2] text-white text-sm font-medium rounded-xl hover:bg-[#4752c4] transition-colors shadow-lg shadow-[#5865F2]/20'
                      >
                        {t('profile:connect_discord_btn')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Twitter Card */}
              <div
                className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                  profile?.twitter
                    ? 'bg-[#1DA1F2]/5 border-[#1DA1F2]/20'
                    : 'bg-white border-gray-200 hover:border-[#1DA1F2]/50 hover:shadow-md'
                }`}
              >
                <div className='p-5'>
                  <div className='flex justify-between items-start mb-4'>
                    <FaTwitter
                      className={`text-3xl ${
                        profile?.twitter ? 'text-[#1DA1F2]' : 'text-gray-300'
                      }`}
                    />
                    {profile?.twitter && (
                      <span className='px-2 py-1 bg-[#1DA1F2]/10 text-[#1DA1F2] text-xs font-bold rounded-lg'>
                        {t('profile:connected')}
                      </span>
                    )}
                  </div>

                  {profile?.twitter ? (
                    <>
                      <p className='font-bold text-gray-900 mb-1'>
                        @{profile.twitter.username}
                      </p>
                      <p className='text-xs text-gray-500 mb-4'>
                        ID: {profile.twitter.twitterId}
                      </p>
                      <button
                        onClick={handleDisconnectTwitter}
                        className='w-full py-2 px-4 bg-white border border-gray-200 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors'
                      >
                        {t('profile:disconnect_btn')}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className='font-bold text-gray-900 mb-1'>
                        {t('profile:twitter_title')}
                      </p>
                      <p className='text-xs text-gray-500 mb-4'>
                        {t('profile:twitter_connect_sub')}
                      </p>
                      <button
                        onClick={handleConnectTwitter}
                        className='w-full py-2 px-4 bg-[#1DA1F2] text-white text-sm font-medium rounded-xl hover:bg-[#0d8ddb] transition-colors shadow-lg shadow-[#1DA1F2]/20'
                      >
                        {t('profile:connect_twitter_btn')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Member Statistics */}
          {/* <div className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-lg p-8 text-white relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16'></div>
            <div className='relative z-10'>
              <h3 className='text-lg font-bold mb-2'>Member Statistics</h3>
              <div className='grid grid-cols-3 gap-6 mt-6'>
                <div>
                  <p className='text-gray-400 text-xs uppercase tracking-wider mb-1'>
                    Joined
                  </p>
                  <p className='font-mono font-bold text-xl'>...</p>
                </div>
                <div>
                  <p className='text-gray-400 text-xs uppercase tracking-wider mb-1'>
                    Rank
                  </p>
                  <p className='font-mono font-bold text-xl text-yellow-400'>
                    ...
                  </p>
                </div>
                <div>
                  <p className='text-gray-400 text-xs uppercase tracking-wider mb-1'>
                    NFTs
                  </p>
                  <p className='font-mono font-bold text-xl'>-</p>
                </div>
              </div>
            </div>
          </div> */}

          {/* User's Active Auctions */}
          <div className='bg-white rounded-3xl shadow-lg shadow-gray-100/50 border border-gray-100 p-8'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='bg-orange-50 rounded-xl text-orange-500'>
                <Gavel size={20} />
              </div>
              <div>
                <h3 className='text-lg font-bold text-gray-900'>
                  {t('profile:active_auctions_title')}
                </h3>
                <p className='text-sm text-gray-500'>
                  {t('profile:active_auctions_sub')}
                </p>
              </div>
            </div>

            <div className='space-y-4'>
              {auctionsLoading && (
                <div className='text-center py-8 text-gray-500'>
                  {t('profile:loading_auctions')}
                </div>
              )}

              {!auctionsLoading &&
                (!auctionsData?.auctions ||
                  auctionsData.auctions.length === 0) && (
                  <div className='text-center py-8 rounded-2xl bg-gray-50 border border-gray-100 border-dashed'>
                    <p className='text-gray-500 text-sm'>
                      {t('profile:no_active_auctions')}
                    </p>
                  </div>
                )}

              {auctionsData?.auctions?.map((auction) => {
                const isEnded =
                  Date.now() > new Date(auction.deadline).getTime();

                return (
                  <div
                    key={auction.id}
                    className='flex flex-wrap md:flex-nowrap items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all'
                  >
                    <div>
                      <div className='font-bold text-gray-900 flex items-center gap-2 mb-1'>
                        {t('profile:auction_id', { id: auction.id })}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {t('profile:token_label')}{' '}
                        <span className='font-medium text-gray-700'>
                          {auction.tokenIdentifier}
                        </span>
                        <span className='ml-1 text-gray-400'>
                          {t('profile:nonce_label', {
                            nonce: auction.tokenNonce?.toString() || '0'
                          })}
                        </span>
                      </div>
                      <div className='text-sm text-gray-500 mt-1'>
                        {t('profile:current_bid_label')}{' '}
                        <FormatAmount
                          amount={auction.currentBid}
                          identifier={auction.paymentTokenIdentifier}
                        />
                      </div>
                      {isEnded && (
                        <span className='inline-block mt-1 text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded'>
                          {t('profile:ended_label')}
                        </span>
                      )}
                    </div>

                    <div>
                      <Link
                        to={`/marketplace/listings/${auction.id}`}
                        className='inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors'
                      >
                        {t('profile:view_auction_btn')}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User's Active Offers */}
          <div className='bg-white rounded-3xl shadow-lg shadow-gray-100/50 border border-gray-100 p-8'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='bg-purple-50 rounded-xl text-purple-500'>
                <Tag size={20} />
              </div>
              <div>
                <h3 className='text-lg font-bold text-gray-900'>
                  {t('profile:active_offers_title')}
                </h3>
                <p className='text-sm text-gray-500'>
                  {t('profile:active_offers_sub')}
                </p>
              </div>
            </div>

            <div className='space-y-4'>
              {offersLoading && (
                <div className='text-center py-8 text-gray-500'>
                  {t('profile:loading_offers')}
                </div>
              )}

              {!offersLoading &&
                (!offersData?.offers || offersData.offers.length === 0) && (
                  <div className='text-center py-8 rounded-2xl bg-gray-50 border border-gray-100 border-dashed'>
                    <p className='text-gray-500 text-sm'>
                      {t('profile:no_active_offers')}
                    </p>
                  </div>
                )}

              {offersData?.offers?.map((offer) => {
                const isExpired =
                  Date.now() > new Date(offer.deadline).getTime();

                return (
                  <div
                    key={offer.id}
                    className='flex flex-wrap md:flex-nowrap items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all'
                  >
                    <div>
                      <div className='font-bold text-gray-900 flex items-center gap-2 mb-1'>
                        <FormatAmount
                          amount={offer.paymentAmount}
                          identifier={offer.paymentTokenIdentifier}
                        />
                        {offer.offerTokenNonce === 0 && (
                          <span className='inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 ring-1 ring-inset ring-blue-700/10'>
                            {t('profile:collection_offer_badge')}
                          </span>
                        )}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {t('profile:collection_label')}{' '}
                        <span className='font-medium text-gray-700'>
                          {offer.offerTokenIdentifier
                            ?.split('-')
                            .slice(0, 2)
                            .join('-')}
                        </span>
                        {offer.offerTokenNonce > 0 && (
                          <span className='ml-1 text-gray-400'>
                            {t('profile:item_label', {
                              nonce: offer.offerTokenNonce
                            })}
                          </span>
                        )}
                      </div>
                      {isExpired && (
                        <span className='inline-block mt-1 text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded'>
                          {t('profile:expired_label')}
                        </span>
                      )}
                    </div>

                    <div>
                      <ActionWithdrawOffer
                        offerId={offer.id}
                        label={t('profile:cancel_offer_btn')}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
