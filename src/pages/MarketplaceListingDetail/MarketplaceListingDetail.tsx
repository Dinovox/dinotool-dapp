import React, { useMemo, useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useGetFullAuctionData } from 'contracts/dinauction/helpers/useGetFullAuctionData';
import { useGetNftInformations } from 'pages/LotteryList/Transaction/helpers/useGetNftInformation';
import { DisplayNft } from 'helpers/DisplayNft';
import type { UserNft } from 'helpers/useGetUserNft';
import { ActionBid } from 'contracts/dinauction/actions/Bid';
import { ActionWithdraw } from 'contracts/dinauction/actions/Withdraw';
import { ActionEndAuction } from 'contracts/dinauction/actions/EndAuction';
import BigNumber from 'bignumber.js';
import {
  useGetEsdtInformations,
  FormatAmount
} from 'helpers/api/useGetEsdtInformations';
import { useGetAccount } from 'lib';
import { Breadcrumb } from 'components/ui/Breadcrumb';

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
    auctionType: string; // Corresponds to auction_type
    startPrice: BigNumber; // Corresponds to min_bid
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
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (!endTime) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTime]);
  if (!endTime) return '—';
  const left = Math.max(0, endTime - now);
  const s = Math.floor(left / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

/* ---------------- Minimal UI bits ---------------- */
const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className='inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700'>
    {children}
  </span>
);
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

