import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Breadcrumb } from 'components/ui/Breadcrumb';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useGetCollections } from 'helpers/api/getCollections';
import { useGetAuctionsPaginated } from 'contracts/dinauction/helpers/useGetAuctionsPaginated';
import { useGetOffers } from 'helpers/api/useGetOffers';
import {
  useGetCollectionStats,
  getBestStat
} from 'helpers/api/useGetCollectionStats';
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
import { PageTemplate } from 'components/PageTemplate';
import { NftGrid } from 'pages/CollectionDetail/NftGrid';
import {
  useGetCollectionsNfts,
  CollectionNft
} from 'helpers/api/accounts/getCollectionsNfts';
import { useLocation } from 'react-router-dom';
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
  const { hash } = useLocation();
  useLoadTranslations('marketplace');
  const { t } = useTranslation();
  const [activeTab, setActiveTabState] = useState<
    'listings' | 'offers' | 'activity' | 'collection'
  >(
    hash === '#offers'
      ? 'offers'
      : hash === '#activity'
      ? 'activity'
      : hash === '#collection'
      ? 'collection'
      : 'listings'
  );

  const setActiveTab = (
    tab: 'listings' | 'offers' | 'activity' | 'collection'
  ) => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };
  const [page, setPage] = useState(1);
  const [offersPage, setOffersPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  // Collection Tab State
  const [collectionPage, setCollectionPage] = useState(0);
  const COLLECTION_PAGE_SIZE = 100;
  const [displayedCollectionNfts, setDisplayedCollectionNfts] = useState<
    CollectionNft[]
  >([]);

  const { data: fetchedCollectionNfts, loading: collectionNftsLoading } =
    useGetCollectionsNfts(id, {
      from: collectionPage * COLLECTION_PAGE_SIZE,
      size: COLLECTION_PAGE_SIZE
    });

  React.useEffect(() => {
    if (
      activeTab === 'collection' &&
      fetchedCollectionNfts &&
      fetchedCollectionNfts.length > 0
    ) {
      setDisplayedCollectionNfts((prev) => {
        const newItems =
          collectionPage === 0
            ? fetchedCollectionNfts
            : [...prev, ...fetchedCollectionNfts];
        // Unique by identifier
        const unique = Array.from(
          new Map(newItems.map((item) => [item.identifier, item])).values()
        );
        return unique;
      });
    } else if (
      collectionPage === 0 &&
      !collectionNftsLoading &&
      activeTab === 'collection'
    ) {
      // Only reset if empty and loading is done, mainly for initial load
      if (fetchedCollectionNfts && fetchedCollectionNfts.length === 0) {
        setDisplayedCollectionNfts([]);
      }
    }
  }, [fetchedCollectionNfts, collectionPage, collectionNftsLoading, activeTab]);
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
    floorPrice: getBestStat(collectionStats?.floor?.ask),
    bestGlobalOffer:
      collectionStats?.offers?.best_global?.['EGLD'] &&
      collectionStats.offers.best_global['EGLD'] !== '0'
        ? { amount: collectionStats.offers.best_global['EGLD'], token: 'EGLD' }
        : calculatedStats.global
        ? { amount: calculatedStats.global, token: 'EGLD' }
        : getBestStat(collectionStats?.offers?.best_global),

    bestSpecificOffer:
      collectionStats?.offers?.best_specific?.['EGLD'] &&
      collectionStats.offers.best_specific['EGLD'] !== '0'
        ? {
            amount: collectionStats.offers.best_specific['EGLD'],
            token: 'EGLD'
          }
        : calculatedStats.specific
        ? { amount: calculatedStats.specific, token: 'EGLD' }
        : getBestStat(collectionStats?.offers?.best_specific),
    volume24h: getBestStat(collectionStats?.volume?.['24h']),
    volume7d: getBestStat(collectionStats?.volume?.['7d']),
    volumeAllTime: getBestStat(collectionStats?.volume?.all_time),
    floorToken: 'EGLD',
    activeListings: auctions.length // Only shows count of fetched page
  };

  return (
    <div className='mx-auto max-w-7xl px-4 pb-10'>
      <PageTemplate
        title=''
        breadcrumbItems={[
          { label: t('marketplace:home'), path: '/' },
          { label: t('marketplace:marketplace'), path: '/marketplace' },
          {
            label: t('marketplace:collections'),
            path: '/marketplace/collections'
          },
          { label: collection?.name || 'Collection' }
        ]}
      >
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
              <div className='text-xs text-slate-500'>
                {t('marketplace:floor_price')}
              </div>
              <div className='text-lg font-semibold text-slate-900'>
                {stats.floorPrice.amount ? (
                  <span>
                    <FormatAmount
                      amount={stats.floorPrice.amount}
                      identifier={stats.floorPrice.token}
                    />
                  </span>
                ) : (
                  '-'
                )}
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className='text-xs text-slate-500'>
                {t('marketplace:best_offer')}
              </div>
              <div className='flex flex-col gap-1'>
                <div className='flex justify-between items-center text-sm'>
                  <span className='text-slate-500'>
                    {t('marketplace:specific')}
                  </span>
                  <span className='font-semibold text-slate-900'>
                    {stats.bestSpecificOffer.amount ? (
                      <FormatAmount
                        amount={stats.bestSpecificOffer.amount}
                        identifier={stats.bestSpecificOffer.token}
                      />
                    ) : (
                      '-'
                    )}
                  </span>
                </div>

                <div className='flex justify-between items-center text-sm'>
                  <span className='text-slate-500'>
                    {t('marketplace:global')}
                  </span>
                  <span className='font-semibold text-slate-900'>
                    {stats.bestGlobalOffer.amount ? (
                      <FormatAmount
                        amount={stats.bestGlobalOffer.amount}
                        identifier={stats.bestGlobalOffer.token}
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
              <div className='text-xs text-slate-500'>
                {t('marketplace:volume')}
              </div>
              <div className='flex flex-col gap-1'>
                <div className='flex justify-between items-center text-sm'>
                  <span className='text-slate-500'>24h</span>
                  <span className='font-semibold text-slate-900'>
                    {stats.volume24h.amount ? (
                      <FormatAmount
                        amount={stats.volume24h.amount}
                        identifier={stats.volume24h.token}
                      />
                    ) : (
                      '-'
                    )}
                  </span>
                </div>
                <div className='flex justify-between items-center text-sm'>
                  <span className='text-slate-500'>7d</span>
                  <span className='font-semibold text-slate-900'>
                    {stats.volume7d.amount ? (
                      <FormatAmount
                        amount={stats.volume7d.amount}
                        identifier={stats.volume7d.token}
                      />
                    ) : (
                      '-'
                    )}
                  </span>
                </div>
                <div className='flex justify-between items-center text-sm'>
                  <span className='text-slate-500'>
                    {t('marketplace:all_time')}
                  </span>
                  <span className='font-semibold text-slate-900'>
                    {stats.volumeAllTime.amount ? (
                      <FormatAmount
                        amount={stats.volumeAllTime.amount}
                        identifier={stats.volumeAllTime.token}
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
              <div className='text-xs text-slate-500'>
                {t('marketplace:owner')}
              </div>
              <div className='text-sm font-mono text-slate-900 truncate'>
                <ShortenedAddress address={collection?.owner} />
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
                {t('marketplace:sell_an_item')}
              </Link>
              <button
                onClick={() => setShowOfferForm(true)}
                className='rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'
              >
                {t('marketplace:make_offer')}
              </button>
            </div>
          ) : (
            <div className='mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
              <div className='flex justify-between items-center mb-6'>
                <h3 className='font-semibold text-lg'>
                  {offerNonce
                    ? t('marketplace:make_offer_specific')
                    : t('marketplace:make_offer_collection')}
                </h3>
                <button
                  onClick={() => setShowOfferForm(false)}
                  className='text-sm text-slate-500 hover:text-slate-700'
                >
                  {t('marketplace:cancel')}
                </button>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('marketplace:offer_price')}
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
                      onChange={(e) =>
                        setOfferPrice(e.target.value.replace(',', '.'))
                      }
                      className='block w-full border-0 focus:ring-0 sm:text-sm h-10 px-3 outline-none'
                      placeholder='0.00'
                      inputMode='decimal'
                    />
                  </div>
                </div>
                {/* Balance Display */}
                <div className='flex justify-between items-center text-xs'>
                  <span
                    className={
                      hasEnoughFunds
                        ? 'text-slate-500'
                        : 'text-red-500 font-bold'
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
                    {t('marketplace:token_nonce_optional')}
                  </label>
                  <div className='text-xs text-gray-500 mb-2'>
                    {t('marketplace:token_nonce_hint')}
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
                      offerPrice={new BigNumber(
                        offerPrice?.replace(',', '.') || '0'
                      )
                        .shiftedBy(selectedPaymentToken.decimals)
                        .toFixed(0)}
                      deadline={
                        parseInt(offerDuration) === 0
                          ? 0
                          : Math.floor(Date.now() / 1000) +
                            (parseInt(offerDuration) || 1) * 86400
                      }
                      label={t('marketplace:make_offer_specific')}
                      disabled={
                        !offerPrice ||
                        parseFloat(offerPrice.replace(',', '.')) <= 0 ||
                        !hasEnoughFunds
                      }
                    />
                  ) : (
                    <ActionMakeGlobalOffer
                      label={t('marketplace:make_offer_collection')}
                      collectionIdentifier={id}
                      nftAmount={1}
                      paymentToken={selectedPaymentToken.identifier}
                      offerPrice={new BigNumber(
                        offerPrice?.replace(',', '.') || '0'
                      )
                        .shiftedBy(selectedPaymentToken.decimals)
                        .toFixed(0)}
                      deadline={
                        parseInt(offerDuration) === 0
                          ? 0
                          : Math.floor(Date.now() / 1000) +
                            (parseInt(offerDuration) || 1) * 86400
                      }
                      disabled={
                        !offerPrice ||
                        parseFloat(offerPrice.replace(',', '.')) <= 0 ||
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
              {t('marketplace:listings')}
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'offers'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t('marketplace:title_offers')}
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
              onClick={() => setActiveTab('collection')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'collection'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t('marketplace:collection') || 'Collection'}
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'activity'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t('marketplace:activity_tab')}
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
                    {t('marketplace:filter_all')}
                  </button>
                  <button
                    onClick={() => setSaleType('fixed')}
                    className={`px-3 h-9 text-sm transition ${
                      saleType === 'fixed'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {t('marketplace:buy_now')}
                  </button>
                  <button
                    onClick={() => setSaleType('auction')}
                    className={`px-3 h-9 text-sm transition ${
                      saleType === 'auction'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {t('marketplace:filter_auctions')}
                  </button>
                </div>

                {/* Search */}
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('marketplace:search_token_id_nonce')}
                  className='h-9 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400 w-64'
                />

                {/* Sort */}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className='h-9 rounded-md border bg-white px-3 text-sm'
                >
                  <option value='newest'>{t('marketplace:sort_newest')}</option>
                  <option value='priceAsc'>
                    {t('marketplace:sort_price_asc')}
                  </option>
                  <option value='priceDesc'>
                    {t('marketplace:sort_price_desc')}
                  </option>
                  <option value='endingSoon'>
                    {t('marketplace:sort_ending_soon')}
                  </option>
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
                  {t('marketplace:loading_listings')}
                </div>
              ) : filteredAuctions.length === 0 ? (
                <div className='py-16 text-center text-sm text-slate-500'>
                  {t('marketplace:no_listings_found')}
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
                        {t('marketplace:pagination_previous')}
                      </button>
                      <span className='text-sm text-slate-600'>
                        {t('marketplace:pagination_page')} {page}
                      </span>
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!hasMore}
                        className='h-9 px-4 rounded-md border bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                      >
                        {t('marketplace:pagination_next')}
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
              <div className='font-semibold'>
                {t('marketplace:title_offers')}
              </div>
            </CardHeader>
            <CardContent>
              {offersLoading ? (
                <div className='py-16 text-center text-sm text-slate-500'>
                  {t('marketplace:loading_offers')}
                </div>
              ) : !offersData || offersData.offers.length === 0 ? (
                <div className='py-16 text-center text-sm text-slate-500'>
                  {t('marketplace:no_active_offers_found')}
                </div>
              ) : (
                // Use total_count for pagination logic if needed, simplify for now
                <>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                      <thead className='text-slate-500 border-b'>
                        <tr>
                          <th className='py-3 pr-4'>
                            {t('marketplace:header_type')}
                          </th>
                          <th className='py-3 pr-4'>
                            {t('marketplace:header_item')}
                          </th>
                          <th className='py-3 pr-4'>
                            {t('marketplace:header_price')}
                          </th>
                          <th className='py-3 pr-4'>
                            {t('marketplace:header_expires')}
                          </th>
                          <th className='py-3 pr-4'>
                            {t('marketplace:header_from')}
                          </th>
                          <th className='py-3 pr-4'>
                            {t('marketplace:header_status')}
                          </th>
                          <th className='py-3'>
                            {t('marketplace:header_action')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {offersData.offers.map((offer) => {
                          const isGlobal =
                            !offer.offerTokenNonce ||
                            offer.offerTokenNonce === 0;
                          const deadlineDate = new Date(offer.deadline);
                          const deadlineMs = deadlineDate.getTime();
                          const isExpired =
                            deadlineMs > 0 && Date.now() > deadlineMs;

                          return (
                            <tr key={offer.id}>
                              <td className='py-3 pr-4'>
                                <Badge tone={isGlobal ? 'brand' : 'neutral'}>
                                  {isGlobal
                                    ? t('marketplace:offer_type_collection')
                                    : t('marketplace:offer_type_specific')}
                                </Badge>
                              </td>
                              <td className='py-3 pr-4 flex items-center gap-2'>
                                {!isGlobal && (
                                  <div className='h-8 w-8 overflow-hidden rounded bg-slate-100 border'>
                                    <DisplayNftByToken
                                      tokenIdentifier={
                                        offer.offerTokenIdentifier
                                      }
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
                                  : t('marketplace:infinite')}

                                {isExpired && (
                                  <span className='text-red-500 text-xs ml-1'>
                                    ({t('marketplace:status_expired')})
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
                                  <Badge>
                                    {t('marketplace:status_expired')}
                                  </Badge>
                                ) : (
                                  <Badge tone='brand'>
                                    {t('marketplace:status_active')}
                                  </Badge>
                                )}
                              </td>
                              <td className='py-3'>
                                {offer.owner?.address === address ? (
                                  <ActionWithdrawOffer
                                    offerId={offer.id}
                                    label={t('marketplace:action_withdraw')}
                                  />
                                ) : (
                                  <>
                                    {!isGlobal && !isExpired && (
                                      <ActionAcceptOffer
                                        offerId={offer.id}
                                        offerNonce={1}
                                        nftIdentifier={
                                          offer.offerTokenIdentifier
                                        }
                                        nftNonce={offer.offerTokenNonce}
                                        label={t('marketplace:action_accept')}
                                      />
                                    )}
                                    {isGlobal && !isExpired && (
                                      <button
                                        onClick={() =>
                                          setSelectedOfferForWallet(offer.id)
                                        }
                                        className='text-xs text-indigo-600 hover:text-indigo-800 font-medium underline'
                                      >
                                        {t(
                                          'marketplace:action_select_in_wallet'
                                        )}
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
                      {t('marketplace:pagination_previous')}
                    </button>
                    <span className='text-sm text-slate-600'>
                      {t('marketplace:pagination_page')} {offersPage}
                    </span>
                    <button
                      onClick={() => setOffersPage((p) => p + 1)}
                      disabled={offersData.offers.length < 20} // Simple check
                      className='h-9 px-4 rounded-md border bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                    >
                      {t('marketplace:pagination_next')}
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
              <div className='font-semibold'>
                {t('marketplace:activity_tab')}
              </div>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className='py-16 text-center text-sm text-slate-500'>
                  {t('marketplace:loading_activity')}
                </div>
              ) : !activityData?.length ? (
                <div className='py-16 text-center text-sm text-slate-500'>
                  {t('marketplace:no_activity_found')}
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm text-left'>
                    <thead className='text-slate-500 border-b'>
                      <tr>
                        <th className='py-3 pr-4'>
                          {t('marketplace:header_event')}
                        </th>
                        <th className='py-3 pr-4'>
                          {t('marketplace:header_item')}
                        </th>
                        <th className='py-3 pr-4'>
                          {t('marketplace:header_price')}
                        </th>
                        <th className='py-3 pr-4'>
                          {t('marketplace:header_from')}
                        </th>
                        <th className='py-3 pr-4'>
                          {t('marketplace:header_to')}
                        </th>
                        <th className='py-3'>{t('marketplace:header_date')}</th>
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
                                {t('marketplace:activity_global_offer')}
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
                    {t('marketplace:pagination_previous')}
                  </button>
                  <span className='text-sm text-slate-600'>
                    {t('marketplace:pagination_page')} {activityPage}
                  </span>
                  <button
                    onClick={() => setActivityPage((p) => p + 1)}
                    disabled={!activityData || activityData.length < 20}
                    className='h-9 px-4 rounded-md border bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                  >
                    {t('marketplace:pagination_next')}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'collection' && (
          <div className='mt-6'>
            <Card id='collection'>
              <CardHeader>
                <NftGrid nfts={displayedCollectionNfts} />

                {/* Load More Button */}
                {fetchedCollectionNfts &&
                  fetchedCollectionNfts.length === COLLECTION_PAGE_SIZE && (
                    <div className='flex justify-center mt-8'>
                      <button
                        onClick={() => setCollectionPage((p) => p + 1)}
                        disabled={collectionNftsLoading}
                        className='group relative flex items-center justify-center space-x-3 rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors'
                      >
                        {collectionNftsLoading ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  )}
                {collectionNftsLoading && collectionPage > 0 && (
                  <div className='text-center mt-2'>Loading more NFTs...</div>
                )}
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Select In Wallet Modal */}
        {selectedOfferForWallet && offersData?.offers && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
            <div className='w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col'>
              <div className='p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10'>
                <h3 className='text-lg font-semibold'>
                  {t('marketplace:modal_select_asset_title')}
                </h3>
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
                    {t('marketplace:loading_assets')}
                  </div>
                ) : userNfts.length === 0 ? (
                  <div className='text-center py-10 text-slate-500'>
                    <div>{t('marketplace:no_assets_owned')}</div>
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
                                  offerNonce={
                                    currentOffer?.offerTokenNonce || 0
                                  }
                                  nftIdentifier={nft.collection}
                                  nftNonce={nft.nonce || 0}
                                  label={t('marketplace:action_sell_now')}
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
      </PageTemplate>
    </div>
  );
};
