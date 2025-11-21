// src/pages/Marketplace/index.tsx
import { decodeBigNumber } from '@multiversx/sdk-core/out';
import { ActionWithdraw } from 'contracts/dinauction/actions/Withdraw';
import { useGetAuctionsPaginated } from 'contracts/dinauction/helpers/useGetAuctionsPaginated';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import bignumber from 'bignumber.js';
import { useNft } from 'helpers/contexts/NftContext';
import DisplayNftByToken from 'helpers/DisplayNftByToken';
import { Auction } from './Auction';
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
  sources: MarketSource[];
};

type SortKey =
  | 'listings:best'
  | 'listings:priceAsc'
  | 'listings:priceDesc'
  | 'listings:newest'
  | 'listings:endingSoon';

type ListingFilters = {
  sources: MarketSource[];
  saleTypes: SaleType[];
  token?: string;
  priceMin?: string;
  priceMax?: string;
  status?: Array<'active' | 'ended' | 'sold' | 'cancelled'>;
  collections?: string[];
  endingWithin?: number;
};

import { useGetAccountCollections } from 'helpers/api/accounts/useGetAccountCollections';
import { marketplaceContractAddress } from 'config';

// ... (imports remain the same)

// ... (types remain the same)

/** ---------- MOCKS ---------- **/
// MOCK_COLLECTIONS removed

const MOCK_LISTINGS: Listing[] = Array.from({ length: 16 }).map((_, i) => ({
  id: `dinovox:${i + 1}`,
  source: i % 3 === 0 ? 'xoxno' : 'dinovox',
  saleType: i % 2 === 0 ? 'fixed' : 'auction',
  identifier: `DINOVOX-${1000 + i}`,
  collectionSlug: 'dinovox',
  name: `Dino #${1000 + i}`,
  image: 'https://placehold.co/512/png',
  seller: 'erd1...abcd',
  price:
    i % 2 === 0
      ? { ticker: 'EGLD', amount: (0.4 + i * 0.01).toFixed(2), decimals: 18 }
      : undefined,
  auction:
    i % 2 === 1
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
}));

/** ---------- Utils tri/filtre ---------- **/
function applyListingFilters(
  list: Listing[],
  filters: ListingFilters
): Listing[] {
  return list.filter((l) => {
    if (filters.sources?.length && !filters.sources.includes(l.source))
      return false;
    if (filters.saleTypes?.length && !filters.saleTypes.includes(l.saleType))
      return false;
    if (
      filters.collections?.length &&
      !filters.collections.includes(l.collectionSlug)
    )
      return false;
    if (filters.status?.length && !filters.status.includes(l.status))
      return false;
    if (
      filters.token &&
      l.saleType === 'fixed' &&
      l.price?.ticker === filters.token
    ) {
      const p = parseFloat(l.price.amount);
      if (filters.priceMin && p < parseFloat(filters.priceMin)) return false;
      if (filters.priceMax && p > parseFloat(filters.priceMax)) return false;
    }
    if (filters.endingWithin && l.saleType === 'auction' && l.auction) {
      const minutesLeft = Math.max(0, (l.auction.endTime - Date.now()) / 60000);
      if (minutesLeft > filters.endingWithin) return false;
    }
    return true;
  });
}

function sortListings(list: Listing[], sort: SortKey): Listing[] {
  const copy = [...list];
  if (sort === 'listings:priceAsc')
    copy.sort(
      (a, b) =>
        parseFloat(a.price?.amount || '0') - parseFloat(b.price?.amount || '0')
    );
  if (sort === 'listings:priceDesc')
    copy.sort(
      (a, b) =>
        parseFloat(b.price?.amount || '0') - parseFloat(a.price?.amount || '0')
    );
  if (sort === 'listings:newest')
    copy.sort((a, b) => b.createdAt - a.createdAt);
  if (sort === 'listings:endingSoon')
    copy.sort(
      (a, b) =>
        (a.auction?.endTime || Infinity) - (b.auction?.endTime || Infinity)
    );
  if (sort === 'listings:best') {
    copy.sort((a, b) => {
      const aScore =
        (a.saleType === 'auction' ? 2 : 0) +
        (a.auction
          ? Math.max(0, 1_000_000_000_000 - a.auction.endTime) / 10_000
          : 0);
      const bScore =
        (b.saleType === 'auction' ? 2 : 0) +
        (b.auction
          ? Math.max(0, 1_000_000_000_000 - b.auction.endTime) / 10_000
          : 0);
      return bScore - aScore;
    });
  }
  return copy;
}

function formatToken(t?: TokenAmount) {
  if (!t) return '-';
  return `${t.amount} ${t.ticker}`;
}

