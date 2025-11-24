import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Breadcrumb } from 'components/ui/Breadcrumb';
import { useGetCollections } from 'helpers/api/getCollections';
import { useGetAuctionsPaginated } from 'contracts/dinauction/helpers/useGetAuctionsPaginated';
import { Auction } from 'pages/Marketplace/Auction';

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

/** ---------------- Types ---------------- **/
type SortKey = 'newest' | 'priceAsc' | 'priceDesc' | 'endingSoon';
type SaleType = 'all' | 'fixed' | 'auction';

/** ---------------- Main Component ---------------- **/
export const MarketplaceCollectionById = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const [saleType, setSaleType] = useState<SaleType>('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');

  // 1. Fetch Collection Details
  const { data: collection } = useGetCollections(id);

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

  // 4. Stats (Placeholder or derived)
  const stats = {
    floorPrice: undefined, // TODO: Fetch floor price
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
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(https://placehold.co/1600x420/1e293b/ffffff?text=${encodeURIComponent(
              collection?.name || 'Collection'
            )})`
          }}
        />
        <div className='container mx-auto px-4'>
          <div className='-mt-10 flex items-end gap-4'>
            <div className='h-24 w-24 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold'>
              {collection?.name?.charAt(0) || 'C'}
            </div>
            <div className='pb-2 flex-1'>
              <h1 className='text-2xl font-semibold text-slate-900'>
                {collection?.name || 'Unknown Collection'}
              </h1>
              <div className='mt-1 flex flex-wrap items-center gap-2'>
                <Badge tone='brand'>Dinovox Marketplace</Badge>
                <Badge>{collection?.type || 'NFT'}</Badge>
                <span className='text-xs text-slate-500'>
                  {collection?.collection}
                </span>
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
                  {(BigInt(stats.floorPrice) / BigInt(10 ** 18)).toString()}{' '}
                  {stats.floorToken}
                </span>
              ) : (
                '-'
              )}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className='text-xs text-slate-500'>Active Listings</div>
            <div className='text-lg font-semibold text-slate-900'>
              {stats.activeListings}
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

        <Card>
          <CardHeader>
            <div className='text-xs text-slate-500'>Type</div>
            <div className='text-lg font-semibold text-slate-900'>
              {collection?.type || 'NFT'}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Filters & Listings */}
      <Card>
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
    </div>
  );
};
