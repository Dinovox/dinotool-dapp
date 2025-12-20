import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Breadcrumb } from 'components/ui/Breadcrumb';
import { useGetAccountCollections } from 'helpers/api/accounts/useGetAccountCollections';
import {
  marketplaceContractAddress,
  dinovox_collections,
  friends_collections
} from 'config';
import DisplayNftByToken from 'helpers/DisplayNftByToken';
import { useGetCollectionStats } from 'helpers/api/useGetCollectionStats';
import { useGetCollectionBranding } from 'helpers/api/useGetCollectionBranding';
import { FormatAmount } from 'helpers/api/useGetEsdtInformations';

type MarketSource = 'local' | 'xoxno';

type TokenAmount = {
  ticker: string;
  amount: string;
  decimals: number;
};

type Collection = {
  collection: string;
  name: string;
  logo: string;
  banner?: string;
  itemsCount: number;
  floor?: TokenAmount;
  volume24h?: TokenAmount;
  volume7d?: TokenAmount;
  listingsActive: number;
  isOwnedByDinovox?: boolean;
  isFriendOfDinovox?: boolean;
  sources: MarketSource[];
};

/** ---------------- Utils ---------------- **/
function toNum(t?: TokenAmount) {
  if (!t) return 0;
  const n = parseFloat(t.amount);
  return Number.isFinite(n) ? n : 0;
}

type SortKey =
  | 'best'
  | 'floorAsc'
  | 'floorDesc'
  | 'vol24hDesc'
  | 'vol7dDesc'
  | 'itemsDesc'
  | 'listingsDesc';

function sortCollections(list: Collection[], key: SortKey): Collection[] {
  const copy = [...list];
  switch (key) {
    case 'floorAsc':
      copy.sort((a, b) => toNum(a.floor) - toNum(b.floor));
      break;
    case 'floorDesc':
      copy.sort((a, b) => toNum(b.floor) - toNum(a.floor));
      break;
    case 'vol24hDesc':
      copy.sort((a, b) => toNum(b.volume24h) - toNum(a.volume24h));
      break;
    case 'vol7dDesc':
      copy.sort((a, b) => toNum(b.volume7d) - toNum(a.volume7d));
      break;
    case 'itemsDesc':
      copy.sort((a, b) => b.itemsCount - a.itemsCount);
      break;
    case 'listingsDesc':
      copy.sort((a, b) => b.listingsActive - a.listingsActive);
      break;
    case 'best':
    default:
      // score simple mettant en avant volume 7j + annonces actives + floor raisonnable
      copy.sort((a, b) => {
        const aScore =
          toNum(a.volume7d) * 5 +
          a.listingsActive * 2 +
          (a.floor ? 1 / Math.max(0.0001, toNum(a.floor)) : 0);
        const bScore =
          toNum(b.volume7d) * 5 +
          b.listingsActive * 2 +
          (b.floor ? 1 / Math.max(0.0001, toNum(b.floor)) : 0);
        return bScore - aScore;
      });
  }
  return copy;
}

function formatToken(t?: TokenAmount) {
  if (!t) return '-';
  return `${t.amount} ${t.ticker}`;
}

