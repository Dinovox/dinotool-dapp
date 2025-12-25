import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetAuctionsPaginated } from 'contracts/dinauction/helpers/useGetAuctionsPaginated';
import { Auction } from 'pages/Marketplace/Auction';
import { Breadcrumb } from 'components/ui/Breadcrumb';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from 'hooks/useLoadTranslations';

/** ---------------- Types ---------------- **/
type MarketSource = 'dinovox' | 'xoxno';
type SaleType = 'fixed' | 'auction';

type Listing = {
  status: 'active' | 'sold' | 'cancelled' | 'ended';
};

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

  const [query, setQuery] = React.useState(sp('q'));
  const [page, setPage] = React.useState<number>(
    parseInt(sp('page') || '1', 10)
  );
  const { t } = useTranslation();
  const pageSize = 12;

  // Fetch real auctions
  const { auctions, isLoading, error, hasMore } = useGetAuctionsPaginated({
    page,
    limit: pageSize,
    collection: null
  });

  // sync URL
  React.useEffect(() => {
    const sp = new URLSearchParams();
    if (page !== 1) sp.set('page', String(page));
    setSearchParams(sp, { replace: true });
  }, [page, setSearchParams]);

  const handleSearch = () => {
    if (query.trim()) {
      window.location.href = `/marketplace/collections?search=${encodeURIComponent(
        query
      )}`;
    }
  };

  const loading = useLoadTranslations('marketplace');
  return (
    <div className='mx-auto max-w-7xl px-4 py-6 space-y-6'>
      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: t('marketplace:marketplace'), path: '/marketplace' },
          { label: t('marketplace:listings') }
        ]}
      />
      {/* Header */}
      <div className='flex items-center gap-2'>
        <div className='h-6 w-6 rounded-md bg-slate-200' />
        <h1 className='text-2xl font-semibold text-slate-900'>
          {t('marketplace:listings')}
        </h1>
      </div>

      {/* Toolbar (search only) */}
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2 w-full md:max-w-xl'>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder='Search item / id / seller / collection…'
            className='h-10 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
          />
          <button
            className='h-10 rounded-md border px-3 text-sm hover:bg-slate-50'
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
      </div>

      {/* Layout: grid only (no sidebar) */}
      <div className='min-h-[600px]'>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-slate-600'>Page {page}</div>
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
