import React from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

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
  id: string;
  source: MarketSource;
  saleType: SaleType;
  identifier: string;
  collectionSlug: string;
  name: string;
  images: string[]; // gallery
  seller: string;
  price?: TokenAmount; // for fixed
  auction?: {
    startPrice: TokenAmount;
    currentBid?: TokenAmount;
    startTime: number;
    endTime: number;
    bidsCount: number;
    history: Bid[];
  };
  attributes?: Array<{ trait: string; value: string }>;
  status: 'active' | 'sold' | 'cancelled' | 'ended';
  createdAt: number;
  description?: string;
};

/* ---------------- Mock fetch ---------------- */
// Remplace par un vrai fetch (SC/Indexer). On simule local + xoxno.
const MOCK_DB: Listing[] = (() => {
  const baseImg = 'https://placehold.co';
  const mkImgs = (seed: number) => [
    `${baseImg}/1024/png?text=Main+${seed}`,
    `${baseImg}/512/png?text=Alt+${seed}+A`,
    `${baseImg}/512/png?text=Alt+${seed}+B`
  ];
  const now = Date.now();
  const items: Listing[] = [];
  for (let i = 0; i < 10; i++) {
    // fixed
    items.push({
      id: `dinovox:${0 + i}`,
      source: 'dinovox',
      saleType: 'fixed',
      identifier: `DINOVOX-${0 + i}`,
      collectionSlug: 'dinovox',
      name: `Dino #${0 + i}`,
      images: mkImgs(i),
      seller: i % 3 === 0 ? 'erd1vip...aaaa' : 'erd1...abcd',
      price: {
        ticker: 'EGLD',
        amount: (0.35 + i * 0.01).toFixed(2),
        decimals: 18
      },
      status: 'active',
      createdAt: now - i * 3600 * 1000,
      attributes: [
        { trait: 'Background', value: 'Volcano' },
        { trait: 'Eyes', value: 'Laser' },
        { trait: 'Rarity', value: i % 5 === 0 ? 'Mythic' : 'Common' }
      ],
      description: 'Fixed-price listing on local marketplace.'
    });
  }
  for (let i = 0; i < 10; i++) {
    // auction (some xoxno)
    const start = now - (i + 1) * 45 * 60 * 1000;
    const end = now + (i + 2) * 20 * 60 * 1000;
    const history: Bid[] = Array.from({ length: (i % 4) + 1 }).map((_, j) => ({
      id: `b${i}-${j}`,
      bidder: j % 2 ? 'erd1...abcd' : 'erd1k3y...zzz',
      amount: {
        ticker: 'EGLD',
        amount: (0.2 + j * 0.07).toFixed(2),
        decimals: 18
      },
      time: start + (j + 1) * 8 * 60 * 1000
    }));
    items.push({
      id: (i % 2 ? 'xoxno' : 'dinovox') + `:A-${2000 + i}`,
      source: i % 2 ? 'xoxno' : 'dinovox',
      saleType: 'auction',
      identifier: `DINOVOX-A-${2000 + i}`,
      collectionSlug: 'dinovox',
      name: `Dino Auction #${2000 + i}`,
      images: mkImgs(100 + i),
      seller: 'erd1...wxyz',
      auction: {
        startPrice: { ticker: 'EGLD', amount: '0.20', decimals: 18 },
        currentBid: history[history.length - 1]?.amount,
        startTime: start,
        endTime: end,
        bidsCount: history.length,
        history
      },
      status: end < now ? 'ended' : 'active',
      createdAt: now - i * 5400 * 1000,
      attributes: [
        { trait: 'Skin', value: 'Emerald' },
        { trait: 'Accessory', value: 'Bone Club' }
      ],
      description: 'Auction listing (may be mirrored from Xoxno).'
    });
  }
  return items;
})();