/** ---------------- Mini UI ---------------- **/
const Badge = ({
  children,
  tone = 'neutral' as 'neutral' | 'brand' | 'info'
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'info';
}) => {
  const cls =
    tone === 'brand'
      ? 'border-amber-300 bg-amber-50 text-amber-700'
      : tone === 'info'
      ? 'border-blue-300 bg-blue-50 text-blue-700'
      : 'border-gray-200 bg-gray-50 text-gray-700';
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${cls}`}
    >
      {children}
    </span>
  );
};

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

const CollectionCard = ({ collection }: { collection: Collection }) => {
  const { stats } = useGetCollectionStats(collection.collection);
  const { branding } = useGetCollectionBranding(collection.collection);

  return (
    <Card>
      {/* Aperçu plus large */}
      <div
        className='h-40 w-full bg-center bg-cover rounded-t-2xl bg-slate-100'
        style={{
          backgroundImage: `url(${
            branding?.images.banner || collection.banner || ''
          })`
        }}
      />

      {/* avatar/logo plus grand */}
      <CardHeader className='-mt-12 flex items-center gap-4'>
        {branding?.images.logo ? (
          <img
            src={branding.images.logo}
            alt={collection.name}
            className='h-20 w-20 rounded-2xl object-cover border-4 border-white shadow bg-white'
          />
        ) : (
          <DisplayNftByToken
            tokenIdentifier={collection.collection}
            nonce='1'
            variant='media-only'
            className='h-20 w-20 rounded-2xl object-cover border-4 border-white shadow bg-white'
          />
        )}
        <div className='space-y-1 overflow-hidden'>
          <div className='text-base font-semibold text-slate-900 truncate'>
            {collection.name}
          </div>
          <div className='text-xs text-slate-500 truncate'>
            {collection.collection}
          </div>
          <div className='flex flex-wrap gap-1'>
            {/* badge “owned” mis en avant */}
            {collection.isOwnedByDinovox && <Badge tone='brand'>DinoVox</Badge>}
            {/* badge “friends” */}
            {collection.isFriendOfDinovox && <Badge tone='info'>Friends</Badge>}

            {/* Branding Tags */}
            {branding?.branding?.tags && branding.branding.tags.length > 0
              ? branding.branding.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))
              : /* sources fallback (excluding local) */
                collection.sources
                  .filter((s) => s !== 'local')
                  .map((s) => <Badge key={s}>{s}</Badge>)}
          </div>
        </div>
      </CardHeader>

      <CardContent className='grid grid-cols-2 gap-4'>
        <div>
          <div className='text-xs text-slate-500'>Floor</div>
          <div className='text-sm font-medium text-slate-900'>
            {stats?.floor_ask_egld ? (
              <FormatAmount amount={stats.floor_ask_egld} identifier='EGLD' />
            ) : (
              '-'
            )}
          </div>
        </div>
        <div>
          <div className='text-xs text-slate-500'>Listings</div>
          <div className='text-sm font-medium text-slate-900'>
            {collection.listingsActive}
          </div>
        </div>
        <div>
          <div className='text-xs text-slate-500'>Vol. 24h</div>
          <div className='text-sm font-medium text-slate-900'>
            {stats?.volume_24h ? (
              <FormatAmount amount={stats.volume_24h} identifier='EGLD' />
            ) : (
              '-'
            )}
          </div>
        </div>
        <div>
          <div className='text-xs text-slate-500'>Vol. 7d</div>
          <div className='text-sm font-medium text-slate-900'>
            {stats?.volume_7d ? (
              <FormatAmount amount={stats.volume_7d} identifier='EGLD' />
            ) : (
              '-'
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Link
          to={`/marketplace/collections/${collection.collection}`}
          className='inline-flex h-9 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800'
        >
          View collection
        </Link>
      </CardFooter>
    </Card>
  );
};
/** ---------------- Page ---------------- **/
export const MarketplaceCollections = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [inputValue, setInputValue] = useState(initialSearch);
  const [query, setQuery] = useState(initialSearch);
  const [sort, setSort] = useState<SortKey>('best');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const handleSearch = () => {
    setQuery(inputValue);
    setPage(1);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (inputValue) {
        newParams.set('search', inputValue);
      } else {
        newParams.delete('search');
      }
      return newParams;
    });
  };

  // Fetch collections from the marketplace contract account
  const {
    collections: accountCollections,
    loading,
    error
  } = useGetAccountCollections(
    marketplaceContractAddress,
    pageSize,
    (page - 1) * pageSize,
    query
  );

  // Map API data to UI Collection type
  const collections = useMemo(() => {
    return accountCollections.map((c) => ({
      collection: c.collection,
      name: c.name || c.ticker,
      logo: c.url || 'https://placehold.co/160/png?text=?',
      banner: undefined,
      itemsCount: c.count,
      listingsActive: c.count, // Assuming count represents active items in the marketplace contract
      isOwnedByDinovox: dinovox_collections.includes(c.collection),
      isFriendOfDinovox: friends_collections.includes(c.collection),
      sources: ['local'] as MarketSource[],
      floor: undefined,
      volume24h: undefined,
      volume7d: undefined
    }));
  }, [accountCollections]);

  const filtered = useMemo(() => {
    let out = [...collections];

    // Filter by ownership/friendship (OR logic)
    if (ownedOnly || friendsOnly) {
      out = out.filter((c) => {
        if (ownedOnly && c.isOwnedByDinovox) return true;
        if (friendsOnly && c.isFriendOfDinovox) return true;
        return false;
      });
    }

    // texte
    // if (query.trim()) {
    //   const q = query.toLowerCase();
    //   out = out.filter(
    //     (c) =>
    //       c.name.toLowerCase().includes(q) ||
    //       c.collection.toLowerCase().includes(q)
    //   );
    // }

    return sortCollections(out, sort);
  }, [collections, query, sort, ownedOnly, friendsOnly]);

  if (loading) {
    return (
      <div className='mx-auto max-w-7xl px-4 py-16 text-center'>
        <div className='text-lg text-gray-500'>Loading collections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='mx-auto max-w-7xl px-4 py-16 text-center'>
        <div className='text-lg text-red-500'>
          Error loading collections: {error}
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 space-y-6'>
      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: 'Marketplace', path: '/marketplace' },
          { label: 'Collections' }
        ]}
      />
      {/* Header */}
      <div className='flex items-center gap-2'>
        <div className='h-6 w-6 rounded-md bg-slate-200' />
        <h1 className='text-2xl font-semibold text-slate-900'>Collections</h1>
      </div>

      {/* Toolbar */}
      <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
        <div className='flex items-center gap-2 w-full md:max-w-xl'>
          <div className='flex-1 flex flex-col gap-2'>
            <label className='text-xs font-medium text-slate-600'>Search</label>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder='Search by collection name…'
              className='h-10 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400 w-full'
            />
          </div>
          <button
            onClick={handleSearch}
            className='mt-auto h-10 px-4 rounded-md border border-gray-200 bg-gray-100 text-sm font-medium hover:bg-gray-200 active:bg-gray-300 transition text-slate-900'
          >
            Search
          </button>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <label className='inline-flex items-center gap-2 text-sm text-slate-700'>
            <input
              type='checkbox'
              checked={ownedOnly}
              onChange={(e) => setOwnedOnly(e.target.checked)}
            />
            Owned by DinoVox
          </label>

          <label className='inline-flex items-center gap-2 text-sm text-slate-700'>
            <input
              type='checkbox'
              checked={friendsOnly}
              onChange={(e) => setFriendsOnly(e.target.checked)}
            />
            Friends of DinoVox
          </label>

          {/* <div className='flex items-center gap-2'>
            <label className='text-xs font-medium text-slate-600'>Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className='h-10 rounded-md border border-gray-300 bg-white px-3 text-sm'
            >
              <option value='best'>Best</option>
              <option value='floorAsc'>Floor ↑</option>
              <option value='floorDesc'>Floor ↓</option>
              <option value='vol24hDesc'>Vol. 24h ↓</option>
              <option value='vol7dDesc'>Vol. 7d ↓</option>
              <option value='itemsDesc'>Items ↓</option>
              <option value='listingsDesc'>Listings ↓</option>
            </select>
          </div> */}
        </div>
      </div>

      {/* Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
        {filtered.map((c) => (
          <CollectionCard key={c.collection} collection={c} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className='text-center text-sm text-slate-500 py-16'>
          No collections match your filters.
        </div>
      )}

      {/* Pagination */}
      <div className='mt-8 flex items-center justify-center gap-2'>
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
          disabled={accountCollections.length < pageSize}
          className='h-9 px-4 rounded-md border bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
        >
          Next
        </button>
      </div>
    </div>
  );
};
