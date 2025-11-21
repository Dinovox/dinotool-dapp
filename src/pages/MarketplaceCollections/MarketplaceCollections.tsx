import React, { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useGetAccount } from 'lib';
import { useGetCollections } from 'helpers/api/accounts/getCollections';
import { useGetAuctionsPaginated } from 'contracts/dinauction/helpers/useGetAuctionsPaginated';
import { Auction } from 'pages/Marketplace/Auction';

type SaleType = 'all' | 'fixed' | 'auction';
type SortKey = 'newest' | 'priceAsc' | 'priceDesc' | 'endingSoon';

/** ---------------- UI Components ---------------- **/
const Badge: React.FC<
  React.PropsWithChildren<{ tone?: 'neutral' | 'brand' | 'success' | 'info' }>
> = ({ children, tone = 'neutral' }) => {
  const cls =
    tone === 'brand'
      ? 'border-amber-300 bg-amber-50 text-amber-700'
      : tone === 'success'
      ? 'border-green-300 bg-green-50 text-green-700'
      : tone === 'info'
      ? 'border-blue-300 bg-blue-50 text-blue-700'
      : 'border-gray-200 bg-gray-50 text-gray-700';
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cls}`}
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

/** ---------------- Main Component ---------------- **/
export const MarketplaceCollectionById = () => {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { address } = useGetAccount();

  // Filters from URL
  const initialSale = (searchParams.get('sale') as SaleType) || 'all';
  const initialSort = (searchParams.get('sort') as SortKey) || 'newest';
  const initialQ = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [saleType, setSaleType] = useState<SaleType>(initialSale);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [q, setQ] = useState(initialQ);
  const [page, setPage] = useState(initialPage);

  // Fetch collection data
  const {
    data: collection,
    loading: collectionLoading,
    error: collectionError
  } = useGetCollections(id);

  // Fetch auctions for this collection
  const {
    auctions,
    isLoading: auctionsLoading,
    error: auctionsError,
    hasMore
  } = useGetAuctionsPaginated({
    page,
    limit: 24,
    collection: id || null
  });

  // Filter and sort auctions
  const filteredAuctions = useMemo(() => {
    let list = [...auctions];

    // Filter by search query
    if (q.trim()) {
      const query = q.toLowerCase();
      list = list.filter((auction: any) => {
        const tokenId =
          auction.auctioned_tokens?.token_identifier?.toString() || '';
        const nonce = auction.auctioned_tokens?.token_nonce?.toString() || '';
        return (
          tokenId.toLowerCase().includes(query) ||
          nonce.toLowerCase().includes(query)
        );
      });
    }

    // Filter by sale type
    if (saleType === 'auction') {
      list = list.filter((auction: any) => {
        const minBid = auction.min_bid?.toString() || '0';
        const maxBid = auction.max_bid?.toString() || '0';
        return minBid !== maxBid || maxBid === '0';
      });
    } else if (saleType === 'fixed') {
      list = list.filter((auction: any) => {
        const minBid = auction.min_bid?.toString() || '0';
        const maxBid = auction.max_bid?.toString() || '0';
        return minBid === maxBid && maxBid !== '0';
      });
    }

    // Sort
    if (sort === 'newest') {
      list.sort((a: any, b: any) => {
        const aTime = a.start_time?.valueOf() || 0;
        const bTime = b.start_time?.valueOf() || 0;
        return bTime - aTime;
      });
    } else if (sort === 'endingSoon') {
      list.sort((a: any, b: any) => {
        const aEnd = a.deadline?.valueOf() || Infinity;
        const bEnd = b.deadline?.valueOf() || Infinity;
        return aEnd - bEnd;
      });
    }

    return list;
  }, [auctions, q, saleType, sort]);

  // Sync URL params
  React.useEffect(() => {
    const sp = new URLSearchParams();
    if (saleType !== 'all') sp.set('sale', saleType);
    if (sort !== 'newest') sp.set('sort', sort);
    if (q) sp.set('q', q);
    if (page !== 1) sp.set('page', page.toString());
    setSearchParams(sp, { replace: true });
  }, [saleType, sort, q, page, setSearchParams]);

  // Calculate stats from auctions
  const stats = useMemo(() => {
    const activeListings = auctions.length;

    // Calculate floor price (lowest current price)
    let floorPrice: string | null = null;
    let floorToken: string | null = null;

    auctions.forEach((auction: any) => {
      const currentBid = auction.current_bid?.amount?.toString();
      const minBid = auction.min_bid?.toString();
      const price = currentBid || minBid;
      const token = auction.payment_token?.toString();

      if (price && (!floorPrice || BigInt(price) < BigInt(floorPrice))) {
        floorPrice = price;
        floorToken = token;
      }
    });

    return {
      activeListings,
      floorPrice,
      floorToken,
      totalItems: collection?.name ? '...' : '0' // Would need additional API call
    };
  }, [auctions, collection]);

  if (collectionLoading) {
    return (
      <div className='mx-auto max-w-7xl px-4 py-16 text-center'>
        <div className='text-lg text-gray-500'>Loading collection...</div>
      </div>
    );
  }

  if (collectionError || !collection?.collection) {
    return (
      <div className='mx-auto max-w-7xl px-4 py-16 text-center'>
        <div className='text-2xl font-semibold text-gray-900'>
          Collection not found
        </div>
        <div className='mt-4'>
          <Link
            to='/marketplace/collections'
            className='text-sm text-blue-600 hover:text-blue-800 underline'
          >
            Back to collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-7xl px-4 pb-10'>
      {/* Hero Section */}
      <div className='relative -mx-4 mb-6'>
        <div
          className='h-52 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-center bg-cover'
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(https://placehold.co/1600x420/1e293b/ffffff?text=${encodeURIComponent(
              collection.name || 'Collection'
            )})`
          }}
        />
        <div className='container mx-auto px-4'>
          <div className='-mt-10 flex items-end gap-4'>
            <div className='h-24 w-24 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold'>
              {collection.name?.charAt(0) || 'C'}
            </div>
            <div className='pb-2 flex-1'>
              <h1 className='text-2xl font-semibold text-slate-900'>
                {collection.name || 'Unknown Collection'}
              </h1>
              <div className='mt-1 flex flex-wrap items-center gap-2'>
                <Badge tone='brand'>Dinovox Marketplace</Badge>
                <Badge>{collection.type || 'NFT'}</Badge>
                <span className='text-xs text-slate-500'>
                  {collection.collection}
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
              {collection.owner
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
              {collection.type || 'NFT'}
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

      {/* Back Link */}
      <div className='mt-6 text-center'>
        <Link
          to='/marketplace'
          className='text-sm text-slate-600 hover:text-slate-900 underline'
        >
          ← Back to Marketplace
        </Link>
      </div>
    </div>
  );
};