async function fetchListingById(id: string): Promise<Listing | null> {
  await new Promise((r) => setTimeout(r, 150)); // fake latency
  return MOCK_DB.find((l) => l.id === id) || null;
}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') || 'details') as
    | 'details'
    | 'bids'
    | 'activity';

  const [loading, setLoading] = React.useState(true);
  const [listing, setListing] = React.useState<Listing | null>(null);
  const [qty, setQty] = React.useState('1'); // for fixed buy (1/1 NFTs -> juste cosmétique)
  const [bidAmount, setBidAmount] = React.useState('');

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    fetchListingById(decodeURIComponent(id)).then((l) => {
      if (active) {
        setListing(l);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  const timeLeft = useCountdown(listing?.auction?.endTime);

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

  /* ---- Handlers (stub: à brancher à ton SDK/SC) ---- */
  const onBuyNow = () => {
    alert(
      `Buy now ${listing.identifier} x${qty} for ${fmt(listing.price)} (stub)`
    );
  };
  const onPlaceBid = () => {
    if (!bidAmount) return alert('Enter a bid amount');
    alert(
      `Bid ${bidAmount} ${listing.auction?.startPrice.ticker} on ${listing.identifier} (stub)`
    );
  };

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 space-y-6'>
      {/* Breadcrumb */}
      <div className='text-sm text-slate-600'>
        <Link to='/marketplace' className='underline'>
          Marketplace
        </Link>
        <span className='px-2'>/</span>
        <Link
          to={`/marketplace/collections/${listing.collectionSlug}`}
          className='underline'
        >
          {listing.collectionSlug}
        </Link>
        <span className='px-2'>/</span>
        <span>{listing.identifier}</span>
      </div>

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

      {/* Main layout */}
      <div className='grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6'>
        {/* Left: Gallery + Tabs */}
        <div className='space-y-4'>
          {/* Gallery (aperçu large) */}
          <Card>
            <CardHeader className='p-0'>
              <div className='relative aspect-[4/3] bg-slate-100 rounded-t-2xl overflow-hidden'>
                <img
                  src={listing.images[0]}
                  alt={listing.name}
                  className='h-full w-full object-cover'
                />
              </div>
            </CardHeader>
            {listing.images.length > 1 && (
              <CardContent className='grid grid-cols-4 sm:grid-cols-6 gap-2'>
                {listing.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      // simple swap main image
                      const next = [...listing.images];
                      const [head] = next.splice(i, 1);
                      setListing({ ...listing, images: [head, ...next] });
                    }}
                    className='aspect-square rounded-lg overflow-hidden border hover:opacity-80'
                    title={`Preview ${i + 1}`}
                  >
                    <img
                      src={src}
                      alt={`thumb-${i}`}
                      className='h-full w-full object-cover'
                    />
                  </button>
                ))}
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
                      {listing.attributes.map((a, i) => (
                        <div key={i} className='rounded-md border p-2'>
                          <div className='text-[11px] uppercase tracking-wide text-slate-500'>
                            {a.trait}
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
                        to={`/marketplace/collections/${listing.collectionSlug}`}
                      >
                        {listing.collectionSlug}
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
                  {isAuction ? 'Current bid' : 'Price'}
                </div>
                <div className='mt-1 text-2xl font-semibold'>
                  {fmt(currentPrice)}
                </div>
                {isAuction && listing.auction?.startPrice && (
                  <div className='mt-1 text-xs text-slate-500'>
                    Start price {fmt(listing.auction.startPrice)}
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
              {listing.status !== 'active' ? (
                <div className='text-sm text-slate-500'>
                  This listing is not active.
                </div>
              ) : isAuction ? (
                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <input
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Bid in ${listing.auction?.startPrice.ticker}`}
                      inputMode='decimal'
                      className='h-10 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                    />
                    <button
                      onClick={onPlaceBid}
                      className='inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800'
                    >
                      Place bid
                    </button>
                  </div>
                  <div className='text-xs text-slate-500'>
                    Your wallet must be connected • Min bid step & signature
                    handled by SC.
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
                    1/1 item • quantity kept for future ERC1155-like support.
                  </div>
                </div>
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
                    to={`/marketplace/collections/${listing.collectionSlug}`}
                  >
                    {listing.collectionSlug}
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
              <div className='grid grid-cols-2 gap-3'>
                {MOCK_DB.filter(
                  (x) =>
                    x.collectionSlug === listing.collectionSlug &&
                    x.id !== listing.id
                )
                  .slice(0, 4)
                  .map((x) => (
                    <Link
                      key={x.id}
                      to={`/marketplace/listings/${encodeURIComponent(x.id)}`}
                      className='group rounded-lg overflow-hidden border'
                    >
                      <div className='aspect-square bg-slate-100'>
                        <img
                          src={x.images[0]}
                          alt={x.name}
                          className='h-full w-full object-cover'
                        />
                      </div>
                      <div className='px-2 py-1'>
                        <div className='text-xs text-slate-500'>
                          {x.identifier}
                        </div>
                        <div className='text-sm font-medium group-hover:underline'>
                          {x.saleType === 'auction'
                            ? `Bid ${fmt(
                                x.auction?.currentBid || x.auction?.startPrice
                              )}`
                            : `Price ${fmt(x.price)}`}
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
