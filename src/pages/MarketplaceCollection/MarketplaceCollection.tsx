import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Breadcrumb } from 'components/ui/Breadcrumb';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useGetCollections } from 'helpers/api/getCollections';
import { useGetAuctionsPaginated } from 'contracts/dinauction/helpers/useGetAuctionsPaginated';
import { useGetOffers } from 'helpers/api/useGetOffers';
import { useGetCollectionStats } from 'helpers/api/useGetCollectionStats';
import { useGetCollectionBranding } from 'helpers/api/useGetCollectionBranding';
import { Auction } from 'pages/Marketplace/Auction';
import { FaTwitter, FaDiscord, FaGlobe } from 'react-icons/fa';

import { ActionMakeGlobalOffer } from 'contracts/dinauction/actions/MakeGlobalOffer';
import { ActionMakeOffer } from 'contracts/dinauction/actions/MakeOffer';
import BigNumber from 'bignumber.js';
import ShortenedAddress from 'helpers/shortenedAddress';
import { FormatAmount } from 'helpers/api/useGetEsdtInformations';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import { ActionAcceptOffer } from 'contracts/dinauction/actions/AcceptOffer';
import { ActionWithdrawOffer } from 'contracts/dinauction/actions/WithdrawOffer';
import { useGetAccount, useGetNetworkConfig } from 'lib';
import bigToHex from 'helpers/bigToHex';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import { DisplayNft } from 'helpers/DisplayNft';
import { useGetNftInformations } from 'pages/LotteryList/Transaction/helpers/useGetNftInformation';
import DisplayNftByToken from 'helpers/DisplayNftByToken';
import { useGetMarketplaceActivity } from 'helpers/api/useGetMarketplaceActivity';
import {
  dinovox_collections,
  friends_collections,
  auction_tokens
} from 'config';
/** ---------------- UI Components ---------------- **/
const Badge = ({
  children,
  tone = 'neutral' as 'neutral' | 'brand'
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand';
}) => {
  const cls =
    tone === 'brand'
      ? 'border-amber-300 bg-amber-50 text-amber-700'
      : 'border-gray-200 bg-gray-50 text-gray-700';
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${cls}`}
    >
      {children}
    </span>
  );
};

const Card: React.FC<
  React.PropsWithChildren<{ className?: string; id?: string }>
> = ({ children, className = '', id }) => (
  <div
    id={id}
    className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
  >
    {children}
  </div>
);

const CardHeader: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className = ''
}) => <div className={`p-4 ${className}`}>{children}</div>;

const CardContent: React.FC<
  React.PropsWithChildren<{ className?: string }>
> = ({ children, className = '' }) => (
  <div className={`p-4 pt-0 ${className}`}>{children}</div>
);

/** ---------------- Types ---------------- **/
type SortKey = 'newest' | 'priceAsc' | 'priceDesc' | 'endingSoon';
type SaleType = 'all' | 'fixed' | 'auction';

/** ---------------- Main Component ---------------- **/
export const MarketplaceCollectionById = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { address } = useGetAccount();
  const { network } = useGetNetworkConfig();
  const { hash } = window.location;
  useLoadTranslations('marketplace');
  const { t } = useTranslation();
  const [activeTab, setActiveTabState] = useState<
    'listings' | 'offers' | 'activity'
  >(
    hash === '#offers'
      ? 'offers'
      : hash === '#activity'
      ? 'activity'
      : 'listings'
  );

  const setActiveTab = (tab: 'listings' | 'offers' | 'activity') => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };
  const [page, setPage] = useState(1);
  const [offersPage, setOffersPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [saleType, setSaleType] = useState<SaleType>('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');

  // Global Offer State
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNonce, setOfferNonce] = useState('');
  const [offerDuration, setOfferDuration] = useState('0'); // Days (0 = indeterminate)
  const [selectedPaymentToken, setSelectedPaymentToken] = useState(
    auction_tokens[0]
  );

  // Balance Verification Logic
  const userEsdtBalance = useGetUserESDT();
  const { balance: userEgldBalance } = useGetAccount();

  const buyerBalance = useMemo(() => {
    if (selectedPaymentToken.identifier === 'EGLD') {
      return new BigNumber(userEgldBalance || 0);
    }
    const token = userEsdtBalance?.find(
      (t: any) => t.identifier === selectedPaymentToken.identifier
    );
    return new BigNumber(token?.balance || 0);
  }, [selectedPaymentToken, userEsdtBalance, userEgldBalance]);

  const hasEnoughFunds = useMemo(() => {
    if (!offerPrice) return true;
    const price = new BigNumber(offerPrice).shiftedBy(
      selectedPaymentToken.decimals
    );
    return buyerBalance.isGreaterThanOrEqualTo(price);
  }, [buyerBalance, offerPrice, selectedPaymentToken]);

  // Select In Wallet State
  const [selectedOfferForWallet, setSelectedOfferForWallet] = useState<
    number | null
  >(null);
  const [showOfferForWalletModal, setShowOfferForWalletModal] = useState(false);

  // Fetch NFT info if specific nonce is selected
  const nftInfo: any = useGetNftInformations(id, offerNonce);

  // 1. Fetch Collection Details
  const { data: collection } = useGetCollections(id);
  const { branding: collectionBranding } = useGetCollectionBranding(id);

  // 2. Fetch Listings (Auctions)
  const {
    auctions,
    isLoading: auctionsLoading,
    hasMore
  } = useGetAuctionsPaginated({
    page,
    limit: 20,
    collection: id
  });

  // 3. Filter & Sort (Client-side for current page - limitation of contract pagination)
  const filteredAuctions = useMemo(() => {
    let list = [...auctions];

    // Filter by Sale Type
    if (saleType !== 'all') {
      list = list.filter((a) => {
        const isAuction =
          !a.max_bid || a.max_bid === '0' || a.min_bid !== a.max_bid;
        const isFixed = !isAuction;
        return saleType === 'auction' ? isAuction : isFixed;
      });
    }

    // Filter by Search Query
    if (q.trim()) {
      const query = q.toLowerCase();
      list = list.filter(
        (a) =>
          a.auctioned_tokens?.token_identifier?.toLowerCase().includes(query) ||
          a.auction_id?.toString().includes(query)
      );
    }

    // Sort
    list.sort((a, b) => {
      const priceA = BigInt(a.current_bid || a.min_bid || '0');
      const priceB = BigInt(b.current_bid || b.min_bid || '0');
      const timeA = Number(a.deadline || 0);
      const timeB = Number(b.deadline || 0);

      switch (sort) {
        case 'priceAsc':
          return priceA < priceB ? -1 : priceA > priceB ? 1 : 0;
        case 'priceDesc':
          return priceA > priceB ? -1 : priceA < priceB ? 1 : 0;
        case 'endingSoon':
          return timeA - timeB;
        case 'newest':
        default:
          // Assuming higher ID is newer or we rely on default order
          return Number(b.auction_id) - Number(a.auction_id);
      }
    });

    return list;
  }, [auctions, saleType, q, sort]);

  // 5. Fetch Offers
  const { data: offersData, loading: offersLoading } = useGetOffers({
    page: offersPage,
    limit: 20,
    collection: id
  });

  // 6. Fetch Activity
  const { data: activityData, loading: activityLoading } =
    useGetMarketplaceActivity({
      page: activityPage,
      limit: 20,
      collection: id
    });

  // 7. Fetch User NFTs for Select Modal
  const userNfts = useGetUserNFT(address, undefined, id, {
    enabled: !!selectedOfferForWallet
  });

  // 7. Fetch Collection Stats
  const { stats: collectionStats } = useGetCollectionStats(id);

  // Compute calculated stats from offersData if API returns 0
  const calculatedStats = useMemo(() => {
    if (!offersData?.offers) return { global: null, specific: null };

    let globalMax = new BigNumber(0);
    let specificMax = new BigNumber(0);

    offersData.offers.forEach((o) => {
      // Only consider EGLD offers for now as stats are EGLD-based
      if (o.paymentTokenIdentifier === 'EGLD' && o.isActive) {
        const amount = new BigNumber(o.paymentAmount);
        if (o.offerTokenNonce === 0) {
          if (amount.gt(globalMax)) globalMax = amount;
        } else {
          if (amount.gt(specificMax)) specificMax = amount;
        }
      }
    });

    return {
      global: globalMax.gt(0) ? globalMax.toString() : null,
      specific: specificMax.gt(0) ? specificMax.toString() : null
    };
  }, [offersData]);

  // 4. Stats (Placeholder or derived)
  const stats = {
    floorPrice: collectionStats?.floor_ask_egld || undefined,
    bestGlobalOffer:
      collectionStats?.best_global_offer_egld &&
      collectionStats.best_global_offer_egld !== '0'
        ? collectionStats.best_global_offer_egld
        : calculatedStats.global || undefined,

    bestSpecificOffer:
      collectionStats?.best_specific_offer_egld &&
      collectionStats.best_specific_offer_egld !== '0'
        ? collectionStats.best_specific_offer_egld
        : calculatedStats.specific || undefined,
    volume24h: collectionStats?.volume_24h || undefined,
    volume7d: collectionStats?.volume_7d || undefined,
    volumeAllTime: collectionStats?.volume_all_time || undefined,
    floorToken: 'EGLD',
    activeListings: auctions.length // Only shows count of fetched page
  };

  return (
    <div className='mx-auto max-w-7xl px-4 pb-10'>
      <div className='mb-6'>
        <Breadcrumb
          items={[
            { label: 'Home', path: '/' },
            { label: 'Marketplace', path: '/marketplace' },
            { label: 'Collections', path: '/marketplace/collections' },
            { label: collection?.name || 'Collection' }
          ]}
        />
      </div>

      {/* Hero Section */}
      <div className='relative -mx-4 mb-6'>
        <div
          className='h-52 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-center bg-cover'
          style={{
            backgroundImage: `url(${
              collectionBranding?.images.banner ||
              `https://placehold.co/1600x420/1e293b/ffffff?text=${encodeURIComponent(
                collection?.name || 'Collection'
              )}`
            })`
          }}
        />
        <div className='container mx-auto px-4'>
          <div className='-mt-10 flex items-end gap-4'>
            {collectionBranding?.images.logo ? (
              <img
                src={collectionBranding.images.logo}
                alt='Collection Logo'
                className='h-24 w-24 rounded-2xl border-4 border-white shadow-lg bg-white object-cover'
              />
            ) : (
              <div className='h-24 w-24 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold'>
                {collection?.name?.charAt(0) || 'C'}
              </div>
            )}

            <div className='pb-2 flex-1'>
              <div className='flex justify-between items-start'>
                <div>
                  <h1 className='text-2xl font-semibold text-slate-900'>
                    {collectionBranding?.branding.name ||
                      collection?.name ||
                      'Unknown Collection'}
                  </h1>
                  <div className='mt-1 flex flex-wrap items-center gap-2'>
                    {/* Badges from Config */}
                    {dinovox_collections.includes(id) && (
                      <Badge tone='brand'>DinoVox</Badge>
                    )}
                    {friends_collections.includes(id) && (
                      <Badge tone='neutral'>Friends</Badge>
                    )}

                    {/* Branding Tags */}
                    {collectionBranding?.branding?.tags?.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}

                    <span className='text-xs text-slate-500'>
                      {collection?.collection}
                    </span>
                  </div>
                  {collectionBranding?.branding.description && (
                    <p className='mt-2 text-sm text-slate-600 max-w-2xl'>
                      {collectionBranding.branding.description}
                    </p>
                  )}
                </div>

                {/* Social Links */}
                <div className='flex gap-3 mt-2'>
                  {collectionBranding?.branding.website && (
                    <a
                      href={collectionBranding.branding.website}
                      target='_blank'
                      rel='noreferrer'
                      className='text-slate-500 hover:text-blue-500 transition'
                    >
                      <FaGlobe size={20} />
                    </a>
                  )}
                  {collectionBranding?.branding.twitter && (
                    <a
                      href={collectionBranding.branding.twitter}
                      target='_blank'
                      rel='noreferrer'
                      className='text-slate-500 hover:text-blue-400 transition'
                    >
                      <FaTwitter size={20} />
                    </a>
                  )}
                  {collectionBranding?.branding.discord && (
                    <a
                      href={collectionBranding.branding.discord}
                      target='_blank'
                      rel='noreferrer'
                      className='text-slate-500 hover:text-indigo-500 transition'
                    >
                      <FaDiscord size={20} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-6'>
        <Card>
          <CardHeader>
            <div className='text-xs text-slate-500'>Floor Price</div>
            <div className='text-lg font-semibold text-slate-900'>
              {stats.floorPrice && stats.floorToken ? (
                <span>
                  <FormatAmount amount={stats.floorPrice} identifier='EGLD' />
                </span>
              ) : (
                '-'
              )}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className='text-xs text-slate-500'>Best Offer</div>
            <div className='flex flex-col gap-1'>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-slate-500'>Specific</span>
                <span className='font-semibold text-slate-900'>
                  {stats.bestSpecificOffer &&
                  stats.bestSpecificOffer !== '0' ? (
                    <FormatAmount
                      amount={stats.bestSpecificOffer}
                      identifier='EGLD'
                    />
                  ) : (
                    '-'
                  )}
                </span>
              </div>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-slate-500'>Global</span>
                <span className='font-semibold text-slate-900'>
                  {stats.bestGlobalOffer && stats.bestGlobalOffer !== '0' ? (
                    <FormatAmount
                      amount={stats.bestGlobalOffer}
                      identifier='EGLD'
                    />
                  ) : (
                    '-'
                  )}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className='text-xs text-slate-500'>Volume</div>
            <div className='flex flex-col gap-1'>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-slate-500'>24h</span>
                <span className='font-semibold text-slate-900'>
                  {stats.volume24h && stats.volume24h !== '0' ? (
                    <FormatAmount amount={stats.volume24h} identifier='EGLD' />
                  ) : (
                    '-'
                  )}
                </span>
              </div>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-slate-500'>7d</span>
                <span className='font-semibold text-slate-900'>
                  {stats.volume7d && stats.volume7d !== '0' ? (
                    <FormatAmount amount={stats.volume7d} identifier='EGLD' />
                  ) : (
                    '-'
                  )}
                </span>
              </div>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-slate-500'>All time</span>
                <span className='font-semibold text-slate-900'>
                  {stats.volumeAllTime && stats.volumeAllTime !== '0' ? (
                    <FormatAmount
                      amount={stats.volumeAllTime}
                      identifier='EGLD'
                    />
                  ) : (
                    '-'
                  )}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className='text-xs text-slate-500'>Owner</div>
            <div className='text-sm font-mono text-slate-900 truncate'>
              {collection?.owner
                ? `${collection.owner.slice(0, 8)}...${collection.owner.slice(
                    -4
                  )}`
                : '-'}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Collection Actions */}
      <div className='mb-6'>
        {!showOfferForm ? (
          <div className='flex justify-end'>
            <Link
              to={`/marketplace/sell?collection=${id}`}
              className='rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 mr-2'
            >
              Sell Item
            </Link>
            <button
              onClick={() => setShowOfferForm(true)}
              className='rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'
            >
              Make Offer
            </button>
          </div>
        ) : (
          <div className='mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='font-semibold text-lg'>
                {offerNonce ? 'Make Specific Offer' : 'Make Collection Offer'}
              </h3>
              <button
                onClick={() => setShowOfferForm(false)}
                className='text-sm text-slate-500 hover:text-slate-700'
              >
                Cancel
              </button>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Offer Price
                </label>
                <div className='flex rounded-md border border-gray-300 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500'>
                  <select
                    value={selectedPaymentToken.identifier}
                    onChange={(e) => {
                      const token = auction_tokens.find(
                        (t) => t.identifier === e.target.value
                      );
                      if (token) setSelectedPaymentToken(token);
                    }}
                    className='h-10 border-0 border-r border-gray-200 bg-slate-50 py-0 pl-3 pr-8 text-gray-500 text-sm focus:ring-0 rounded-none'
                  >
                    {auction_tokens.map((t) => (
                      <option key={t.identifier} value={t.identifier}>
                        {t.token}
                      </option>
                    ))}
                  </select>
                  <input
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className='block w-full border-0 focus:ring-0 sm:text-sm h-10 px-3 outline-none'
                    placeholder='0.00'
                  />
                </div>
              </div>
              {/* Balance Display */}
              <div className='flex justify-between items-center text-xs'>
                <span
                  className={
                    hasEnoughFunds ? 'text-slate-500' : 'text-red-500 font-bold'
                  }
                >
                  {t ? t('marketplace:your_balance') : 'Your balance'}:{' '}
                  <FormatAmount
                    amount={buyerBalance.toFixed(0)}
                    identifier={selectedPaymentToken.identifier}
                  />
                </span>
                {!hasEnoughFunds && (
                  <span className='text-red-500 font-semibold'>
                    {t
                      ? t('marketplace:insufficient_funds')
                      : 'Insufficient funds'}
                  </span>
                )}
              </div>{' '}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Token Nonce (Optional)
                </label>
                <div className='text-xs text-gray-500 mb-2'>
                  Leave empty to make a global offer for ANY item in this
                  collection. Enter a number to offer for a specific item.
                </div>
                <input
                  type='number'
                  value={offerNonce}
                  onChange={(e) => setOfferNonce(e.target.value)}
                  min={0}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  placeholder='e.g. 123'
                />
                {offerNonce && nftInfo?.name && (
                  <div className='mt-3 flex gap-3 rounded-lg border bg-slate-50 p-2'>
                    <div className='h-16 w-16 overflow-hidden rounded-md bg-white border'>
                      <DisplayNft
                        nft={nftInfo}
                        variant='media-only'
                        className='h-full w-full object-cover'
                      />
                    </div>
                    <div className='flex flex-col justify-center text-sm'>
                      <div className='font-semibold text-slate-900'>
                        {nftInfo.name}
                      </div>
                      <div className='text-xs text-slate-500'>
                        {nftInfo.identifier}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {t ? t('marketplace:offer_validity') : 'Valid for (days)'}
                </label>
                <input
                  type='number'
                  value={offerDuration}
                  onChange={(e) => setOfferDuration(e.target.value)}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  min='0'
                />
              </div>
              <div className='pt-2'>
                {offerNonce ? (
                  <ActionMakeOffer
                    nftIdentifier={id}
                    nftNonce={parseInt(offerNonce)}
                    paymentToken={selectedPaymentToken.identifier}
                    offerPrice={new BigNumber(offerPrice || '0')
                      .shiftedBy(selectedPaymentToken.decimals)
                      .toFixed(0)}
                    deadline={
                      parseInt(offerDuration) === 0
                        ? 0
                        : Math.floor(Date.now() / 1000) +
                          (parseInt(offerDuration) || 1) * 86400
                    }
                    label={`Offer for #${offerNonce}`}
                    disabled={
                      !offerPrice ||
                      parseFloat(offerPrice) <= 0 ||
                      !hasEnoughFunds
                    }
                  />
                ) : (
                  <ActionMakeGlobalOffer
                    collectionIdentifier={id}
                    nftAmount={1}
                    paymentToken={selectedPaymentToken.identifier}
                    offerPrice={new BigNumber(offerPrice || '0')
                      .shiftedBy(selectedPaymentToken.decimals)
                      .toFixed(0)}
                    deadline={
                      parseInt(offerDuration) === 0
                        ? 0
                        : Math.floor(Date.now() / 1000) +
                          (parseInt(offerDuration) || 1) * 86400
                    }
                    label='Make Global Offer'
                    disabled={
                      !offerPrice ||
                      parseFloat(offerPrice) <= 0 ||
                      !hasEnoughFunds
                    }
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs - Segmented Control */}
      <div className='mb-6'>
        <div className='inline-flex rounded-lg bg-slate-100 p-1'>
          <button
            onClick={() => setActiveTab('listings')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'listings'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Listings
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'offers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Offers
            {offersData && offersData.offers.length > 0 && (
              <span
                className={`flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] ${
                  activeTab === 'offers'
                    ? 'bg-slate-100 text-slate-900'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {offersData.offers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'activity'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Activity
          </button>
        </div>
      </div>

      {activeTab === 'listings' && (
        <Card id='listings'>
          <CardHeader className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
            <div className='flex flex-wrap items-center gap-2'>
              {/* Sale Type Filter */}
              <div className='inline-flex rounded-md border overflow-hidden'>
                <button
                  onClick={() => setSaleType('all')}
                  className={`px-3 h-9 text-sm transition ${
                    saleType === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSaleType('fixed')}
                  className={`px-3 h-9 text-sm transition ${
                    saleType === 'fixed'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  Buy Now
                </button>
                <button
                  onClick={() => setSaleType('auction')}
                  className={`px-3 h-9 text-sm transition ${
                    saleType === 'auction'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  Auctions
                </button>
              </div>

              {/* Search */}
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='Search by token ID or nonce...'
                className='h-9 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400 w-64'
              />

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className='h-9 rounded-md border bg-white px-3 text-sm'
              >
                <option value='newest'>Newest</option>
                <option value='priceAsc'>Price ↑</option>
                <option value='priceDesc'>Price ↓</option>
                <option value='endingSoon'>Ending soon</option>
              </select>
            </div>

            <div className='text-sm text-slate-500'>
              {filteredAuctions.length} listing
              {filteredAuctions.length !== 1 ? 's' : ''}
            </div>
          </CardHeader>

          {/* Grid */}
          <CardContent>
            {auctionsLoading && page === 1 ? (
              <div className='py-16 text-center text-sm text-slate-500'>
                Loading listings...
              </div>
            ) : filteredAuctions.length === 0 ? (
              <div className='py-16 text-center text-sm text-slate-500'>
                No listings found for this collection.
              </div>
            ) : (
              <>
                <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'>
                  {filteredAuctions.map((auction: any) => (
                    <Auction
                      key={auction.auction_id?.toString() || Math.random()}
                      auction={auction}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {(hasMore || page > 1) && (
                  <div className='mt-6 flex items-center justify-center gap-2'>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className='h-9 px-4 rounded-md border bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                    >
                      Previous
                    </button>
                    <span className='text-sm text-slate-600'>Page {page}</span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!hasMore}
                      className='h-9 px-4 rounded-md border bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'offers' && (
        <Card id='offers'>
          <CardHeader>
            <div className='font-semibold'>Offers</div>
          </CardHeader>
          <CardContent>
            {offersLoading ? (
              <div className='py-16 text-center text-sm text-slate-500'>
                Loading offers...
              </div>
            ) : !offersData || offersData.offers.length === 0 ? (
              <div className='py-16 text-center text-sm text-slate-500'>
                No active offers found.
              </div>
            ) : (
              // Use total_count for pagination logic if needed, simplify for now
              <>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm text-left'>
                    <thead className='text-slate-500 border-b'>
                      <tr>
                        <th className='py-3 pr-4'>Type</th>
                        <th className='py-3 pr-4'>Item</th>
                        <th className='py-3 pr-4'>Price</th>
                        <th className='py-3 pr-4'>Expires</th>
                        <th className='py-3 pr-4'>From</th>
                        <th className='py-3 pr-4'>Status</th>
                        <th className='py-3'>Action</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      {offersData.offers.map((offer) => {
                        const isGlobal =
                          !offer.offerTokenNonce || offer.offerTokenNonce === 0;
                        const deadlineDate = new Date(offer.deadline);
                        const deadlineMs = deadlineDate.getTime();
                        const isExpired =
                          deadlineMs > 0 && Date.now() > deadlineMs;

                        return (
                          <tr key={offer.id}>
                            <td className='py-3 pr-4'>
                              <Badge tone={isGlobal ? 'brand' : 'neutral'}>
                                {isGlobal
                                  ? 'Collection Offer'
                                  : 'Specific Offer'}
                              </Badge>
                            </td>
                            <td className='py-3 pr-4 flex items-center gap-2'>
                              {!isGlobal && (
                                <div className='h-8 w-8 overflow-hidden rounded bg-slate-100 border'>
                                  <DisplayNftByToken
                                    tokenIdentifier={offer.offerTokenIdentifier}
                                    nonce={offer.offerTokenNonce.toString()}
                                    variant='media-only'
                                    className='h-full w-full object-cover'
                                  />
                                </div>
                              )}
                              <a
                                href={`${network.explorerAddress}/nfts/${
                                  offer.offerTokenIdentifier
                                }${
                                  !isGlobal
                                    ? `-${bigToHex(
                                        BigInt(offer.offerTokenNonce)
                                      )}`
                                    : ''
                                }`}
                                target='_blank'
                                rel='noreferrer'
                                className='font-medium hover:underline hover:text-indigo-600'
                              >
                                {offer.offerTokenIdentifier}
                              </a>
                              {!isGlobal && (
                                <span className='text-slate-500'>
                                  #{offer.offerTokenNonce}
                                </span>
                              )}
                            </td>
                            <td className='py-3 pr-4 font-semibold'>
                              <FormatAmount
                                amount={offer.paymentAmount}
                                identifier={offer.paymentTokenIdentifier}
                              />
                            </td>
                            <td className='py-3 pr-4 text-slate-500'>
                              {deadlineMs > 0
                                ? deadlineDate.toLocaleDateString()
                                : t
                                ? t('marketplace:infinite')
                                : 'Infinite'}
                              ?
                              {isExpired && (
                                <span className='text-red-500 text-xs ml-1'>
                                  (Expired)
                                </span>
                              )}
                            </td>
                            <td className='py-3 pr-4'>
                              {offer.owner ? (
                                <ShortenedAddress
                                  address={offer.owner.address}
                                />
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className='py-3 pr-4'>
                              {isExpired ? (
                                <Badge>Expired</Badge>
                              ) : (
                                <Badge tone='brand'>Active</Badge>
                              )}
                            </td>
                            <td className='py-3'>
                              {offer.owner?.address === address ? (
                                <ActionWithdrawOffer
                                  offerId={offer.id}
                                  label='Withdraw'
                                />
                              ) : (
                                <>
                                  {!isGlobal && !isExpired && (
                                    <ActionAcceptOffer
                                      offerId={offer.id}
                                      offerNonce={1}
                                      nftIdentifier={offer.offerTokenIdentifier}
                                      nftNonce={offer.offerTokenNonce}
                                      label='Accept'
                                    />
                                  )}
                                  {isGlobal && !isExpired && (
                                    <button
                                      onClick={() =>
                                        setSelectedOfferForWallet(offer.id)
                                      }
                                      className='text-xs text-indigo-600 hover:text-indigo-800 font-medium underline'
                                    >
                                      Select in Wallet
                                    </button>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination for Offers */}
                <div className='mt-6 flex items-center justify-center gap-2'>
                  <button
                    onClick={() => setOffersPage((p) => Math.max(1, p - 1))}
                    disabled={offersPage === 1}
                    className='h-9 px-4 rounded-md border bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                  >
                    Previous
                  </button>
                  <span className='text-sm text-slate-600'>
                    Page {offersPage}
                  </span>
                  <button
                    onClick={() => setOffersPage((p) => p + 1)}
                    disabled={offersData.offers.length < 20} // Simple check
                    className='h-9 px-4 rounded-md border bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card id='activity'>
          <CardHeader>
            <div className='font-semibold'>Activity</div>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className='py-16 text-center text-sm text-slate-500'>
                Loading activity...
              </div>
            ) : !activityData?.length ? (
              <div className='py-16 text-center text-sm text-slate-500'>
                No activity found.
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                  <thead className='text-slate-500 border-b'>
                    <tr>
                      <th className='py-3 pr-4'>Event</th>
                      <th className='py-3 pr-4'>Item</th>
                      <th className='py-3 pr-4'>Price</th>
                      <th className='py-3 pr-4'>From</th>
                      <th className='py-3 pr-4'>To</th>
                      <th className='py-3'>Date</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {activityData.map((event) => (
                      <tr key={event.txHash + event.nonce}>
                        <td className='py-3 pr-4'>
                          <Badge
                            tone={
                              event.eventType.includes('buy')
                                ? 'brand'
                                : 'neutral'
                            }
                          >
                            {event.eventType
                              .replace('_event', '')
                              .replace('_', ' ')
                              .toUpperCase()}
                          </Badge>
                        </td>
                        <td className='py-3 pr-4 flex items-center gap-2'>
                          {event.nonce === 0 ? (
                            <span className='font-medium text-slate-500 italic'>
                              Global Offer
                            </span>
                          ) : (
                            <>
                              <div className='h-8 w-8 overflow-hidden rounded bg-slate-100 border'>
                                <DisplayNftByToken
                                  tokenIdentifier={event.collection}
                                  nonce={event.nonce.toString()}
                                  variant='media-only'
                                  className='h-full w-full object-cover'
                                />
                              </div>
                              <span className='font-medium'>
                                {event.collection} #{event.nonce}
                              </span>
                            </>
                          )}
                        </td>
                        <td className='py-3 pr-4 font-semibold'>
                          {event.price && event.price !== '0' ? (
                            <FormatAmount
                              amount={event.price}
                              identifier={event.paymentToken || 'EGLD'}
                            />
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className='py-3 pr-4'>
                          {event.seller ? (
                            <ShortenedAddress address={event.seller} />
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className='py-3 pr-4'>
                          {event.buyer ? (
                            <ShortenedAddress address={event.buyer} />
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className='py-3 text-slate-500'>
                          <a
                            href={`${network.explorerAddress}/transactions/${
                              event.txHash.split('-')[0]
                            }`}
                            target='_blank'
                            rel='noreferrer'
                            className='hover:underline hover:text-indigo-600'
                          >
                            {new Date(event.timestamp).toLocaleString()}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Pagination for Activity */}
            {activityData && activityData.length > 0 && (
              <div className='mt-6 flex items-center justify-center gap-2'>
                <button
                  onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                  disabled={activityPage === 1}
                  className='h-9 px-4 rounded-md border bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                >
                  Previous
                </button>
                <span className='text-sm text-slate-600'>
                  Page {activityPage}
                </span>
                <button
                  onClick={() => setActivityPage((p) => p + 1)}
                  disabled={!activityData || activityData.length < 20}
                  className='h-9 px-4 rounded-md border bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                >
                  Next
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Select In Wallet Modal */}
      {selectedOfferForWallet && offersData?.offers && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col'>
            <div className='p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10'>
              <h3 className='text-lg font-semibold'>Select Asset to Sell</h3>
              <button
                onClick={() => setSelectedOfferForWallet(null)}
                className='text-slate-500 hover:text-slate-700'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <line x1='18' y1='6' x2='6' y2='18' />
                  <line x1='6' y1='6' x2='18' y2='18' />
                </svg>
              </button>
            </div>

            <div className='p-6 overflow-y-auto'>
              {!userNfts ? (
                <div className='text-center py-10 text-slate-500'>
                  Loading your assets...
                </div>
              ) : userNfts.length === 0 ? (
                <div className='text-center py-10 text-slate-500'>
                  <div>You don't own any assets required for this offer.</div>
                  <div className='text-xs mt-2 text-slate-400'>({id})</div>
                </div>
              ) : (
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                  {userNfts.map((nft) => {
                    // Find offer data to pass to Action
                    const currentOffer = offersData.offers.find(
                      (o) => o.id === selectedOfferForWallet
                    );
                    // Should we filter out NFTs that are already listed or does contract handle it?
                    // Contract will fail if not owner or if locked.
                    // For simplicity, list all.

                    return (
                      <div
                        key={nft.identifier}
                        className='border rounded-xl p-3 hover:border-indigo-500 transition-colors cursor-pointer group'
                      >
                        <div className='aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2 relative'>
                          <DisplayNft
                            nft={nft}
                            className='w-full h-full object-cover'
                          />
                          <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                            {currentOffer && (
                              <ActionAcceptOffer
                                offerId={selectedOfferForWallet}
                                offerNonce={currentOffer?.offerTokenNonce || 0}
                                nftIdentifier={nft.collection}
                                nftNonce={nft.nonce || 0}
                                label='Sell Now'
                              />
                            )}
                          </div>
                        </div>
                        <div className='text-sm font-medium truncate'>
                          {nft.name}
                        </div>
                        <div className='text-xs text-slate-500'>
                          #{nft.nonce}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