/* ---------------- Page ---------------- */
export const MarketplaceListingDetail = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { address } = useGetAccount();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') || 'details') as
    | 'details'
    | 'bids'
    | 'activity';

  const [qty, setQty] = React.useState('1'); // for fixed buy (1/1 NFTs -> juste cosmétique)
  const [bidAmount, setBidAmount] = React.useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // 1. Fetch Auction Data from Contract
  const { auction: rawAuction, isLoading: loadingAuction } =
    useGetFullAuctionData(id);

  // 2. Extract Token Info for NFT Fetch
  const tokenIdentifier =
    rawAuction?.auctioned_tokens?.token_identifier?.toString();
  const tokenNonce = rawAuction?.auctioned_tokens?.token_nonce?.toString();

  // 3. Fetch NFT Data from API
  const nftInfo: any = useGetNftInformations(tokenIdentifier, tokenNonce);

  const paymentToken = rawAuction?.payment_token?.toString() || 'EGLD';
  const tokenInformations = useGetEsdtInformations(paymentToken);

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
    const currentBidAmount = rawAuction.current_bid?.toString();
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
      saleType: 'auction', // Assuming only auctions for now based on hook
      identifier: tokenIdentifier || 'Unknown',
      collection,
      name,
      images,
      seller,
      auction: {
        auctionId: rawAuction.auction_id?.toString() || id,
        auctionType: rawAuction.auction_type?.toString(),
        startPrice: new BigNumber(minBid),
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
        currentWinner: rawAuction.current_winner?.toString() || '',
        marketplaceCutPercentage:
          rawAuction.marketplace_cut_percentage?.toString() || '0',
        creatorRoyaltiesPercentage:
          rawAuction.creator_royalties_percentage?.toString() || '0',
        bidsCount: 0, // TODO: Fetch bids count if available or calculate from history
        history: [] // TODO: Fetch bid history if available
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
    tokenInformations
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

  const minRequiredBid = useMemo(() => {
    if (!listing?.auction) return null;
    const minDiff = listing.auction.minBidDiff;
    const startPrice = listing.auction.startPrice;
    const currentBid = listing.auction.currentBid;

    let effectiveMinDiff = minDiff;
    if (minDiff.isZero() && currentBid.gt(0)) {
      effectiveMinDiff = currentBid.multipliedBy(0.01);
    }

    return BigNumber.max(startPrice, currentBid.plus(effectiveMinDiff));
  }, [listing]);

  useEffect(() => {
    if (minRequiredBid && listing?.auction && tokenInformations?.decimals) {
      const decimals = tokenInformations.decimals;
      // Convert from smallest unit to human-readable format
      const humanReadable = minRequiredBid.shiftedBy(-decimals);
      // Format with appropriate decimal places (max 8 for display)
      const formatted = humanReadable
        .decimalPlaces(Math.min(decimals, 8))
        .toString();

      // Only set if empty OR if current value looks like unformatted BigNumber (very long number)
      if (
        bidAmount === '' ||
        (bidAmount.length > 15 && !bidAmount.includes('.'))
      ) {
        setBidAmount(formatted);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minRequiredBid, listing, tokenInformations]);

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
        <div className='text-2xl font-semibold'>Listing not found</div>
        <div className='mt-2 text-slate-600'>
          The listing id “{id}” does not exist or is no longer available.
        </div>
        <div className='mt-6'>
          <Link to='/marketplace/listings' className='underline'>
            Back to listings
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
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: 'Marketplace', path: '/marketplace' },
          { label: 'Listings', path: '/marketplace/listings' },
          { label: listing.name || listing.identifier }
        ]}
      />

      {/* Header */}
      <div className='flex items-center gap-2'>
        <div className='h-6 w-6 rounded-md bg-slate-200' />
        <h1 className='text-2xl font-semibold'>{listing.name}</h1>
        <div className='ml-2 flex gap-1'>
          <Badge>{listing.source}</Badge>
          <Badge>{listing.saleType}</Badge>
          {listing.status !== 'active' && <Badge>{listing.status}</Badge>}
        </div>
      </div>
      <div className='text-sm text-slate-500'>{listing.identifier}</div>

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
                  ? 'Congratulations! You won this auction.'
                  : 'This auction has ended.'}
              </h3>
              <p className='text-sm opacity-90'>
                {address === listing.auction?.currentWinner
                  ? 'The item has been sent to your wallet. It may take a few minutes to appear.'
                  : 'This listing is no longer available on the marketplace.'}
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
                  variant='media-only'
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
                      media: [{ url: listing.images[0], fileType: 'image/png' }]
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
            {(['details', 'bids', 'activity'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  const s = new URLSearchParams(searchParams);
                  s.set('tab', t);
                  setSearchParams(s, { replace: true });
                }}
                className={`px-3 py-2 text-sm -mb-px border-b-2 ${
                  tab === t
                    ? 'border-slate-900 font-medium'
                    : 'border-transparent text-slate-500'
                }`}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'details' && (
            <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
              <Card>
                <CardHeader>
                  <div className='font-semibold'>Description</div>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-slate-700 whitespace-pre-line'>
                    {listing.description || 'No description provided.'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className='font-semibold'>Attributes</div>
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
                    <div className='text-sm text-slate-500'>No attributes.</div>
                  )}
                </CardContent>
              </Card>

              <Card className='xl:col-span-2'>
                <CardHeader>
                  <div className='font-semibold'>Provenance</div>
                </CardHeader>
                <CardContent>
                  <ul className='text-sm space-y-2'>
                    <li>
                      Minted on-chain •{' '}
                      {new Date(listing.createdAt).toLocaleString()}
                    </li>
                    <li>Seller: {listing.seller}</li>
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
            <Card>
              <CardHeader>
                <div className='font-semibold'>Bid history</div>
              </CardHeader>
              <CardContent>
                {isAuction && listing.auction?.history?.length ? (
                  <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                      <thead className='text-left text-slate-500'>
                        <tr>
                          <th className='py-2 pr-3'>Time</th>
                          <th className='py-2 pr-3'>Bidder</th>
                          <th className='py-2 pr-3'>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listing.auction.history
                          .slice()
                          .reverse()
                          .map((b) => (
                            <tr key={b.id} className='border-t'>
                              <td className='py-2 pr-3'>
                                {new Date(b.time).toLocaleString()}
                              </td>
                              <td className='py-2 pr-3'>{b.bidder}</td>
                              <td className='py-2 pr-3 font-medium'>
                                {fmt(b.amount)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className='text-sm text-slate-500'>No bids yet.</div>
                )}
              </CardContent>
            </Card>
          )}

          {tab === 'activity' && (
            <Card>
              <CardHeader>
                <div className='font-semibold'>Activity</div>
              </CardHeader>
              <CardContent>
                <div className='text-sm text-slate-500'>
                  Hook your indexer here (transfers, listings, sales...).
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Action panel */}
        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div className='font-semibold'>Listing</div>
                <Badge>{listing.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Price / Current bid */}
              <div className='rounded-xl border p-4'>
                <div className='text-xs uppercase tracking-wide text-slate-500'>
                  {isAuction && !isDirectSale ? 'Current bid' : 'Price'}
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
                {isAuction && !isDirectSale && listing.auction?.startPrice && (
                  <div className='mt-1 text-xs text-slate-500'>
                    Start price{' '}
                    <FormatAmount
                      amount={listing.auction?.startPrice.toFixed()}
                      identifier={paymentToken}
                    />
                  </div>
                )}
                {isAuction && (
                  <div className='mt-3 flex items-center gap-2 text-sm'>
                    <Badge>Ends in</Badge>
                    <span className='font-medium'>{timeLeft}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {address === listing.seller ? (
                listing.auction?.currentBid &&
                listing.auction.currentBid.gt(0) ? (
                  <div className='w-full rounded-md bg-amber-50 p-3 text-sm text-amber-800'>
                    Auction has bids. You cannot withdraw.
                  </div>
                ) : (
                  <ActionWithdraw
                    auction_id={new BigNumber(listing.auction?.auctionId || id)}
                  />
                )
              ) : (
                <>
                  {listing.status !== 'active' ? (
                    <>
                      {listing?.isCached === false &&
                      address &&
                      listing.auction?.currentBid.gt(0) &&
                      timeLeft === '0h 0m 0s' ? (
                        <ActionEndAuction
                          auction_id={
                            new BigNumber(listing.auction?.auctionId || id)
                          }
                        />
                      ) : (
                        <div className='text-sm text-slate-500'>
                          This listing is not active.
                        </div>
                      )}
                    </>
                  ) : isAuction ? (
                    <div className='space-y-3'>
                      <div className='flex items-center gap-2'>
                        <>
                          {!isDirectSale && (
                            <>
                              <input
                                value={bidAmount}
                                onChange={(e) => {
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
                                  .shiftedBy(tokenInformations?.decimals || 0)
                                  .toFixed(0)}
                                disabled={
                                  !bidAmount ||
                                  parseFloat(bidAmount) <= 0 ||
                                  (minRequiredBid
                                    ? new BigNumber(bidAmount)
                                        .shiftedBy(
                                          tokenInformations?.decimals || 0
                                        )
                                        .lt(minRequiredBid)
                                    : false) ||
                                  address === listing.auction?.currentWinner
                                }
                              />
                            </>
                          )}
                          {listing.auction?.maxBid &&
                            listing.auction.maxBid.gt(0) && (
                              <ActionBid
                                auctionId={listing.auction?.auctionId || id}
                                nftType={listing.identifier}
                                nftNonce={tokenNonce || '0'}
                                paymentToken={paymentToken}
                                amount={listing.auction.maxBid.toFixed(0)}
                                directBuy
                                label={
                                  <>
                                    Buy now for{' '}
                                    <FormatAmount
                                      amount={listing.auction.maxBid.toFixed()}
                                      identifier={paymentToken}
                                    />
                                  </>
                                }
                              />
                            )}{' '}
                        </>
                      </div>
                      <div className='text-xs text-slate-500'>
                        {address === listing.seller ? null : address === // Owner view: no helper text needed for withdraw/disabled state
                          listing.auction?.currentWinner ? (
                          <span className='text-green-600 font-medium'>
                            You are the current winner!
                          </span>
                        ) : (
                          minRequiredBid &&
                          !isDirectSale && (
                            <>
                              Minimum bid:{' '}
                              <FormatAmount
                                amount={minRequiredBid.toFixed(0)}
                                identifier={paymentToken}
                              />
                            </>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      <div className='flex items-center gap-2'>
                        <input
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                          className='h-10 w-20 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                          inputMode='numeric'
                        />
                        <button
                          onClick={onBuyNow}
                          className='inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800'
                        >
                          Buy now
                        </button>
                      </div>
                      <div className='text-xs text-slate-500'>
                        1/1 item • quantity kept for future ERC1155-like
                        support.
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Meta */}
              <div className='grid grid-cols-2 gap-3 pt-2 text-sm'>
                <div className='rounded-md border p-3'>
                  <div className='text-xs text-slate-500'>Seller</div>
                  <div className='font-medium break-all'>{listing.seller}</div>
                </div>
                <div className='rounded-md border p-3'>
                  <div className='text-xs text-slate-500'>Collection</div>
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
                      <div className='text-xs text-slate-500'>Bids</div>
                      <div className='font-medium'>
                        {listing.auction?.bidsCount || 0}
                      </div>
                    </div>
                    <div className='rounded-md border p-3'>
                      <div className='text-xs text-slate-500'>Ends at</div>
                      <div className='font-medium'>
                        {new Date(listing.auction!.endTime).toLocaleString()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Related items */}
          <Card>
            <CardHeader>
              <div className='font-semibold'>More from this collection</div>
            </CardHeader>
            <CardContent>
              <div className='text-sm text-slate-500'>
                Related items fetching not implemented yet.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