function Countdown({ endTime }: { endTime: number }) {
  const [now, setNow] = useState(Date.now());
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

/** ---------- Mini-UI Tailwind pur (pas de shadcn) ---------- **/
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className='rounded-2xl border border-gray-200 bg-white shadow-sm'>
      {children}
    </div>
  );
}
function CardHeader({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
function CardContent({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-4 pt-0 ${className}`}>{children}</div>;
}
function CardFooter({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-4 pt-0 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

const Button = (props: React.ComponentProps<'button'>) => (
  <button
    {...props}
    className={`h-9 rounded-md px-3 text-sm font-medium border border-gray-200 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition ${
      props.className || ''
    }`}
  />
);

const Input = (props: React.ComponentProps<'input'>) => (
  <input
    {...props}
    className={`h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400 ${
      props.className || ''
    }`}
  />
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className='inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700'>
    {children}
  </span>
);

/** ---------- Page ---------- **/
export const Marketplace = () => {
  const [sort, setSort] = useState<SortKey>('listings:best');
  const [filters] = useState<ListingFilters>({
    sources: ['dinovox', 'xoxno'],
    saleTypes: ['fixed', 'auction']
  });
  const [search, setSearch] = useState('');

  // Fetch collections for Trending section
  const { collections: accountCollections } = useGetAccountCollections(
    marketplaceContractAddress
  );

  const collections = useMemo(() => {
    return accountCollections.slice(0, 3).map((c) => ({
      slug: c.collection,
      name: c.name || c.ticker,
      logo: c.url || 'https://placehold.co/120x120/png',
      banner: c.assets?.pngUrl || undefined, // Use asset image as banner fallback if needed, or keep undefined
      itemsCount: c.count,
      floor: undefined,
      volume24h: undefined,
      volume7d: undefined,
      listingsActive: c.count,
      sources: ['dinovox'] as MarketSource[]
    }));
  }, [accountCollections]);

  const filteredListings = useMemo(() => {
    let list = applyListingFilters(MOCK_LISTINGS, filters);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.collectionSlug.toLowerCase().includes(q) ||
          l.identifier.toLowerCase().includes(q)
      );
    }
    return sortListings(list, sort);
  }, [filters, sort, search]);

  const liveAuctions = useMemo(
    () => filteredListings.filter((l) => l.saleType === 'auction').slice(0, 8),
    [filteredListings]
  );
  const newest = useMemo(
    () => sortListings(filteredListings, 'listings:newest').slice(0, 12),
    [filteredListings]
  );

  const listings = useGetAuctionsPaginated({ page: 1, limit: 8 });

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 space-y-6'>
      {/* Header + CTA Sell */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='h-6 w-6 rounded-md bg-slate-200' />
          <h1 className='text-2xl font-semibold text-slate-900'>Marketplace</h1>
        </div>

        {/* CTA SELL */}
        <Link
          to='/marketplace/sell'
          className='inline-flex h-9 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800'
        >
          Sell an item
        </Link>
      </div>

      {/* Toolbar */}
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2 w-full md:max-w-md'>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search collections or listings...'
          />
          <Button onClick={() => null}>Search</Button>
        </div>

        <div className='flex items-center gap-2'>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className='h-9 rounded-md border border-gray-300 bg-white px-3 text-sm'
          >
            <option value='listings:best'>Best first</option>
            <option value='listings:endingSoon'>Ending soon</option>
            <option value='listings:newest'>Newest</option>
            <option value='listings:priceAsc'>Price ↑</option>
            <option value='listings:priceDesc'>Price ↓</option>
          </select>
        </div>
      </div>

      {/* Collections */}
      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold text-slate-900'>
              Trending collections
            </h2>
            <p className='text-sm text-slate-500'>
              Unified view across local & Xoxno
            </p>
          </div>
          <Link
            to='/marketplace/collections'
            className='text-sm underline text-slate-700 hover:text-slate-900'
          >
            View all
          </Link>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {collections.map((c) => (
            <Card key={c.slug}>
              {c.banner && (
                <div
                  className='h-24 w-full bg-cover'
                  style={{ backgroundImage: `url(${c.banner})` }}
                />
              )}
              <CardHeader className='flex items-center gap-4'>
                <img
                  src={c.logo}
                  alt={c.name}
                  className='h-14 w-14 rounded-xl object-cover'
                />
                <div className='space-y-1'>
                  <div className='text-base font-medium text-slate-900'>
                    {c.name}
                  </div>
                  <div className='text-sm text-slate-500'>
                    {c.itemsCount} items • Floor {formatToken(c.floor)}
                  </div>
                </div>
                <div className='ml-auto flex gap-1'>
                  {c.sources.map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardFooter>
                <Link
                  className='text-sm underline text-slate-700 hover:text-slate-900'
                  to={`/marketplace/collections/${c.slug}`}
                >
                  View collection
                </Link>
                <div className='text-sm text-slate-500'>
                  {c.listingsActive} listings
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Live auctions */}
      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-slate-900'>Listings</h2>
          <Link
            to='/marketplace/listings'
            className='text-sm underline text-slate-700 hover:text-slate-900'
          >
            View more
          </Link>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'>
          {listings?.auctions.map((l) => (
            <Auction key={l.auction_id} auction={l} />
          ))}
        </div>
      </section>
    </div>
  );
};
