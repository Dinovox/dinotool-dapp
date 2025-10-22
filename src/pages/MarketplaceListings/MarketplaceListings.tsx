import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

/** ---------------- Types ---------------- **/
type MarketSource = 'dinovox' | 'xoxno';
type SaleType = 'fixed' | 'auction';

type TokenAmount = {
  ticker: string;
  amount: string;
  decimals: number;
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

/** ---------------- Mock data ---------------- **/
const MOCK_COLLECTIONS = [
  { slug: 'dinovox', name: 'Dinovox' },
  { slug: 'dino-bones', name: 'Dino Bones' },
  { slug: 'x-dinosaurs', name: 'X Dinosaurs' }
];

function genMockListings(n = 64): Listing[] {
  const slugs = MOCK_COLLECTIONS.map((c) => c.slug);
  return Array.from({ length: n }).map((_, i) => {
    const slug = slugs[i % slugs.length];
    const isAuction = i % 3 === 1;
    return {
      id: `${slug}:${i + 1}`,
      source: i % 4 === 0 ? 'xoxno' : 'dinovox',
      saleType: isAuction ? 'auction' : 'fixed',
      identifier: `${slug.toUpperCase()}-${1000 + i}`,
      collectionSlug: slug,
      name: `${slug} #${1000 + i}`,
      image: 'https://placehold.co/600/png',
      seller: i % 5 === 0 ? 'erd1vip...aaaa' : 'erd1...abcd',
      price: !isAuction
        ? {
            ticker: 'EGLD',
            amount: (0.35 + (i % 20) * 0.02).toFixed(2),
            decimals: 18
          }
        : undefined,
      auction: isAuction
        ? {
            startPrice: { ticker: 'EGLD', amount: '0.20', decimals: 18 },
            currentBid: {
              ticker: 'EGLD',
              amount: (0.2 + (i % 7) * 0.06).toFixed(2),
              decimals: 18
            },
            startTime: Date.now() - 60 * 60 * 1000,
            endTime: Date.now() + (i + 1) * 15 * 60 * 1000,
            bidsCount: (i % 6) + 1
          }
        : undefined,
      status: (
        ['active', 'active', 'active', 'ended', 'sold'] as Listing['status'][]
      )[i % 5],
      createdAt: Date.now() - i * 3600 * 1000
    };
  });
}

const ALL_LISTINGS = genMockListings(96);

/** ---------------- Utils ---------------- **/
function formatToken(t?: TokenAmount) {
  if (!t) return '-';
  return `${t.amount} ${t.ticker}`;
}

function priceOf(l: Listing) {
  return l.saleType === 'fixed'
    ? parseFloat(l.price?.amount || '0')
    : parseFloat(
        (l.auction?.currentBid || l.auction?.startPrice)?.amount || '0'
      );
}

type SortKey = 'best' | 'newest' | 'priceAsc' | 'priceDesc' | 'endingSoon';

function sortListings(list: Listing[], sort: SortKey): Listing[] {
  const out = [...list];
  if (sort === 'newest') out.sort((a, b) => b.createdAt - a.createdAt);
  if (sort === 'priceAsc') out.sort((a, b) => priceOf(a) - priceOf(b));
  if (sort === 'priceDesc') out.sort((a, b) => priceOf(b) - priceOf(a));
  if (sort === 'endingSoon')
    out.sort(
      (a, b) =>
        (a.auction?.endTime || Infinity) - (b.auction?.endTime || Infinity)
    );
  if (sort === 'best') {
    out.sort((a, b) => {
      const score = (x: Listing) =>
        (x.saleType === 'auction' ? 2 : 0) +
        (x.auction
          ? Math.max(0, 1_000_000_000_000 - x.auction.endTime) / 10_000
          : 0) +
        (x.status === 'active' ? 1 : 0);
      return score(b) - score(a);
    });
  }
  return out;
}

/** ---------------- Petits composants UI ---------------- **/
const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className='inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700'>
    {children}
  </span>
);

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
export const MarketplaceListings = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL -> state
  const sp = (key: string, fallback = '') => searchParams.get(key) || fallback;
  const spList = (key: string) =>
    (searchParams.get(key) || '').split(',').filter(Boolean);

  const [query, setQuery] = React.useState(sp('q'));
  const [sort, setSort] = React.useState<SortKey>(
    (sp('sort') as SortKey) || 'best'
  );

  const [sources, setSources] = React.useState<MarketSource[]>(
    sp('sources')
      ? (sp('sources').split(',') as MarketSource[])
      : (['dinovox', 'xoxno'] as MarketSource[])
  );
  const [saleTypes, setSaleTypes] = React.useState<SaleType[]>(
    sp('sales')
      ? (sp('sales').split(',') as SaleType[])
      : (['fixed', 'auction'] as SaleType[])
  );
  const [status, setStatus] = React.useState<Array<Listing['status']>>(
    (spList('status') as any) || ['active']
  );
  const [collections, setCollections] = React.useState<string[]>(
    spList('collections')
  );

  const [token, setToken] = React.useState(sp('token', 'EGLD'));
  const [min, setMin] = React.useState(sp('min'));
  const [max, setMax] = React.useState(sp('max'));

  const [endingWithin, setEndingWithin] = React.useState(sp('endingWithin')); // minutes, auction only

  const [page, setPage] = React.useState<number>(
    parseInt(sp('page') || '1', 10)
  );
  const pageSize = 24;

  // compute filtered
  const filtered = React.useMemo(() => {
    let list = [...ALL_LISTINGS];

    // sources
    if (sources.length) list = list.filter((l) => sources.includes(l.source));
    // sale types
    if (saleTypes.length)
      list = list.filter((l) => saleTypes.includes(l.saleType));
    // status
    if (status.length) list = list.filter((l) => status.includes(l.status));
    // collections
    if (collections.length)
      list = list.filter((l) => collections.includes(l.collectionSlug));
    // search text
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.identifier.toLowerCase().includes(q) ||
          l.collectionSlug.toLowerCase().includes(q) ||
          l.seller.toLowerCase().includes(q)
      );
    }
    // token + price range
    if (token) {
      list = list.filter((l) => {
        if (l.saleType === 'fixed') return l.price?.ticker === token;
        return (
          (l.auction?.currentBid || l.auction?.startPrice)?.ticker === token
        );
      });
    }
    const minV = min ? parseFloat(min) : undefined;
    const maxV = max ? parseFloat(max) : undefined;
    if (minV !== undefined || maxV !== undefined) {
      list = list.filter((l) => {
        const v = priceOf(l);
        if (minV !== undefined && v < minV) return false;
        if (maxV !== undefined && v > maxV) return false;
        return true;
      });
    }
    // ending within (minutes)
    if (endingWithin) {
      const m = parseInt(endingWithin, 10);
      if (!Number.isNaN(m)) {
        list = list.filter((l) =>
          l.saleType === 'auction' && l.auction
            ? (l.auction.endTime - Date.now()) / 60000 <= m
            : false
        );
      }
    }

    // tri
    list = sortListings(list, sort);
    return list;
  }, [
    sources,
    saleTypes,
    status,
    collections,
    query,
    token,
    min,
    max,
    endingWithin,
    sort
  ]);

  // pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageClamped = Math.min(Math.max(1, page), totalPages);
  const items = React.useMemo(() => {
    const start = (pageClamped - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageClamped]);

  // sync URL
  React.useEffect(() => {
    const sp = new URLSearchParams();
    if (query) sp.set('q', query);
    if (sort !== 'best') sp.set('sort', sort);
    if (
      sources.length &&
      !(
        sources.length === 2 &&
        sources.includes('dinovox') &&
        sources.includes('xoxno')
      )
    )
      sp.set('sources', sources.join(','));
    if (
      saleTypes.length &&
      !(
        saleTypes.length === 2 &&
        saleTypes.includes('fixed') &&
        saleTypes.includes('auction')
      )
    )
      sp.set('sales', saleTypes.join(','));
    if (status.length && !(status.length === 1 && status[0] === 'active'))
      sp.set('status', status.join(','));
    if (collections.length) sp.set('collections', collections.join(','));
    if (token && token !== 'EGLD') sp.set('token', token);
    if (min) sp.set('min', min);
    if (max) sp.set('max', max);
    if (endingWithin) sp.set('endingWithin', endingWithin);
    if (pageClamped !== 1) sp.set('page', String(pageClamped));
    setSearchParams(sp, { replace: true });
  }, [
    query,
    sort,
    sources,
    saleTypes,
    status,
    collections,
    token,
    min,
    max,
    endingWithin,
    pageClamped,
    setSearchParams
  ]);

  // facet helpers
  const toggleInArray = <T,>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-2'>
        <div className='h-6 w-6 rounded-md bg-slate-200' />
        <h1 className='text-2xl font-semibold text-slate-900'>All listings</h1>
      </div>

      {/* Toolbar (search + sort) */}
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2 w-full md:max-w-xl'>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder='Search item / id / seller / collection…'
            className='h-10 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
          />
          <button
            className='h-10 rounded-md border px-3 text-sm'
            onClick={() => setQuery('')}
          >
            Clear
          </button>
        </div>

        <div className='flex items-center gap-2'>
          <label className='text-xs font-medium text-slate-600'>Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className='h-10 rounded-md border border-gray-300 bg-white px-3 text-sm'
          >
            <option value='best'>Best</option>
            <option value='newest'>Newest</option>
            <option value='priceAsc'>Price ↑</option>
            <option value='priceDesc'>Price ↓</option>
            <option value='endingSoon'>Ending soon</option>
          </select>
        </div>
      </div>

      {/* Layout: sidebar + grid */}
      <div className='grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6'>
        {/* Sidebar filters */}
        <Card>
          <CardHeader>
            <div className='text-sm font-semibold'>Filters</div>
          </CardHeader>
          <CardContent className='space-y-5'>
            {/* Sources */}
            <div>
              <div className='mb-2 text-xs font-medium text-slate-600'>
                Sources
              </div>
              <div className='flex flex-col gap-2'>
                <label className='inline-flex items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={sources.includes('dinovox')}
                    onChange={() => {
                      setSources(toggleInArray(sources, 'dinovox'));
                      setPage(1);
                    }}
                  />
                  Dinovox
                </label>
                <label className='inline-flex items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={sources.includes('xoxno')}
                    onChange={() => {
                      setSources(toggleInArray(sources, 'xoxno'));
                      setPage(1);
                    }}
                  />
                  Xoxno
                </label>
              </div>
            </div>

            {/* Sale type */}
            <div>
              <div className='mb-2 text-xs font-medium text-slate-600'>
                Sale type
              </div>
              <div className='flex flex-col gap-2'>
                <label className='inline-flex items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={saleTypes.includes('fixed')}
                    onChange={() => {
                      setSaleTypes(toggleInArray(saleTypes, 'fixed'));
                      setPage(1);
                    }}
                  />
                  Fixed price
                </label>
                <label className='inline-flex items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={saleTypes.includes('auction')}
                    onChange={() => {
                      setSaleTypes(toggleInArray(saleTypes, 'auction'));
                      setPage(1);
                    }}
                  />
                  Auction
                </label>
              </div>
            </div>

            {/* Status */}
            <div>
              <div className='mb-2 text-xs font-medium text-slate-600'>
                Status
              </div>
              <div className='flex flex-col gap-2'>
                {(
                  [
                    'active',
                    'ended',
                    'sold',
                    'cancelled'
                  ] as Listing['status'][]
                ).map((s) => (
                  <label
                    key={s}
                    className='inline-flex items-center gap-2 text-sm'
                  >
                    <input
                      type='checkbox'
                      checked={status.includes(s)}
                      onChange={() => {
                        setStatus(toggleInArray(status, s));
                        setPage(1);
                      }}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            {/* Collections */}
            <div>
              <div className='mb-2 text-xs font-medium text-slate-600'>
                Collections
              </div>
              <div className='flex flex-col gap-2 max-h-40 overflow-auto pr-1'>
                {MOCK_COLLECTIONS.map((c) => (
                  <label
                    key={c.slug}
                    className='inline-flex items-center gap-2 text-sm'
                  >
                    <input
                      type='checkbox'
                      checked={collections.includes(c.slug)}
                      onChange={() => {
                        setCollections(toggleInArray(collections, c.slug));
                        setPage(1);
                      }}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
              <div className='mt-2'>
                <button
                  className='text-xs underline'
                  onClick={() => setCollections([])}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Token + price */}
            <div>
              <div className='mb-2 text-xs font-medium text-slate-600'>
                Currency & Price
              </div>
              <div className='flex items-center gap-2 mb-2'>
                <select
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    setPage(1);
                  }}
                  className='h-9 rounded-md border bg-white px-2 text-sm'
                >
                  <option value='EGLD'>EGLD</option>
                  {/* Ajoute d'autres tokens si besoin */}
                </select>
                <input
                  value={min}
                  onChange={(e) => {
                    setMin(e.target.value);
                    setPage(1);
                  }}
                  placeholder='Min'
                  className='h-9 w-24 rounded-md border border-gray-300 bg-white px-2 text-sm'
                  inputMode='decimal'
                />
                <span className='text-sm text-slate-500'>—</span>
                <input
                  value={max}
                  onChange={(e) => {
                    setMax(e.target.value);
                    setPage(1);
                  }}
                  placeholder='Max'
                  className='h-9 w-24 rounded-md border border-gray-300 bg-white px-2 text-sm'
                  inputMode='decimal'
                />
              </div>
              <div className='text-xs text-slate-500'>
                For auctions, we use current bid (or start price).
              </div>
            </div>

            {/* Ending within */}
            <div>
              <div className='mb-2 text-xs font-medium text-slate-600'>
                Ending within (minutes)
              </div>
              <input
                value={endingWithin}
                onChange={(e) => {
                  setEndingWithin(e.target.value);
                  setPage(1);
                }}
                placeholder='e.g. 30'
                className='h-9 w-28 rounded-md border border-gray-300 bg-white px-2 text-sm'
                inputMode='numeric'
              />
            </div>

            {/* Reset */}
            <div className='pt-2'>
              <button
                onClick={() => {
                  setQuery('');
                  setSort('best');
                  setSources(['dinovox', 'xoxno']);
                  setSaleTypes(['fixed', 'auction']);
                  setStatus(['active']);
                  setCollections([]);
                  setToken('EGLD');
                  setMin('');
                  setMax('');
                  setEndingWithin('');
                  setPage(1);
                }}
                className='h-9 w-full rounded-md border bg-white text-sm'
              >
                Reset filters
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-slate-600'>
              {filtered.length} results • page {pageClamped}/{totalPages}
            </div>
            <div className='flex items-center gap-2'>
              <button
                className='h-9 rounded-md border px-3 text-sm disabled:opacity-50'
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageClamped <= 1}
              >
                Prev
              </button>
              <button
                className='h-9 rounded-md border px-3 text-sm disabled:opacity-50'
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageClamped >= totalPages}
              >
                Next
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className='py-16 text-center text-sm text-slate-500'>
              No listings match your filters.
            </div>
          ) : (
            <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'>
              {items.map((l) => (
                <Card key={l.id}>
                  <CardHeader className='p-0'>
                    <div className='relative aspect-square bg-slate-100'>
                      <img
                        src={l.image}
                        alt={l.name}
                        className='h-full w-full object-cover'
                      />
                      <div className='absolute left-2 top-2 flex gap-1'>
                        <Badge>{l.source}</Badge>
                        <Badge>{l.saleType}</Badge>
                        {l.status !== 'active' && <Badge>{l.status}</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='pt-4 space-y-1'>
                    <div className='font-medium'>{l.name}</div>
                    <div className='text-xs text-slate-500'>{l.identifier}</div>
                    <div className='text-sm'>
                      {l.saleType === 'fixed' ? (
                        <>
                          Price:{' '}
                          <span className='font-semibold'>
                            {formatToken(l.price)}
                          </span>
                        </>
                      ) : (
                        <>
                          Current bid:{' '}
                          <span className='font-semibold'>
                            {formatToken(
                              l.auction?.currentBid || l.auction?.startPrice
                            )}
                          </span>
                        </>
                      )}
                    </div>
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

          {/* Bottom pagination */}
          <div className='flex items-center justify-center gap-2 pt-2'>
            <button
              className='h-9 rounded-md border px-3 text-sm disabled:opacity-50'
              onClick={() => setPage(1)}
              disabled={pageClamped === 1}
            >
              « First
            </button>
            <button
              className='h-9 rounded-md border px-3 text-sm disabled:opacity-50'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pageClamped === 1}
            >
              ‹ Prev
            </button>
            <span className='text-sm text-slate-600'>
              Page {pageClamped} / {totalPages}
            </span>
            <button
              className='h-9 rounded-md border px-3 text-sm disabled:opacity-50'
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageClamped === totalPages}
            >
              Next ›
            </button>
            <button
              className='h-9 rounded-md border px-3 text-sm disabled:opacity-50'
              onClick={() => setPage(totalPages)}
              disabled={pageClamped === totalPages}
            >
              Last »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
