import React from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

/** ---------------- Types partagés ---------------- **/
type MarketSource = 'dinovox' | 'xoxno';
type SaleType = 'fixed' | 'auction';

type TokenAmount = {
  ticker: string;
  amount: string;
  decimals: number;
};

type Collection = {
  slug: string;
  name: string;
  logo: string;
  banner?: string;
  itemsCount: number;
  floor?: TokenAmount;
  volume24h?: TokenAmount;
  volume7d?: TokenAmount;
  listingsActive: number;
  isOwnedByDinovox?: boolean;
  sources: MarketSource[]; // informatif (où on a des listings visibles)
};

type AuctionData = {
  currentBid?: TokenAmount;
  startPrice: TokenAmount;
  startTime: number;
  endTime: number;
  bidsCount: number;
};

type Listing = {
  id: string;
  source: MarketSource;
  saleType: SaleType;
  identifier: string;
  collectionSlug: string;
  name: string;
  image: string;
  seller: string;
  price?: TokenAmount;
  auction?: AuctionData;
  status: 'active' | 'sold' | 'cancelled' | 'ended';
  createdAt: number;
};

/** ---------------- MOCK DATA / helpers ---------------- **/
const MOCK_COLLECTIONS: Collection[] = [
  {
    slug: 'dinovox',
    name: 'Dinovox',
    logo: 'https://placehold.co/160/png?text=D',
    banner: 'https://placehold.co/1600x420/png?text=Dinovox+Banner',
    itemsCount: 1234,
    floor: { ticker: 'EGLD', amount: '1.25', decimals: 18 },
    volume24h: { ticker: 'EGLD', amount: '250', decimals: 18 },
    volume7d: { ticker: 'EGLD', amount: '1100', decimals: 18 },
    listingsActive: 48,
    isOwnedByDinovox: true,
    sources: ['dinovox', 'xoxno']
  },
  {
    slug: 'x-dinosaurs',
    name: 'X Dinosaurs',
    logo: 'https://placehold.co/160/png?text=X',
    banner: 'https://placehold.co/1600x420/png?text=X+Dinosaurs',
    itemsCount: 980,
    floor: { ticker: 'EGLD', amount: '0.55', decimals: 18 },
    volume24h: { ticker: 'EGLD', amount: '120', decimals: 18 },
    volume7d: { ticker: 'EGLD', amount: '610', decimals: 18 },
    listingsActive: 31,
    sources: ['xoxno']
  }
];

function genMockListings(slug: string, n = 24): Listing[] {
  return Array.from({ length: n }).map((_, i) => {
    const isAuction = i % 3 === 1;
    return {
      id: `${slug}:${i + 1}`,
      source: i % 4 === 0 ? 'xoxno' : 'dinovox',
      saleType: isAuction ? 'auction' : 'fixed',
      identifier: `${slug.toUpperCase()}-${1000 + i}`,
      collectionSlug: slug,
      name: `${slug} #${1000 + i}`,
      image: 'https://placehold.co/600/png',
      seller: 'erd1...abcd',
      price: !isAuction
        ? { ticker: 'EGLD', amount: (0.4 + i * 0.01).toFixed(2), decimals: 18 }
        : undefined,
      auction: isAuction
        ? {
            startPrice: { ticker: 'EGLD', amount: '0.20', decimals: 18 },
            currentBid: {
              ticker: 'EGLD',
              amount: (0.2 + (i % 5) * 0.05).toFixed(2),
              decimals: 18
            },
            startTime: Date.now() - 60 * 60 * 1000,
            endTime: Date.now() + (i + 1) * 30 * 60 * 1000,
            bidsCount: (i % 5) + 1
          }
        : undefined,
      status: 'active',
      createdAt: Date.now() - i * 3600 * 1000
    } as Listing;
  });
}

function formatToken(t?: TokenAmount) {
  if (!t) return '-';
  return `${t.amount} ${t.ticker}`;
}

/** ---------------- UI de base ---------------- **/
const Badge: React.FC<
  React.PropsWithChildren<{ tone?: 'neutral' | 'brand' }>
> = ({ children, tone = 'neutral' }) => {
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

const Card: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className='rounded-2xl border border-gray-200 bg-white shadow-sm'>
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
const CardFooter: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className = ''
}) => <div className={`p-4 pt-0 ${className}`}>{children}</div>;

