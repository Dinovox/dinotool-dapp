import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type MarketSource = 'local' | 'xoxno';

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
  // simple tag interne pour vos collections
  isOwnedByDinovox?: boolean;
  // infos d’affichage, sans incidence on-chain
  sources: MarketSource[];
};

/** ---------------- MOCK DATA ---------------- **/
const MOCK_COLLECTIONS: Collection[] = [
  {
    slug: 'dinovox',
    name: 'Dinovox',
    logo: 'https://placehold.co/160/png?text=D',
    banner: 'https://placehold.co/1600x400/png?text=Dinovox',
    itemsCount: 1234,
    floor: { ticker: 'EGLD', amount: '1.25', decimals: 18 },
    volume24h: { ticker: 'EGLD', amount: '250', decimals: 18 },
    volume7d: { ticker: 'EGLD', amount: '1100', decimals: 18 },
    listingsActive: 48,
    isOwnedByDinovox: true,
    sources: ['local']
  },
  {
    slug: 'dino-bones',
    name: 'Dino Bones',
    logo: 'https://placehold.co/160/png?text=B',
    banner: 'https://placehold.co/1600x400/png?text=BONES',
    itemsCount: 420,
    floor: { ticker: 'EGLD', amount: '0.72', decimals: 18 },
    volume24h: { ticker: 'EGLD', amount: '35', decimals: 18 },
    volume7d: { ticker: 'EGLD', amount: '210', decimals: 18 },
    listingsActive: 12,
    isOwnedByDinovox: false,
    sources: ['local']
  },
  {
    slug: 'x-dinosaurs',
    name: 'X Dinosaurs',
    logo: 'https://placehold.co/160/png?text=X',
    banner: 'https://placehold.co/1600x400/png?text=X+Dinos',
    itemsCount: 980,
    floor: { ticker: 'EGLD', amount: '0.55', decimals: 18 },
    volume24h: { ticker: 'EGLD', amount: '120', decimals: 18 },
    volume7d: { ticker: 'EGLD', amount: '610', decimals: 18 },
    listingsActive: 31,
    isOwnedByDinovox: false,
    sources: ['local']
  }
];

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

/** ---------------- Page ---------------- **/
export const MarketplaceCollections = () => {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('best');
  const [ownedOnly, setOwnedOnly] = useState(false);

  const filtered = useMemo(() => {
    let out = [...MOCK_COLLECTIONS];

    // filtre Dinovox (vos collections)
    if (ownedOnly) out = out.filter((c) => c.isOwnedByDinovox);

    // texte
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
      );
    }

    return sortCollections(out, sort);
  }, [query, sort, ownedOnly]);

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-2'>
        <div className='h-6 w-6 rounded-md bg-slate-200' />
        <h1 className='text-2xl font-semibold text-slate-900'>Collections</h1>
      </div>

      {/* Toolbar */}
      <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
        <div className='flex flex-col gap-2 w-full md:max-w-xl'>
          <label className='text-xs font-medium text-slate-600'>Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search by name or slug…'
            className='h-10 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
          />
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <label className='inline-flex items-center gap-2 text-sm text-slate-700'>
            <input
              type='checkbox'
              checked={ownedOnly}
              onChange={(e) => setOwnedOnly(e.target.checked)}
            />
            Owned by Dinovox
          </label>

          <div className='flex items-center gap-2'>
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
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
        {filtered.map((c) => (
          <Card key={c.slug}>
            {/* Aperçu plus large */}
            {c.banner && (
              <div
                className='h-40 w-full bg-center bg-cover rounded-t-2xl'
                style={{ backgroundImage: `url(${c.banner})` }}
              />
            )}

            {/* avatar/logo plus grand */}
            <CardHeader className='-mt-12 flex items-center gap-4'>
              <img
                src={c.logo}
                alt={c.name}
                className='h-20 w-20 rounded-2xl object-cover border-4 border-white shadow'
              />
              <div className='space-y-1'>
                <div className='text-base font-semibold text-slate-900'>
                  {c.name}
                </div>
                <div className='text-xs text-slate-500'>{c.slug}</div>
                <div className='flex flex-wrap gap-1'>
                  {/* badge “owned” mis en avant */}
                  {c.isOwnedByDinovox && <Badge tone='brand'>Dinovox</Badge>}
                  {/* badges informatifs (disponibilité des listings par agrégateur) */}
                  {c.sources.map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className='grid grid-cols-2 gap-4'>
              <div>
                <div className='text-xs text-slate-500'>Floor</div>
                <div className='text-sm font-medium text-slate-900'>
                  {formatToken(c.floor)}
                </div>
              </div>
              <div>
                <div className='text-xs text-slate-500'>Listings</div>
                <div className='text-sm font-medium text-slate-900'>
                  {c.listingsActive}
                </div>
              </div>
              <div>
                <div className='text-xs text-slate-500'>Vol. 24h</div>
                <div className='text-sm font-medium text-slate-900'>
                  {formatToken(c.volume24h)}
                </div>
              </div>
              <div>
                <div className='text-xs text-slate-500'>Vol. 7d</div>
                <div className='text-sm font-medium text-slate-900'>
                  {formatToken(c.volume7d)}
                </div>
              </div>
              <div className='col-span-2'>
                <div className='text-xs text-slate-500'>Items</div>
                <div className='text-sm font-medium text-slate-900'>
                  {c.itemsCount}
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Link
                to={`/marketplace/collections/${c.slug}`}
                className='inline-flex h-9 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800'
              >
                View collection
              </Link>
              <Link
                to={`/marketplace?collection=${c.slug}`}
                className='text-sm underline text-slate-700 hover:text-slate-900'
              >
                View listings
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className='text-center text-sm text-slate-500 py-16'>
          No collections match your filters.
        </div>
      )}
    </div>
  );
};
