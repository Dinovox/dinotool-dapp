import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetCollectionBranding } from 'helpers/api/useGetCollectionBranding';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useGetFullAuctionData } from 'contracts/dinauction/helpers/useGetFullAuctionData';
import { useGetNftInformations } from 'pages/LotteryList/Transaction/helpers/useGetNftInformation';
import { DisplayNft } from 'helpers/DisplayNft';
import { useGetUserNFT, type UserNft } from 'helpers/useGetUserNft';
import { ActionBid } from 'contracts/dinauction/actions/Bid';
import { ActionBuySft } from 'contracts/dinauction/actions/ActionBuySft';
import { ActionWithdraw } from 'contracts/dinauction/actions/Withdraw';
import { ActionEndAuction } from 'contracts/dinauction/actions/EndAuction';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import BigNumber from 'bignumber.js';
import {
  useGetEsdtInformations,
  FormatAmount
} from 'helpers/api/useGetEsdtInformations';
import { useGetOffers, Offer } from 'helpers/api/useGetOffers';
import { ActionAcceptOffer } from 'contracts/dinauction/actions/AcceptOffer';
import { ActionMakeOffer } from 'contracts/dinauction/actions/MakeOffer';
import { ActionWithdrawOffer } from 'contracts/dinauction/actions/WithdrawOffer';
import { ActionWithdrawAuctionAndAccept } from 'contracts/dinauction/actions/WithdrawAuctionAndAccept';
import { useGetAccount, useGetNetworkConfig } from 'lib';
import { useGetMarketplaceActivity } from 'helpers/api/useGetMarketplaceActivity';
import { Breadcrumb } from 'components/ui/Breadcrumb';
import { useGetNftActivity } from './hooks/useGetNftActivity';
import ShortenedAddress from 'helpers/shortenedAddress';
import { useGetAuctionsPaginated } from 'contracts/dinauction/helpers/useGetAuctionsPaginated';
import DisplayNftByToken from 'helpers/DisplayNftByToken';
import bigToHex from 'helpers/bigToHex';
import { dinoclaim_api, auction_tokens } from 'config';
import { PageTemplate } from 'components/PageTemplate';

/* ---------------- Types ---------------- */
type MarketSource = 'dinovox' | 'xoxno';
type SaleType = 'fixed' | 'auction';
type TokenAmount = { ticker: string; amount: string; decimals: number };

type Bid = {
  id: string;
  bidder: string;
  amount: TokenAmount;
  time: number;
};

type Listing = {
  id: string; // Listing ID
  source: MarketSource;
  saleType: SaleType;
  identifier: string; // NFT identifier
  collection: string; // NFT collection
  name: string;
  images: string[]; // gallery
  seller: string; // Original owner of the NFT (original_owner in contract)
  price?: TokenAmount; // for fixed price listings
  auction?: {
    auctionId: string; // Corresponds to auction_id from the contract
    auctionType: any; // Corresponds to auction_type (can be object { name: '...' } or string)
    startPrice: BigNumber; // Corresponds to min_bid
    minBid: BigNumber; // Alias for startPrice/min_bid
    currentBid: BigNumber; // Corresponds to current_bid
    maxBid: BigNumber; // Corresponds to max_bid
    minBidDiff: BigNumber; // Corresponds to min_bid_diff
    paymentNonce: number; // Corresponds to payment_nonce
    startTime: number; // Corresponds to start_time
    endTime: number; // Corresponds to deadline
    currentWinner: string; // Corresponds to current_winner (ManagedAddress)
    marketplaceCutPercentage: string; // Corresponds to marketplace_cut_percentage (BigUint as percentage string)
    creatorRoyaltiesPercentage: string; // Corresponds to creator_royalties_percentage (BigUint as percentage string)
    bidsCount: number; // Retained from original type
    history: Bid[]; // Retained from original type
    auctionedTokens: any; // Raw token struct
  };
  attributes?: Array<{ trait: string; value: string }>;
  status: 'active' | 'sold' | 'cancelled' | 'ended';
  createdAt: number;
  description?: string;
  isCached?: boolean;
};

/* ---------------- Utils ---------------- */
const fmt = (t?: TokenAmount) => (t ? `${t.amount} ${t.ticker}` : '-');