function Countdown({ endTime }: { endTime: number }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const left = Math.max(0, endTime - now);
  const s = Math.floor(left / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (
    <span>
      {h}h {m}m {sec}s
    </span>
  );
}

/** ---------------- Page ---------------- **/
export const MarketplaceCollectionDetail = () => {
  const { slug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filtres/tri depuis l’URL (pratique pour partager un lien)
  const initialSale = (searchParams.get('sale') as SaleType) || 'fixed';
  const initialSort = searchParams.get('sort') || 'newest'; // newest | priceAsc | priceDesc | endingSoon
  const initialQ = searchParams.get('q') || '';
  const initialToken = searchParams.get('token') || 'EGLD';
  const initialMin = searchParams.get('min') || '';
  const initialMax = searchParams.get('max') || '';

  const [saleType, setSaleType] = React.useState<'all' | SaleType>('all');
  const [sort, setSort] = React.useState<
    'newest' | 'priceAsc' | 'priceDesc' | 'endingSoon'
  >(initialSort as any);
  const [q, setQ] = React.useState(initialQ);
  const [token, setToken] = React.useState(initialToken);
  const [min, setMin] = React.useState(initialMin);
  const [max, setMax] = React.useState(initialMax);

  // Simule un fetch collection + listings
  const collection = React.useMemo(
    () => MOCK_COLLECTIONS.find((c) => c.slug === slug) || null,
    [slug]
  );
  const allListings = React.useMemo(() => genMockListings(slug, 32), [slug]);

  const listings = React.useMemo(() => {
    let list = [...allListings];
    // sale type
    if (saleType !== 'all') list = list.filter((l) => l.saleType === saleType);
    // q
    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(qq) ||
          l.identifier.toLowerCase().includes(qq) ||
          l.seller.toLowerCase().includes(qq)
      );
    }
    // token + price range (fixed only)
    if (token) {
      list = list.filter((l) => {
        if (l.saleType === 'fixed') return l.price?.ticker === token;
        if (l.saleType === 'auction')
          return (
            (l.auction?.currentBid || l.auction?.startPrice)?.ticker === token
          );
        return true;
      });
    }
    const minV = min ? parseFloat(min) : undefined;
    const maxV = max ? parseFloat(max) : undefined;
    if (minV !== undefined || maxV !== undefined) {
      list = list.filter((l) => {
        const v =
          l.saleType === 'fixed'
            ? parseFloat(l.price?.amount || '0')
            : parseFloat(
                (l.auction?.currentBid || l.auction?.startPrice)?.amount || '0'
              );
        if (minV !== undefined && v < minV) return false;
        if (maxV !== undefined && v > maxV) return false;
        return true;
      });
    }
    // sort
    if (sort === 'newest') list.sort((a, b) => b.createdAt - a.createdAt);
    if (sort === 'priceAsc')
      list.sort(
        (a, b) =>
          (a.saleType === 'fixed'
            ? parseFloat(a.price?.amount || '0')
            : parseFloat(
                (a.auction?.currentBid || a.auction?.startPrice)?.amount || '0'
              )) -
          (b.saleType === 'fixed'
            ? parseFloat(b.price?.amount || '0')
            : parseFloat(
                (b.auction?.currentBid || b.auction?.startPrice)?.amount || '0'
              ))
      );
    if (sort === 'priceDesc')
      list.sort(
        (a, b) =>
          (b.saleType === 'fixed'
            ? parseFloat(b.price?.amount || '0')
            : parseFloat(
                (b.auction?.currentBid || b.auction?.startPrice)?.amount || '0'
              )) -
          (a.saleType === 'fixed'
            ? parseFloat(a.price?.amount || '0')
            : parseFloat(
                (a.auction?.currentBid || a.auction?.startPrice)?.amount || '0'
              ))
      );
    if (sort === 'endingSoon')
      list.sort(
        (a, b) =>
          (a.auction?.endTime || Infinity) - (b.auction?.endTime || Infinity)
      );

    return list;
  }, [allListings, saleType, q, token, min, max, sort]);

  // Sync URL (optionnel)
  React.useEffect(() => {
    const sp = new URLSearchParams();
    if (saleType !== 'all') sp.set('sale', saleType);
    if (sort !== 'newest') sp.set('sort', sort);
    if (q) sp.set('q', q);
    if (token) sp.set('token', token);
    if (min) sp.set('min', min);
    if (max) sp.set('max', max);
    setSearchParams(sp, { replace: true });
  }, [saleType, sort, q, token, min, max, setSearchParams]);

  if (!collection) {
    return (
      <div className='mx-auto max-w-5xl px-4 py-16 text-center'>
        <div className='text-2xl font-semibold'>Collection not found</div>
        <div className='mt-4'>
          <Link to='/marketplace/collections' className='text-sm underline'>
            Back to collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-7xl px-4 pb-10'>
      {/* Hero */}
      <div className='relative -mx-4 mb-6'>
        <div
          className='h-52 bg-center bg-cover'
          style={{
            backgroundImage: `url(${
              collection.banner || 'https://placehold.co/1600x420'
            })`
          }}
        />
        <div className='container mx-auto px-4'>
          <div className='-mt-10 flex items-end gap-4'>
            <img
              src={collection.logo}
              alt={collection.name}
              className='h-24 w-24 rounded-2xl border-4 border-white shadow-lg object-cover bg-white'
            />
            <div className='pb-2'>
              <h1 className='text-2xl font-semibold text-slate-900'>
                {collection.name}
              </h1>
              <div className='mt-1 flex flex-wrap items-center gap-2'>
                {collection.isOwnedByDinovox && (
                  <Badge tone='brand'>Dinovox</Badge>
                )}
                {collection.sources.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
                <span className='text-xs text-slate-500'>
                  /{collection.slug}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mb-6'>
        <Card>
          <CardHeader>
            <div className='text-xs text-slate-500'>Floor</div>
            <div className='text-lg font-semibold'>
              {formatToken(collection.floor)}
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div className='text-xs text-slate-500'>Vol. 24h</div>
            <div className='text-lg font-semibold'>
              {formatToken(collection.volume24h)}
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div className='text-xs text-slate-500'>Vol. 7d</div>
            <div className='text-lg font-semibold'>
              {formatToken(collection.volume7d)}
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div className='text-xs text-slate-500'>Items</div>
            <div className='text-lg font-semibold'>{collection.itemsCount}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div className='text-xs text-slate-500'>Active listings</div>
            <div className='text-lg font-semibold'>
              {collection.listingsActive}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Toolbar listings */}
      <Card>
        <CardHeader className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            <div className='inline-flex rounded-md border overflow-hidden'>
              <button
                onClick={() => setSaleType('all')}
                className={`px-3 h-9 text-sm ${
                  saleType === 'all' ? 'bg-slate-900 text-white' : 'bg-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSaleType('fixed')}
                className={`px-3 h-9 text-sm ${
                  saleType === 'fixed' ? 'bg-slate-900 text-white' : 'bg-white'
                }`}
              >
                Fixed
              </button>
              <button
                onClick={() => setSaleType('auction')}
                className={`px-3 h-9 text-sm ${
                  saleType === 'auction'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white'
                }`}
              >
                Auctions
              </button>
            </div>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Search item / id / seller…'
              className='h-9 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400 w-56'
            />

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className='h-9 rounded-md border bg-white px-3 text-sm'
            >
              <option value='newest'>Newest</option>
              <option value='priceAsc'>Price ↑</option>
              <option value='priceDesc'>Price ↓</option>
              <option value='endingSoon'>Ending soon</option>
            </select>
          </div>

          <div className='flex items-center gap-2'>
            <select
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className='h-9 rounded-md border bg-white px-3 text-sm'
            >
              <option value='EGLD'>EGLD</option>
              {/* Ajoute USDC / RIDE… si pertinent */}
            </select>
            <input
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder='Min'
              className='h-9 w-24 rounded-md border border-gray-300 bg-white px-3 text-sm'
              inputMode='decimal'
            />
            <span className='text-sm text-slate-500'>—</span>
            <input
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder='Max'
              className='h-9 w-24 rounded-md border border-gray-300 bg-white px-3 text-sm'
              inputMode='decimal'
            />
          </div>
        </CardHeader>

        {/* Grid listings */}
        <CardContent>
          {listings.length === 0 ? (
            <div className='py-16 text-center text-sm text-slate-500'>
              No listings match your filters.
            </div>
          ) : (
            <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'>
              {listings.map((l) => (
                <Card key={l.id}>
                  <CardHeader className='p-0'>
                    <div className='relative aspect-square bg-slate-100'>
                      <img
                        src={l.image}
                        alt={l.name}
                        className='h-full w-full object-cover'
                      />
                      <div className='absolute left-2 top-2 flex gap-1'>
                        <span className='text-xs px-2 py-1 rounded-md border bg-white/80'>
                          {l.source}
                        </span>
                        <span className='text-xs px-2 py-1 rounded-md border bg-white/80'>
                          {l.saleType}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='pt-4 space-y-1'>
                    <div className='font-medium'>{l.name}</div>
                    <div className='text-xs text-slate-500'>{l.identifier}</div>

                    {l.saleType === 'fixed' ? (
                      <div className='text-sm'>
                        Price:{' '}
                        <span className='font-semibold'>
                          {formatToken(l.price)}
                        </span>
                      </div>
                    ) : (
                      <div className='text-sm'>
                        Current bid:{' '}
                        <span className='font-semibold'>
                          {formatToken(
                            l.auction?.currentBid || l.auction?.startPrice
                          )}
                        </span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className='flex items-center justify-between'>
                    {l.saleType === 'auction' && l.auction ? (
                      <div className='text-xs text-slate-500'>
                        <Countdown endTime={l.auction.endTime} />
                      </div>
                    ) : (
                      <div />
                    )}
                    <Link
                      to={`/marketplace/listings/${encodeURIComponent(l.id)}`}
                      className='inline-flex h-9 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800'
                    >
                      {l.saleType === 'auction' ? 'Bid' : 'Buy now'}
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
