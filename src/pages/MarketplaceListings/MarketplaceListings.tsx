import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetAuctionsPaginated } from 'contracts/dinauction/helpers/useGetAuctionsPaginated';
import { Auction } from 'pages/Marketplace/Auction';
import { Breadcrumb } from 'components/ui/Breadcrumb';

/** ---------------- Types ---------------- **/
type MarketSource = 'dinovox' | 'xoxno';
type SaleType = 'fixed' | 'auction';

type Listing = {
  status: 'active' | 'sold' | 'cancelled' | 'ended';
};

/** ---------------- Mock data for filters ---------------- **/
const MOCK_COLLECTIONS = [
  { slug: 'dinovox', name: 'Dinovox' },
  { slug: 'dino-bones', name: 'Dino Bones' },
  { slug: 'x-dinosaurs', name: 'X Dinosaurs' }
];

/** ---------------- Petits composants UI ---------------- **/
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

/** ---------------- Page ---------------- **/
export const MarketplaceListings = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL -> state
  const sp = (key: string, fallback = '') => searchParams.get(key) || fallback;
  const spList = (key: string) =>
    (searchParams.get(key) || '').split(',').filter(Boolean);

  const [query, setQuery] = React.useState(sp('q'));
  const [sort, setSort] = React.useState<string>(sp('sort') || 'best');

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
  const pageSize = 8;

  // Fetch real auctions
  // Note: Filters are currently client-side state only as the hook doesn't support them all yet
  const { auctions, isLoading, error, hasMore } = useGetAuctionsPaginated({
    page,
    limit: pageSize,
    collection: collections.length === 1 ? collections[0] : null
  });

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
    if (page !== 1) sp.set('page', String(page));
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
    page,
    setSearchParams
  ]);

  // facet helpers
  const toggleInArray = <T,>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 space-y-6'>
      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: 'Marketplace', path: '/marketplace' },
          { label: 'Listings' }
        ]}
      />
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
            onChange={(e) => setSort(e.target.value)}
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
                  setSources(['dinovox']);
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
        <div className='space-y-3 min-h-[600px]'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-slate-600'>
              {/* Note: Total count is not available from paginated hook yet */}
              Page {page}
            </div>
            <div className='flex items-center gap-2'>
              <button
                className='h-9 rounded-md border px-3 text-sm disabled:opacity-50'
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
              >
                Prev
              </button>
              <button
                className='h-9 rounded-md border px-3 text-sm disabled:opacity-50'
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore || isLoading}
              >
                Next
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className='py-16 text-center text-sm text-slate-500'>
              Loading listings...
            </div>
          ) : error ? (
            <div className='py-16 text-center text-sm text-red-500'>
              Error loading listings: {error}
            </div>
          ) : auctions.length === 0 ? (
            <div className='py-16 text-center text-sm text-slate-500'>
              No listings found.
            </div>
          ) : (
            <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'>
              {auctions.map((l: any) => (
                <Auction key={l.auction_id} auction={l} />
              ))}
            </div>
          )}

          {/* Bottom pagination */}
          <div className='flex items-center justify-center gap-2 pt-2'>
            <button
              className='h-9 rounded-md border px-3 text-sm disabled:opacity-50'
              onClick={() => setPage(1)}
              disabled={page === 1 || isLoading}
            >
              « First
            </button>
            <button
              className='h-9 rounded-md border px-3 text-sm disabled:opacity-50'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
            >
              ‹ Prev
            </button>
            <span className='text-sm text-slate-600'>Page {page}</span>
            <button
              className='h-9 rounded-md border px-3 text-sm disabled:opacity-50'
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore || isLoading}
            >
              Next ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