function useCountdown(endTime?: number) {
  const { t } = useTranslation();
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (!endTime) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (!endTime) return '—';
  if (endTime > 32503680000000) return t('marketplace:infinite');

  const left = Math.max(0, endTime - now);
  const s = Math.floor(left / 1000);
  const d = Math.floor(s / (3600 * 24));
  const h = Math.floor((s % (3600 * 24)) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}

/* ---------------- Minimal UI bits ---------------- */
const Badge = ({
  children,
  tone = 'neutral' as 'neutral' | 'brand'
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand';
}) => {
  const cls =
    tone === 'brand'
      ? 'bg-indigo-50 text-indigo-700 ring-indigo-700/10'
      : 'bg-gray-50 text-gray-600 ring-gray-500/10';
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {children}
    </span>
  );
};
const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className = ''
}) => (
  <div
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

/* ---------------- Activity Tab Component ---------------- */
const ActivityTab = ({
  collection,
  nonce,
  auctionId
}: {
  collection?: string;
  nonce?: number;
  auctionId?: string;
}) => {
  const { t } = useTranslation();
  const { network } = useGetNetworkConfig();
  const [page, setPage] = useState(1);
  const { data: activityData, loading: activityLoading } =
    useGetMarketplaceActivity({
      collection,
      nonce,
      auctionId,
      page,
      limit: 20
    });

  if (activityLoading) {
    return (
      <div className='py-8 text-center text-sm text-slate-500'>
        {t ? t('marketplace:loading_activity') : 'Loading activity...'}
      </div>
    );
  }

  if (!activityData || activityData.length === 0) {
    return (
      <div className='py-8 text-center text-sm text-slate-500'>
        {t ? t('marketplace:no_activity') : 'No activity found.'}
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm text-left'>
          <thead className='text-slate-500 border-b'>
            <tr>
              <th className='py-3 pr-4'>
                {t ? t('marketplace:activity_event') : 'Event'}
              </th>
              <th className='py-3 pr-4'>
                {t ? t('marketplace:activity_price') : 'Price'}
              </th>
              <th className='py-3 pr-4'>
                {t ? t('marketplace:activity_from') : 'From'}
              </th>
              <th className='py-3 pr-4'>
                {t ? t('marketplace:activity_to') : 'To'}
              </th>
              <th className='py-3'>
                {t ? t('marketplace:activity_date') : 'Date'}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {activityData.map((event) => (
              <tr key={event.txHash + event.nonce}>
                <td className='py-3 pr-4'>
                  <Badge
                    tone={event.eventType.includes('buy') ? 'brand' : 'neutral'}
                  >
                    {event.eventType
                      .replace('_event', '')
                      .replace('_', ' ')
                      .toUpperCase()}
                  </Badge>
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
      {/* Pagination */}
      {activityData.length > 0 && (
        <div className='flex items-center justify-center gap-2'>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className='h-8 px-3 rounded-md border bg-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
          >
            {t ? t('marketplace:previous') : 'Previous'}
          </button>
          <span className='text-xs text-slate-600'>
            {t ? t('marketplace:page') : 'Page'} {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={activityData.length < 20}
            className='h-8 px-3 rounded-md border bg-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
          >
            {t ? t('marketplace:next') : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
};

/* ---------------- Page ---------------- */
export const MarketplaceListingDetail = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { address, balance } = useGetAccount();
  useLoadTranslations('marketplace');
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { network } = useGetNetworkConfig();
  const tab = (searchParams.get('tab') || 'details') as
    | 'details'
    | 'bids'
    | 'activity';

  const [qty, setQty] = React.useState('1'); // for fixed buy (1/1 NFTs -> juste cosmétique)
  const [bidAmount, setBidAmount] = React.useState('');
  const [isManualBid, setIsManualBid] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Offer State
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerPaymentToken, setOfferPaymentToken] = useState(
    auction_tokens[0]?.identifier || 'EGLD'
  );
  const [offerDuration, setOfferDuration] = useState('0'); // Days (0 = indeterminate)

  // Live overrides from polling
  const [liveAuctionOverrides, setLiveAuctionOverrides] = useState<{
    current_bid?: string;
    current_winner?: string;
  }>({});

  // 1. Fetch Auction Data from Contract
  const { auction: rawAuction, isLoading: loadingAuction } =
    useGetFullAuctionData(id);

  // Poll for updates
  useEffect(() => {
    if (!id) return;

    const poll = async () => {
      try {
        const response = await fetch(
          `${dinoclaim_api}/marketplace/auctions?auctionID=${id}&include_inactive=true`
        );
        const data = await response.json();
        // API returns { auctions: [...] }
        const remoteAuction =
          data.auctions && data.auctions.length > 0 ? data.auctions[0] : null;

        if (remoteAuction) {
          const remoteCurrentBid =
            remoteAuction.currentBid || remoteAuction.current_bid;
          // API returns currentWinner as object { id, address } or potentially string/snake_case in other contexts
          const remoteCurrentWinnerAddr =
            remoteAuction.currentWinner?.address ||
            remoteAuction.currentWinner ||
            remoteAuction.current_winner;

          if (remoteCurrentBid) {
            const remoteBid = new BigNumber(remoteCurrentBid);

            setLiveAuctionOverrides((prev) => {
              const currentKnown = prev.current_bid
                ? new BigNumber(prev.current_bid)
                : rawAuction?.current_bid
                ? new BigNumber(rawAuction.current_bid)
                : new BigNumber(0);

              if (remoteBid.gt(currentKnown)) {
                return {
                  current_bid: remoteCurrentBid,
                  current_winner: remoteCurrentWinnerAddr
                };
              }
              return prev;
            });
          }
        }
      } catch (e) {
        console.error('Polling error', e);
      }
    };

    const interval = setInterval(poll, 10_000);
    return () => clearInterval(interval);
  }, [id, rawAuction]);

  // 2. Extract Token Info for NFT Fetch
  const tokenIdentifier =
    rawAuction?.auctioned_tokens?.token_identifier?.toString();
  const tokenNonce =
    rawAuction?.auctioned_tokens?.token_nonce?.toString() || '0';

  // Fetch specific offers for this NFT (collection + nonce)
  const collectionId = tokenIdentifier
    ? tokenIdentifier.split('-').slice(0, 2).join('-')
    : undefined;

  const { data: offersData } = useGetOffers({
    collection: collectionId,
    nonce: tokenNonce ? parseInt(tokenNonce).toString() : undefined, // Ensure clean number-string
    limit: 10,
    enabled: !!collectionId
  });

  // 2.1 Fetch Collection Branding
  const { branding: collectionBranding } = useGetCollectionBranding(
    collectionId || ''
  );

  // 3. Fetch NFT Data from API
  const nftInfo: any = useGetNftInformations(tokenIdentifier, tokenNonce);

  // Check if user has this token in wallet
  const userOwnedTokens = useGetUserNFT(
    address,
    tokenIdentifier + '-' + bigToHex(BigInt(tokenNonce)),
    undefined,
    {
      enabled: !!address && !!tokenIdentifier,
      size: 1
    }
  );
  const userHasToken = userOwnedTokens && userOwnedTokens.length > 0;

  const paymentToken = rawAuction?.payment_token?.toString() || 'EGLD';
  const tokenInformations = useGetEsdtInformations(paymentToken);

  // Buyer Balance Check (Listing)
  const userEsdt = useGetUserESDT();
  const buyerBalance = useMemo(() => {
    if (!address) return new BigNumber(0);
    if (paymentToken === 'EGLD') {
      return new BigNumber(balance || 0); // useGetAccount returns balance directly
    }
    const token = userEsdt.find(
      (item: any) => item.identifier === paymentToken
    );
    return new BigNumber(token?.balance || 0);
  }, [address, paymentToken, userEsdt, balance]);

  const hasEnoughFunds = (amount: BigNumber | string) => {
    const cost = new BigNumber(amount);
    return buyerBalance.gte(cost);
  };

  // Offer Logic: Token Decimals & Balance
  const offerTokenDecimals = useMemo(() => {
    const t = auction_tokens.find((t) => t.identifier === offerPaymentToken);
    return t?.decimals || 18;
  }, [offerPaymentToken]);

  const offerBuyerBalance = useMemo(() => {
    if (!address) return new BigNumber(0);
    if (offerPaymentToken === 'EGLD') {
      return new BigNumber(balance || 0);
    }
    const token = userEsdt.find(
      (item: any) => item.identifier === offerPaymentToken
    );
    return new BigNumber(token?.balance || 0);
  }, [address, offerPaymentToken, userEsdt, balance]);

  const hasEnoughFundsForOffer = (amount: BigNumber | string) => {
    const cost = new BigNumber(amount);
    return offerBuyerBalance.gte(cost);
  };

  // 4. Normalize Data
  const listing: Listing | null = useMemo(() => {
    if (!rawAuction) {
      // Try to get from cache if not found in contract
      const cached = localStorage.getItem(`listing_cache_${id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Rehydrate BigNumbers
          if (parsed.auction) {
            parsed.auction.startPrice = new BigNumber(
              parsed.auction.startPrice
            );
            parsed.auction.currentBid = new BigNumber(
              parsed.auction.currentBid
            );
            parsed.auction.maxBid = new BigNumber(parsed.auction.maxBid);
            parsed.auction.minBidDiff = new BigNumber(
              parsed.auction.minBidDiff
            );
          }
          // Mark as ended/cached
          parsed.status = 'ended';
          parsed.isCached = true;
          return parsed;
        } catch (e) {
          console.error('Failed to parse cached listing', e);
        }
      }
      return null;
    }

    const minBid = rawAuction.min_bid?.toString() || '0';
    const currentBidAmount =
      liveAuctionOverrides.current_bid?.toString() ||
      rawAuction.current_bid?.toString();
    const endTime = Number(rawAuction.deadline || 0) * 1000;
    const startTime = Number(rawAuction.start_time || 0) * 1000;
    const seller = rawAuction.original_owner?.toString() || '';

    // NFT Metadata
    const name = nftInfo?.name || `${tokenIdentifier} #${tokenNonce}`;
    const images =
      nftInfo?.media?.map((m: any) => m.url) || [nftInfo?.url].filter(Boolean);
    if (images.length === 0)
      images.push('https://placehold.co/512/png?text=No+Image');

    const attributes = nftInfo?.attributes
      ? // Handle different attribute formats if needed, assuming array of objects or string
        Array.isArray(nftInfo.attributes)
        ? nftInfo.attributes
        : []
      : [];

    const description =
      nftInfo?.metadata?.description || 'No description provided.';
    const collection =
      nftInfo?.collection || tokenIdentifier?.split('-')[0] || 'Unknown';

    const listingData: Listing = {
      id: id,
      source: 'dinovox', // Contract is always dinovox for now
      saleType:
        rawAuction.auction_type?.name === 'SftOnePerPayment'
          ? 'fixed'
          : 'auction',
      identifier: tokenIdentifier || 'Unknown',
      collection,
      name,
      images,
      seller,
      price: {
        ticker: paymentToken,
        amount: minBid,
        decimals: tokenInformations?.decimals || 18
      },
      auction: {
        auctionId: rawAuction.auction_id?.toString() || id,
        auctionType: rawAuction.auction_type, // Pass raw type!
        startPrice: new BigNumber(minBid),
        minBid: new BigNumber(minBid),
        currentBid: currentBidAmount
          ? new BigNumber(currentBidAmount)
          : new BigNumber(0),
        maxBid: rawAuction.max_bid
          ? new BigNumber(rawAuction.max_bid.toString())
          : new BigNumber(0),
        minBidDiff: new BigNumber(rawAuction.min_bid_diff?.toString() || '0'),
        paymentNonce: Number(rawAuction.payment_nonce || 0),
        startTime,
        endTime,
        currentWinner:
          liveAuctionOverrides.current_winner?.toString() ||
          rawAuction.current_winner?.toString() ||
          '',
        marketplaceCutPercentage:
          rawAuction.marketplace_cut_percentage?.toString() || '0',
        creatorRoyaltiesPercentage:
          rawAuction.creator_royalties_percentage?.toString() || '0',
        bidsCount: 0, // TODO: Fetch bids count if available or calculate from history
        history: [], // TODO: Fetch bid history if available
        auctionedTokens: rawAuction.auctioned_tokens // Pass raw tokens
      },
      status: Date.now() > endTime ? 'ended' : 'active',
      createdAt: startTime,
      attributes,
      description
    };
    return listingData;
  }, [
    rawAuction,
    nftInfo,
    id,
    tokenIdentifier,
    tokenNonce,
    paymentToken,
    tokenInformations,
    liveAuctionOverrides
  ]);

  // Cache listing when available
  useEffect(() => {
    if (listing && !listing.isCached) {
      localStorage.setItem(`listing_cache_${id}`, JSON.stringify(listing));
    }
  }, [listing, id]);

  const loading =
    loadingAuction || (!listing && tokenIdentifier && !nftInfo?.identifier);

  const timeLeft = useCountdown(listing?.auction?.endTime);

  // Construct active NFT object for DisplayNft
  const activeNft = useMemo(() => {
    if (!listing) return null;
    return {
      ...nftInfo
    } as UserNft;
  }, [listing, nftInfo]);

  // Calculate the minimum required bid for validation
  const validationMinBid = useMemo(() => {
    if (!listing?.auction || !tokenInformations) return null;
    const minDiff = listing.auction.minBidDiff;
    const startPrice = listing.auction.startPrice;
    const currentBid = listing.auction.currentBid;

    if (currentBid.isZero()) {
      return startPrice;
    }

    if (minDiff.isZero()) {
      // If minDiff is zero, the bid must be strictly greater than currentBid.
      // To enforce this with a `lt(validationMinBid)` check, validationMinBid should be
      // currentBid + smallest possible increment (1 unit of the token).
      const smallestIncrement = new BigNumber(1).shiftedBy(
        -(tokenInformations?.decimals || 0)
      );
      return currentBid.plus(smallestIncrement);
    }

    return currentBid.plus(minDiff);
  }, [listing, tokenInformations]);

  // Calculate the suggested bid for auto-filling the input
  const suggestedNextBid = useMemo(() => {
    if (!listing?.auction) return null;
    const minDiff = listing.auction.minBidDiff;
    const startPrice = listing.auction.startPrice;
    const currentBid = listing.auction.currentBid;

    if (currentBid.isZero()) {
      return startPrice;
    }

    if (minDiff.isZero()) {
      // If minDiff is zero, suggest current bid + 1%
      return currentBid.multipliedBy(1.01);
    }
    return currentBid.plus(minDiff);
  }, [listing]);

  useEffect(() => {
    if (suggestedNextBid && listing?.auction && tokenInformations?.decimals) {
      const decimals = tokenInformations.decimals;
      // Convert from smallest unit to human-readable format
      const humanReadable = suggestedNextBid.shiftedBy(-decimals);
      // Format with appropriate decimal places (max 8 for display)
      const formatted = humanReadable
        .decimalPlaces(Math.min(decimals, 8))
        .toString();

      // Update if:
      // 1. User hasn't manually edited the field (!isManualBid)
      // 2. OR field is empty
      // 3. OR field has very long unformatted value (initial load artifact)
      if (
        !isManualBid ||
        bidAmount === '' ||
        (bidAmount.length > 15 && !bidAmount.includes('.'))
      ) {
        setBidAmount(formatted);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedNextBid, listing, tokenInformations, isManualBid]);

  if (loading) {
    return (
      <div className='mx-auto max-w-7xl px-4 py-10'>
        <div className='h-6 w-40 animate-pulse rounded bg-slate-200 mb-6' />
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='aspect-square lg:aspect-[4/3] rounded-2xl bg-slate-100 animate-pulse' />
          <div className='space-y-3'>
            <div className='h-8 w-2/3 rounded bg-slate-200 animate-pulse' />
            <div className='h-4 w-1/2 rounded bg-slate-200 animate-pulse' />
            <div className='h-24 w-full rounded-2xl bg-slate-100 animate-pulse' />
          </div>
        </div>
      </div>
    );
  }
  if (!listing) {
    return (
      <div className='mx-auto max-w-4xl px-4 py-16 text-center'>
        <div className='text-2xl font-semibold'>
          {t('marketplace:listing_not_found')}
        </div>
        <div className='mt-2 text-slate-600'>
          {t('marketplace:listing_not_found_desc', { id })}
        </div>
        <div className='mt-6'>
          <Link to='/marketplace/listings' className='underline'>
            {t('marketplace:back_to_listings')}
          </Link>
        </div>
      </div>
    );
  }

  const isAuction = listing.saleType === 'auction';
  const currentPrice = isAuction
    ? listing.auction?.currentBid || listing.auction?.startPrice
    : listing.price;

  const isDirectSale =
    isAuction &&
    listing.auction?.startPrice &&
    listing.auction?.maxBid &&
    listing.auction.startPrice.isEqualTo(listing.auction.maxBid);

  /* ---- Handlers (stub: à brancher à ton SDK/SC) ---- */
  const onBuyNow = () => {
    alert(
      `Buy now ${listing.identifier} x${qty} for ${fmt(listing.price)} (stub)`
    );
  };
  const onPlaceBid = () => {
    if (!bidAmount) return alert('Enter a bid amount');
    alert(`Bid ${bidAmount} ${paymentToken} on ${listing.identifier} (stub)`);
  };

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 space-y-6'>
      <PageTemplate
        title={t('marketplace:listing_detail_title', { id: listing.id })}
        breadcrumbItems={[
          { label: t('marketplace:home'), path: '/' },
          { label: t('marketplace:marketplace'), path: '/marketplace' },
          { label: t('marketplace:listings'), path: '/marketplace/listings' },
          {
            label: listing.collection,
            path: `/marketplace/collections/${listing.collection}`
          },
          { label: listing.name || listing.identifier }
        ]}
      >
        {/* Branding Banner */}
        {collectionBranding?.images?.banner && (
          <div className='relative w-full h-32 sm:h-48 rounded-2xl overflow-hidden mb-6 shadow-sm group'>
            <img
              src={collectionBranding.images.banner}
              alt='Collection Banner'
              className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-105'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80' />

            <div className='absolute bottom-4 left-4 flex items-end gap-3'>
              {collectionBranding?.images?.logo && (
                <div className='h-16 w-16 sm:h-20 sm:w-20 rounded-xl border-[3px] border-white/20 backdrop-blur-sm overflow-hidden bg-white/10 shadow-lg'>
                  <img
                    src={collectionBranding.images.logo}
                    alt='Collection Logo'
                    className='h-full w-full object-cover'
                  />
                </div>
              )}
              <div className='mb-1 text-white hidden sm:block'>
                <h2 className='text-2xl font-bold font-display tracking-tight drop-shadow-md'>
                  {collectionBranding.branding.name}
                </h2>
                {collectionBranding.branding.description && (
                  <p className='text-xs text-white/80 line-clamp-1 max-w-md drop-shadow-sm font-light'>
                    {collectionBranding.branding.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-bold text-slate-900'>
              {listing.name}
            </h1>
            {listing.status !== 'active' && (
              <Badge tone='brand'>{listing.status}</Badge>
            )}
          </div>
          <div className='flex items-center gap-2 text-sm text-slate-500'>
            <span className='font-mono'>{listing.identifier}</span>
            <span>•</span>
            <span className='capitalize'>{listing.saleType}</span>
          </div>
        </div>

        {/* Cached/Ended Banner */}
        {listing.isCached && (
          <div
            className={`rounded-lg p-4 ${
              address === listing.auction?.currentWinner
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <div className='flex items-center gap-3'>
              <div className='text-2xl'>
                {address === listing.auction?.currentWinner ? '🎉' : '⚠️'}
              </div>
              <div>
                <h3 className='font-semibold'>
                  {address === listing.auction?.currentWinner
                    ? t('marketplace:auction_won_title')
                    : t('marketplace:auction_ended_title')}
                </h3>
                <p className='text-sm opacity-90'>
                  {address === listing.auction?.currentWinner
                    ? t('marketplace:auction_won_desc')
                    : t('marketplace:auction_ended_desc')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main layout */}
        <div className='grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6'>
          {/* Left: Gallery + Tabs */}
          <div className='space-y-4'>
            {/* Gallery (aperçu large) */}
            <Card>
              <CardHeader className='p-0'>
                {activeNft && (
                  <DisplayNft
                    nft={activeNft}
                    className='aspect-[4/3] w-full rounded-t-2xl'
                  />
                )}
              </CardHeader>

              {listing.images.length > 1 && (
                <CardContent className='grid grid-cols-4 sm:grid-cols-6 gap-2'>
                  {listing.images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`aspect-square rounded-lg overflow-hidden border hover:opacity-80 ${
                        activeImageIndex === i ? 'ring-2 ring-slate-900' : ''
                      }`}
                      title={`Preview ${i + 1}`}
                    >
                      aaaa
                    </button>
                  ))}
                  <DisplayNft
                    nft={
                      {
                        name: listing.name,
                        identifier: listing.identifier,
                        collection: listing.collection,
                        media: [
                          { url: listing.images[0], fileType: 'image/png' }
                        ]
                      } as UserNft
                    }
                    variant='media-only'
                    className='h-full w-full object-cover'
                  />{' '}
                  ???
                </CardContent>
              )}
            </Card>

            {/* Tabs */}
            <div className='border-b'>
              {(['details', 'bids', 'activity'] as const).map((tabName) => (
                <button
                  key={tabName}
                  onClick={() => {
                    const s = new URLSearchParams(searchParams);
                    s.set('tab', tabName);
                    setSearchParams(s, { replace: true });
                  }}
                  className={`px-3 py-2 text-sm -mb-px border-b-2 ${
                    tab === tabName
                      ? 'border-slate-900 font-medium'
                      : 'border-transparent text-slate-500'
                  }`}
                >
                  {tabName === 'details'
                    ? t('marketplace:details_tab')
                    : tabName === 'bids'
                    ? t('marketplace:bids_tab')
                    : t('marketplace:activity_tab')}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'details' && (
              <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
                <Card>
                  <CardHeader>
                    <div className='font-semibold'>
                      {t('marketplace:description')}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-slate-700 whitespace-pre-line'>
                      {listing.description || t('marketplace:no_description')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className='font-semibold'>
                      {t('marketplace:attributes')}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {listing.attributes && listing.attributes.length ? (
                      <div className='grid grid-cols-2 gap-2'>
                        {listing.attributes.map((a: any, i) => (
                          <div key={i} className='rounded-md border p-2'>
                            <div className='text-[11px] uppercase tracking-wide text-slate-500'>
                              {a.trait_type || a.trait}
                            </div>
                            <div className='text-sm font-medium'>{a.value}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-sm text-slate-500'>
                        {t('marketplace:no_attributes')}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className='xl:col-span-2'>
                  <CardHeader>
                    <div className='font-semibold'>
                      {t('marketplace:provenance')}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className='text-sm space-y-2'>
                      <li>
                        {t('marketplace:minted_on_chain')} •{' '}
                        <DisplayNftByToken
                          tokenIdentifier={listing.identifier}
                          variant='minted-date'
                          nonce={listing.auction?.auctionedTokens?.token_nonce.toString()}
                        />
                      </li>
                      <li>
                        {t('marketplace:creator')}:{' '}
                        <ShortenedAddress address={listing.seller} />
                      </li>
                      <li>
                        Collection:{' '}
                        <Link
                          className='underline'
                          to={`/marketplace/collections/${listing.collection}`}
                        >
                          {listing.collection}
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === 'bids' && (
              <ActivityTab auctionId={listing.auction?.auctionId} />
            )}

            {tab === 'activity' && (
              <ActivityTab
                collection={listing.collection}
                nonce={parseInt(tokenNonce || '0')}
              />
            )}
          </div>

          {/* Right: Action panel */}
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='font-semibold'>
                    {t('marketplace:title_listing')}
                  </div>
                  <Badge>{listing.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Price / Current bid */}
                <div className='rounded-xl border p-4'>
                  <div className='text-xs uppercase tracking-wide text-slate-500'>
                    {isAuction && !isDirectSale
                      ? t('marketplace:current_bid')
                      : listing.auction?.auctionType?.name ===
                        'SftOnePerPayment'
                      ? t('marketplace:unit_price')
                      : t('marketplace:price')}
                  </div>
                  <div className='mt-1 text-2xl font-semibold'>
                    <FormatAmount
                      amount={
                        isAuction && !isDirectSale
                          ? listing.auction?.currentBid?.toFixed()
                          : listing.auction?.startPrice?.toFixed()
                      }
                      identifier={paymentToken}
                    />
                  </div>
                  {isAuction && !isDirectSale && (
                    <div className='mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500'>
                      {listing.auction?.startPrice && (
                        <div>
                          {t('marketplace:min_price')}{' '}
                          <FormatAmount
                            amount={listing.auction?.startPrice.toFixed()}
                            identifier={paymentToken}
                          />
                        </div>
                      )}
                      {listing.auction?.minBidDiff && (
                        <div className='flex items-center gap-1 border-l border-slate-300 pl-3'>
                          <span>
                            {t ? t('marketplace:bid_step') : 'Bid Step'}
                          </span>
                          <FormatAmount
                            amount={listing.auction.minBidDiff.toFixed()}
                            identifier={paymentToken}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {isAuction && (
                    <div className='mt-3 flex items-center gap-2 text-sm'>
                      <Badge>{t('marketplace:ends_in')}</Badge>
                      <span className='font-medium'>{timeLeft}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {/* ---------------- ACTIONS ---------------- */}

                {/* 1. SELLER: Cancel Auction (No Bids, Active) */}
                {address === listing.seller &&
                  listing.status === 'active' &&
                  (!listing.auction?.currentBid ||
                    listing.auction.currentBid.isZero() ||
                    listing.auction.auctionType?.name ===
                      'SftOnePerPayment') && (
                    <ActionWithdraw
                      auction_id={
                        new BigNumber(listing.auction?.auctionId || id)
                      }
                    />
                  )}

                {/* 2. CLAIM: End Auction (Seller OR Winner, Ended with Bids) */}
                {(address === listing.seller ||
                  address === listing.auction?.currentWinner) &&
                  listing.status === 'ended' &&
                  !listing.isCached &&
                  listing.auction?.currentBid &&
                  listing.auction.currentBid.gt(0) && (
                    <div className='flex flex-col gap-3'>
                      {address === listing.auction?.currentWinner && (
                        <div className='rounded-xl border border-green-200 bg-green-50 p-4 text-center'>
                          <div className='text-lg font-bold text-green-800 mb-1'>
                            {t('marketplace:auction_win_claim_title')}
                          </div>
                          <div className='text-sm text-green-700'>
                            {t('marketplace:auction_win_claim_desc')}
                          </div>
                        </div>
                      )}
                      <ActionEndAuction
                        auction_id={
                          new BigNumber(listing.auction?.auctionId || id)
                        }
                        label={
                          address === listing.auction?.currentWinner
                            ? 'Claim NFT'
                            : undefined
                        }
                      />
                    </div>
                  )}

                {/* 3. SELLER: Wait Message (Active with Bids) */}
                {address === listing.seller &&
                  listing.status === 'active' &&
                  listing.auction?.currentBid &&
                  listing.auction.currentBid.gt(0) &&
                  listing.auction.auctionType?.name !== 'SftOnePerPayment' && (
                    <div className='w-full rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200'>
                      {t('marketplace:auction_has_bids_warning')}
                    </div>
                  )}

                {/* 4. INACTIVE / ENDED Message (For non-participants or non-winners) */}
                {listing.status !== 'active' &&
                  !(
                    (address === listing.seller ||
                      address === listing.auction?.currentWinner) &&
                    listing.auction?.currentBid?.gt(0)
                  ) && (
                    <div className='w-full rounded-md bg-slate-50 p-3 text-sm text-slate-500 border border-slate-200'>
                      {t('marketplace:listing_not_active')}
                    </div>
                  )}

                {/* 5. BUYER ACTIONS (Active, Not Seller) */}
                {listing.status === 'active' && address !== listing.seller && (
                  <>
                    {isAuction ? (
                      <div className='space-y-3'>
                        <div className='flex items-center gap-2'>
                          {!isDirectSale && (
                            <>
                              {address === listing.auction?.currentWinner ? (
                                <div className='flex-1 rounded-md bg-green-50 p-3 text-center text-green-700 font-bold border border-green-200'>
                                  You are the current winner! 👑
                                </div>
                              ) : (
                                <>
                                  <input
                                    value={bidAmount}
                                    onChange={(e) => {
                                      setIsManualBid(true);
                                      const val = e.target.value;
                                      if (
                                        listing.auction?.maxBid &&
                                        listing.auction.maxBid.gt(0)
                                      ) {
                                        const maxVal =
                                          listing.auction.maxBid.shiftedBy(
                                            -(tokenInformations?.decimals || 0)
                                          );
                                        if (new BigNumber(val).gt(maxVal)) {
                                          setBidAmount(maxVal.toFixed());
                                          return;
                                        }
                                      }
                                      setBidAmount(val);
                                    }}
                                    placeholder={`Bid in ${paymentToken}`}
                                    inputMode='decimal'
                                    className='h-10 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                                  />

                                  <ActionBid
                                    auctionId={listing.auction?.auctionId || id}
                                    nftType={listing.identifier}
                                    nftNonce={tokenNonce || '0'}
                                    paymentToken={paymentToken}
                                    amount={new BigNumber(bidAmount || '0')
                                      .shiftedBy(
                                        tokenInformations?.decimals || 0
                                      )
                                      .toFixed(0)}
                                    disabled={
                                      !bidAmount ||
                                      parseFloat(bidAmount) <= 0 ||
                                      (validationMinBid
                                        ? new BigNumber(bidAmount)
                                            .shiftedBy(
                                              tokenInformations?.decimals || 0
                                            )
                                            .lt(validationMinBid)
                                        : false) ||
                                      !hasEnoughFunds(
                                        new BigNumber(bidAmount || '0')
                                          .shiftedBy(
                                            tokenInformations?.decimals || 0
                                          )
                                          .toFixed(0)
                                      )
                                    }
                                  />
                                </>
                              )}
                            </>
                          )}

                          {/* Direct Buy Button (if available) */}
                          {listing.auction?.maxBid &&
                            listing.auction.maxBid.gt(0) &&
                            address !== listing.auction?.currentWinner && (
                              <>
                                <ActionBid
                                  auctionId={listing.auction?.auctionId || id}
                                  nftType={listing.identifier}
                                  nftNonce={tokenNonce || '0'}
                                  paymentToken={paymentToken}
                                  amount={listing.auction.maxBid.toFixed(0)}
                                  directBuy
                                  label={
                                    <>
                                      {t('marketplace:buy_now_for_simple')}{' '}
                                      <FormatAmount
                                        amount={listing.auction.maxBid.toFixed()}
                                        identifier={paymentToken}
                                      />
                                    </>
                                  }
                                  disabled={
                                    !hasEnoughFunds(
                                      listing.auction.maxBid.toFixed(0)
                                    )
                                  }
                                />
                              </>
                            )}
                        </div>

                        {/* Consolidated Auction Status (Error + Balance) */}
                        <div className='flex justify-between items-start text-xs'>
                          <div className='flex flex-col gap-1 text-red-500 font-semibold'>
                            {/* Bid Error */}
                            {!isDirectSale &&
                              address !== listing.auction?.currentWinner &&
                              !hasEnoughFunds(
                                new BigNumber(bidAmount || '0')
                                  .shiftedBy(tokenInformations?.decimals || 0)
                                  .toFixed(0)
                              ) && (
                                <span>
                                  {t
                                    ? t('marketplace:insufficient_funds')
                                    : 'Insufficient funds'}{' '}
                                  {t
                                    ? `${t('marketplace:context_bid')}`
                                    : '(Bid)'}
                                </span>
                              )}

                            {/* Direct Buy Error */}
                            {listing.auction?.maxBid?.gt(0) &&
                              address !== listing.auction?.currentWinner &&
                              !hasEnoughFunds(
                                listing.auction.maxBid.toFixed(0)
                              ) && (
                                <span>
                                  {t
                                    ? t('marketplace:insufficient_funds')
                                    : 'Insufficient funds'}{' '}
                                  {t
                                    ? `${t('marketplace:context_buy_now')}`
                                    : '(Buy Now)'}
                                </span>
                              )}
                          </div>
                          <div className='text-slate-500'>
                            {t ? t('marketplace:your_balance') : 'Your balance'}
                            :{' '}
                            <FormatAmount
                              amount={buyerBalance.toFixed()}
                              identifier={paymentToken}
                            />
                          </div>
                        </div>

                        {/* Make Offer Section */}
                        <div className='mt-4 border-t pt-4'>
                          {!showOfferForm ? (
                            <button
                              onClick={() => setShowOfferForm(true)}
                              className='w-full rounded-md border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors'
                            >
                              {t
                                ? t('marketplace:make_offer_btn')
                                : 'Make an offer'}
                            </button>
                          ) : (
                            <div className='bg-slate-50 p-3 rounded-md space-y-3 border border-slate-200'>
                              <div className='flex justify-between items-center'>
                                <span className='text-sm font-semibold text-slate-700'>
                                  Make Offer
                                  {listing.auction?.currentBid?.gt(0) && (
                                    <span className='ml-2 text-xs font-normal text-slate-500'>
                                      (Direct Offer)
                                    </span>
                                  )}
                                </span>
                                <button
                                  onClick={() => setShowOfferForm(false)}
                                  className='text-xs text-slate-500 hover:text-red-500'
                                >
                                  {t ? t('marketplace:cancel') : 'Cancel'}
                                </button>
                              </div>
                              {/* Warning for Direct Offer on Active Auction */}
                              {listing.auction?.currentBid?.gt(0) && (
                                <div className='rounded-md bg-amber-50 p-2 text-xs text-amber-800 border border-amber-200'>
                                  {t(
                                    'marketplace:make_offer_active_auction_warning'
                                  )}
                                </div>
                              )}
                              <div>
                                <div className='flex justify-between items-center mb-1'>
                                  <label className='block text-xs text-slate-500'>
                                    {t ? t('marketplace:price') : 'Price'}
                                  </label>
                                  <select
                                    value={offerPaymentToken}
                                    onChange={(e) =>
                                      setOfferPaymentToken(e.target.value)
                                    }
                                    className='text-xs border-none bg-transparent outline-none font-semibold text-indigo-600 focus:ring-0 cursor-pointer pr-4 hover:text-indigo-800'
                                  >
                                    {auction_tokens.map((t) => (
                                      <option
                                        key={t.identifier}
                                        value={t.identifier}
                                      >
                                        {t.token}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className='flex items-center rounded-md border border-gray-300 bg-white px-2 focus-within:border-slate-400'>
                                  <input
                                    value={offerPrice}
                                    onChange={(e) =>
                                      setOfferPrice(e.target.value)
                                    }
                                    className='w-full h-9 text-sm outline-none border-none focus:ring-0'
                                    placeholder={
                                      t
                                        ? t('marketplace:placeholder_amount')
                                        : 'Amount'
                                    }
                                    type='number'
                                    step='any'
                                  />
                                  <span className='text-xs font-semibold text-slate-500 ml-2 whitespace-nowrap'>
                                    {
                                      auction_tokens.find(
                                        (t) =>
                                          t.identifier === offerPaymentToken
                                      )?.token
                                    }
                                  </span>
                                </div>
                              </div>
                              <div>
                                <label className='block text-xs text-slate-500 mb-1'>
                                  {t
                                    ? t('marketplace:offer_validity')
                                    : 'Valid for (days)'}
                                </label>
                                <input
                                  type='number'
                                  value={offerDuration}
                                  onChange={(e) =>
                                    setOfferDuration(e.target.value)
                                  }
                                  className='w-full h-9 rounded-md border border-gray-300 px-2 text-sm outline-none focus:border-slate-400'
                                  min='0'
                                />
                              </div>
                              <ActionMakeOffer
                                nftIdentifier={listing.identifier}
                                nftNonce={tokenNonce || 0}
                                paymentToken={offerPaymentToken}
                                offerPrice={new BigNumber(offerPrice || '0')
                                  .shiftedBy(offerTokenDecimals)
                                  .toFixed(0)}
                                deadline={
                                  parseInt(offerDuration) === 0
                                    ? 0
                                    : Math.floor(Date.now() / 1000) +
                                      (parseInt(offerDuration) || 1) * 86400
                                }
                                label={
                                  t
                                    ? t('marketplace:send_offer_btn')
                                    : 'Send Offer'
                                }
                                disabled={
                                  !offerPrice ||
                                  parseFloat(offerPrice) <= 0 ||
                                  !hasEnoughFundsForOffer(
                                    new BigNumber(offerPrice || '0')
                                      .shiftedBy(offerTokenDecimals)
                                      .toFixed(0)
                                  )
                                }
                              />
                              {!hasEnoughFundsForOffer(
                                new BigNumber(offerPrice || '0')
                                  .shiftedBy(offerTokenDecimals)
                                  .toFixed(0)
                              ) && (
                                <div className='mt-1 text-xs text-red-500'>
                                  {t('marketplace:insufficient_funds')}
                                </div>
                              )}
                              <div className='mt-2 text-xs text-slate-500 text-right'>
                                {t
                                  ? t('marketplace:your_balance')
                                  : 'Your balance'}
                                :{' '}
                                <FormatAmount
                                  amount={offerBuyerBalance.toFixed()}
                                  identifier={offerPaymentToken}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className='text-xs text-slate-500'>
                          {/* Minimum bid warning if needed */}
                        </div>
                      </div>
                    ) : (
                      /* FIXED PRICE / NON-AUCTION UI */
                      <div className='space-y-3'>
                        {listing.auction?.auctionType?.name ===
                        'SftOnePerPayment' ? (
                          /* SFT Buy UI */
                          <div className='w-full'>
                            <div className='flex items-center gap-2 mb-2'>
                              <input
                                type='number'
                                min='1'
                                max={
                                  listing.auction?.auctionedTokens?.amount ||
                                  '1'
                                }
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                placeholder={
                                  t ? t('marketplace:placeholder_qty') : 'Qty'
                                }
                                className='h-10 w-24 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                              />
                              <div className='text-sm font-medium'>
                                x{' '}
                                <FormatAmount
                                  amount={
                                    listing.auction?.minBid?.toFixed() || '0'
                                  }
                                  identifier={paymentToken}
                                />
                              </div>
                            </div>
                            <div className='mb-2 flex justify-between items-center text-xs text-slate-500'>
                              <div>
                                {t ? t('marketplace:label_total') : 'Total:'}{' '}
                                <FormatAmount
                                  amount={
                                    listing.auction?.minBid
                                      ?.times(parseInt(qty) || 0)
                                      .toFixed() || '0'
                                  }
                                  identifier={paymentToken}
                                />
                              </div>
                              <div className='font-medium text-slate-700'>
                                {listing.auction?.auctionedTokens?.amount?.toString()}{' '}
                                {t ? t('marketplace:available') : 'available'}
                              </div>
                            </div>
                            <ActionBuySft
                              auctionId={
                                new BigNumber(listing.auction?.auctionId || id)
                              }
                              nftType={listing.identifier}
                              nftNonce={tokenNonce || '0'}
                              buyStepAmount={new BigNumber(parseInt(qty) || 1)}
                              paymentToken={paymentToken}
                              paymentAmount={
                                listing.auction?.minBid?.times(
                                  parseInt(qty) || 0
                                ) || new BigNumber(0)
                              }
                              disabled={
                                !qty ||
                                parseInt(qty) <= 0 ||
                                parseInt(qty) >
                                  parseInt(
                                    listing.auction?.auctionedTokens?.amount ||
                                      '0'
                                  ) ||
                                !hasEnoughFunds(
                                  listing.auction?.minBid
                                    ?.times(parseInt(qty) || 0)
                                    .toFixed() || '0'
                                )
                              }
                            />
                            <div className='mt-2 flex justify-between items-center text-xs text-slate-500'>
                              <div className='text-red-500 font-semibold'>
                                {!hasEnoughFunds(
                                  listing.auction?.minBid
                                    ?.times(parseInt(qty) || 0)
                                    .toFixed() || '0'
                                ) && t('marketplace:insufficient_funds')}
                              </div>
                              <div>
                                {t
                                  ? t('marketplace:your_balance')
                                  : 'Your balance'}
                                :{' '}
                                <FormatAmount
                                  amount={buyerBalance.toFixed()}
                                  identifier={paymentToken}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Standard Fixed Price UI (Stub) */
                          <>
                            <div className='flex items-center gap-2'>
                              <input
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                className='h-10 w-20 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                                inputMode='numeric'
                              />
                              <button
                                onClick={onBuyNow}
                                disabled={
                                  !qty ||
                                  !hasEnoughFunds(
                                    new BigNumber(listing.price?.amount || '0')
                                      .times(parseInt(qty) || 1)
                                      .toString()
                                  )
                                }
                                className='inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed'
                              >
                                {t
                                  ? t('marketplace:buy_now_for', {
                                      amount: `${fmt({
                                        ticker:
                                          listing.price?.ticker || paymentToken,
                                        amount: new BigNumber(
                                          listing.price?.amount || '0'
                                        )
                                          .times(parseInt(qty) || 1)
                                          .toString(),
                                        decimals: listing.price?.decimals || 18
                                      })}`
                                    })
                                  : 'Buy now'}
                              </button>
                            </div>

                            <div className='mt-2 flex justify-between items-center text-xs text-slate-500'>
                              <div className='text-red-500 font-semibold'>
                                {!hasEnoughFunds(
                                  new BigNumber(listing.price?.amount || '0')
                                    .times(parseInt(qty) || 1)
                                    .toString()
                                ) && t('marketplace:insufficient_funds')}
                              </div>
                              <div>
                                {t
                                  ? t('marketplace:your_balance')
                                  : 'Your balance'}
                                :{' '}
                                <FormatAmount
                                  amount={buyerBalance.toFixed()}
                                  identifier={paymentToken}
                                />
                              </div>
                            </div>
                            <div className='text-xs text-slate-500'>
                              {t
                                ? t('marketplace:sft_single_item_note')
                                : '1/1 item • quantity kept for future ERC1155-like support.'}
                            </div>
                          </>
                        )}

                        {/* Make Offer Section for Fixed Price */}
                        <div className='mt-4 border-t pt-4'>
                          <div className='flex justify-between items-center mb-3'>
                            <span className='text-sm font-semibold text-slate-700'>
                              {t
                                ? t('marketplace:make_offer_title')
                                : 'Make an offer'}
                            </span>
                          </div>
                          <div className='bg-slate-50 p-3 rounded-md space-y-3 border border-slate-200'>
                            <div>
                              <label className='block text-xs text-slate-500 mb-1'>
                                {t
                                  ? t('marketplace:price_listing', {
                                      currency: paymentToken
                                    })
                                  : `Price (${paymentToken})`}
                              </label>
                              <input
                                value={offerPrice}
                                onChange={(e) => setOfferPrice(e.target.value)}
                                className='w-full h-9 rounded-md border border-gray-300 px-2 text-sm outline-none focus:border-slate-400'
                                placeholder='Amount'
                              />
                            </div>
                            <div>
                              <label className='block text-xs text-slate-500 mb-1'>
                                {t
                                  ? t('marketplace:offer_validity')
                                  : 'Valid for (days)'}
                              </label>
                              <input
                                type='number'
                                value={offerDuration}
                                onChange={(e) =>
                                  setOfferDuration(e.target.value)
                                }
                                className='w-full h-9 rounded-md border border-gray-300 px-2 text-sm outline-none focus:border-slate-400'
                                min='0'
                              />
                            </div>
                            <ActionMakeOffer
                              nftIdentifier={listing.identifier}
                              nftNonce={tokenNonce || 0}
                              paymentToken={paymentToken}
                              offerPrice={new BigNumber(offerPrice || '0')
                                .shiftedBy(tokenInformations?.decimals || 0)
                                .toFixed(0)}
                              deadline={
                                parseInt(offerDuration) === 0
                                  ? 0
                                  : Math.floor(Date.now() / 1000) +
                                    (parseInt(offerDuration) || 1) * 86400
                              }
                              label={
                                t
                                  ? t('marketplace:send_offer_btn')
                                  : 'Send Offer'
                              }
                              disabled={
                                !offerPrice ||
                                parseFloat(offerPrice) <= 0 ||
                                !hasEnoughFunds(
                                  new BigNumber(offerPrice || '0')
                                    .shiftedBy(tokenInformations?.decimals || 0)
                                    .toFixed(0)
                                )
                              }
                            />
                            <div className='mt-2 flex justify-between items-center text-xs text-slate-500'>
                              <div className='text-red-500 font-semibold'>
                                {!hasEnoughFunds(
                                  new BigNumber(offerPrice || '0')
                                    .shiftedBy(tokenInformations?.decimals || 0)
                                    .toFixed(0)
                                ) && t('marketplace:insufficient_funds')}
                              </div>
                              <div>
                                {t
                                  ? t('marketplace:your_balance')
                                  : 'Your balance'}
                                :{' '}
                                <FormatAmount
                                  amount={buyerBalance.toFixed()}
                                  identifier={paymentToken}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Offers Section */}
                {offersData?.offers && offersData.offers.length > 0 && (
                  <div className='mt-8 pt-6 border-t border-gray-100'>
                    <h3 className='text-sm font-semibold text-gray-900 mb-4'>
                      {t ? t('marketplace:title_offers') : 'Offers'}
                    </h3>
                    <div className='space-y-3'>
                      {offersData.offers.map((offer) => {
                        const deadlineMs = new Date(offer.deadline).getTime();
                        const isExpired =
                          deadlineMs > 0 && Date.now() > deadlineMs;
                        const isOwner = offer.owner?.address === address;

                        return (
                          <div
                            key={offer.id}
                            className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100'
                          >
                            <div className='flex flex-col'>
                              <div className='font-medium text-gray-900 flex items-center gap-2'>
                                <FormatAmount
                                  amount={offer.paymentAmount}
                                  identifier={offer.paymentTokenIdentifier}
                                />
                                {offer.offerTokenNonce === 0 && (
                                  <span className='inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10'>
                                    {t
                                      ? t('marketplace:badge_collection_offer')
                                      : 'Collection Offer'}
                                  </span>
                                )}
                              </div>
                              <div className='text-xs text-gray-500'>
                                {t ? t('marketplace:label_from') : 'from '}{' '}
                                {offer.owner ? (
                                  <ShortenedAddress
                                    address={offer.owner.address}
                                  />
                                ) : (
                                  '-'
                                )}
                                {isExpired && (
                                  <span className='text-red-500 ml-1'>
                                    {t
                                      ? t('marketplace:label_expired')
                                      : '(Expired)'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className='flex items-center gap-2'>
                              {/* Action for regular users (or owner with token in wallet) */}
                              {!isOwner && !isExpired && (
                                <div className='flex flex-col gap-2 scale-90 origin-right'>
                                  {/* Priority 1: Accept & Close Auction (if seller, no bids, and auction active) */}
                                  {address === listing.seller &&
                                  listing.auction?.currentBid.isZero() ? (
                                    <ActionWithdrawAuctionAndAccept
                                      auctionId={listing.auction.auctionId}
                                      offerId={offer.id}
                                      label={
                                        t
                                          ? t('marketplace:btn_accept_close')
                                          : 'Accept & Close'
                                      }
                                    />
                                  ) : (
                                    /* Priority 2: Accept from Wallet (standard accept) */
                                    /* Shown enabled if user has token, disabled otherwise */
                                    <ActionAcceptOffer
                                      offerId={offer.id}
                                      offerNonce={offer.offerTokenNonce}
                                      nftIdentifier={
                                        offer.offerTokenIdentifier ||
                                        // Fallback to currently viewed token if offer identifier is generic/collection
                                        tokenIdentifier ||
                                        ''
                                      }
                                      nftNonce={tokenNonce || 0}
                                      label={
                                        t
                                          ? t('marketplace:btn_sell_wallet')
                                          : 'Sell from wallet'
                                      }
                                      disabled={!userHasToken}
                                    />
                                  )}
                                </div>
                              )}
                              {isOwner && (
                                <div className='scale-90 origin-right'>
                                  <ActionWithdrawOffer
                                    offerId={offer.id}
                                    label={
                                      t ? t('marketplace:cancel') : 'Cancel'
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div className='grid grid-cols-2 gap-3 pt-2 text-sm'>
                  <div className='rounded-md border p-3'>
                    <div className='text-xs text-slate-500'>
                      {t ? t('marketplace:label_seller') : 'Seller'}
                    </div>
                    <div className='font-medium break-all'>
                      <ShortenedAddress address={listing.seller} />
                    </div>
                  </div>
                  <div className='rounded-md border p-3'>
                    <div className='text-xs text-slate-500'>
                      {t ? t('marketplace:label_collection') : 'Collection'}
                    </div>
                    <Link
                      className='font-medium underline'
                      to={`/marketplace/collections/${listing.collection}`}
                    >
                      {listing.collection}
                    </Link>
                  </div>
                  {isAuction && (
                    <>
                      <div className='rounded-md border p-3'>
                        <div className='text-xs text-slate-500'>
                          {t
                            ? t('marketplace:label_current_buyer')
                            : 'Current buyer'}
                        </div>
                        <div className='font-medium'>
                          {listing.auction?.currentBid.gt(0) ? (
                            <ShortenedAddress
                              address={listing.auction.currentWinner}
                            />
                          ) : (
                            '-'
                          )}
                        </div>
                      </div>
                      <div className='rounded-md border p-3'>
                        <div className='text-xs text-slate-500'>
                          {t ? t('marketplace:label_ends_at') : 'Ends at'}
                        </div>
                        <div className='text-sm font-semibold'>
                          {/* Check for large end time (approx > year 3000 in ms to handle 13-digit timestamps) */}
                          {Number(listing.auction!.endTime) > 32503680000000
                            ? '∞'
                            : new Date(
                                Number(listing.auction!.endTime)
                              ).toLocaleString()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* More from this collection */}
            <MoreFromCollection
              collection={listing.collection}
              currentListingId={listing.id}
            />
          </div>
        </div>
      </PageTemplate>
    </div>
  );
};

/* ---------------- More From Collection Component ---------------- */

function MoreFromCollection({
  collection,
  currentListingId
}: {
  collection: string;
  currentListingId: string;
}) {
  const { t } = useTranslation();
  const { auctions, isLoading } = useGetAuctionsPaginated({
    page: 1,
    limit: 4,
    collection
  });

  // Keep previous data to prevent flickering when refetching
  const [displayedAuctions, setDisplayedAuctions] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (auctions.length > 0) {
      setDisplayedAuctions(auctions);
    }
  }, [auctions]);

  // Filter out current listing
  const otherListings = displayedAuctions.filter(
    (a: any) => a.auction_id?.toString() !== currentListingId
  );

  if (otherListings.length === 0 && !isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='font-semibold'>
            {t
              ? t('marketplace:more_from_collection')
              : 'More from this collection'}
          </div>
          <Link
            to={`/marketplace/collections/${collection}`}
            className='text-xs font-medium text-slate-600 hover:text-slate-900'
          >
            {t ? t('marketplace:view_all') : 'View all'}
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-3'>
          {otherListings.slice(0, 4).map((auction: any) => {
            const id = auction.auction_id?.toString();
            const tokenIdentifier =
              auction.auctioned_tokens?.token_identifier?.toString();
            const tokenNonce =
              auction.auctioned_tokens?.token_nonce?.toString();
            const minBid = auction.min_bid?.toString();
            const currentBid = auction.current_bid?.toString();
            const price = new BigNumber(currentBid || minBid || '0');
            const paymentToken = auction.payment_token?.toString() || 'EGLD';

            return (
              <Link
                key={id}
                to={`/marketplace/listings/${id}`}
                className='group block rounded-lg border bg-slate-50 p-2 transition-colors hover:border-slate-300'
              >
                <div className='aspect-square overflow-hidden rounded-md bg-white'>
                  <DisplayNftByToken
                    tokenIdentifier={tokenIdentifier}
                    nonce={tokenNonce}
                    variant='media-only'
                    className='h-full w-full object-cover transition-transform group-hover:scale-105'
                  />
                </div>
                <div className='mt-2'>
                  <div className='truncate text-xs font-medium text-slate-900'>
                    {tokenIdentifier} #{tokenNonce}
                  </div>
                  <div className='mt-0.5 text-[10px] text-slate-500'>
                    <span className='font-medium text-slate-900'>
                      <FormatAmount
                        amount={price.toFixed()}
                        identifier={paymentToken}
                      />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
