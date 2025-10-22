import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

/* ---------------- Types ---------------- */
type SaleType = 'fixed' | 'auction';
type TokenAmount = { ticker: string; amount: string; decimals: number };
type OwnedNft = {
  id: string; // unique (identifier)
  collectionSlug: string;
  name: string;
  image: string;
  attributes?: Array<{ trait: string; value: string }>;
};

/* ---------------- MOCK wallet inventory (à remplacer) ---------------- */
const MOCK_OWNED: OwnedNft[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `DINOVOX-${3000 + i}`,
  collectionSlug: 'dinovox',
  name: `My Dino #${3000 + i}`,
  image: `https://placehold.co/640/png?text=Dino+${3000 + i}`,
  attributes: [
    { trait: 'Background', value: i % 2 ? 'Volcano' : 'Jungle' },
    { trait: 'Eyes', value: i % 3 ? 'Laser' : 'Cute' }
  ]
}));

/* ---------------- Minimal UI bits ---------------- */
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
const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className='inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700'>
    {children}
  </span>
);

/* ---------------- Helpers ---------------- */
const fmt = (t?: TokenAmount) => (t ? `${t.amount} ${t.ticker}` : '-');
const nowLocalISO = () => {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm pour datetime-local
};

/* ---------------- Page ---------------- */
export const MarketplaceSell = () => {
  const navigate = useNavigate();

  // steps: 1 = select NFT, 2 = select sale type, 3 = configure, 4 = review
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);

  // selection
  const [query, setQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = React.useMemo(
    () => MOCK_OWNED.find((n) => n.id === selectedId) || null,
    [selectedId]
  );

  // sale type
  const [saleType, setSaleType] = React.useState<SaleType>('fixed');

  // config (fixed)
  const [fixedPrice, setFixedPrice] = React.useState('0.50'); // EGLD
  const token: TokenAmount['ticker'] = 'EGLD';

  // config (auction)
  const [startPrice, setStartPrice] = React.useState('0.20');
  const [reservePrice, setReservePrice] = React.useState(''); // optional
  const [startAt, setStartAt] = React.useState(nowLocalISO());
  const [endAt, setEndAt] = React.useState(() => {
    const d = new Date(
      Date.now() + 24 * 3600 * 1000 - new Date().getTimezoneOffset() * 60000
    );
    return d.toISOString().slice(0, 16);
  });
  const [antiSnipe, setAntiSnipe] = React.useState(true);
  const [minBidStepPct, setMinBidStepPct] = React.useState(5); // %
  const [allowBuyNow, setAllowBuyNow] = React.useState(false);
  const [buyNowPrice, setBuyNowPrice] = React.useState('');

  // misc
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  // search inventory
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_OWNED;
    return MOCK_OWNED.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.id.toLowerCase().includes(q) ||
        n.collectionSlug.toLowerCase().includes(q)
    );
  }, [query]);

  // validations
  const fixedValid =
    saleType === 'fixed' && selected && !!fixedPrice && Number(fixedPrice) > 0;

  const auctionValid =
    saleType === 'auction' &&
    selected &&
    !!startPrice &&
    Number(startPrice) > 0 &&
    new Date(endAt).getTime() > new Date(startAt).getTime();

  const canContinue =
    (step === 1 && !!selected) ||
    (step === 2 && (saleType === 'fixed' || saleType === 'auction')) ||
    (step === 3 && (saleType === 'fixed' ? fixedValid : auctionValid)) ||
    (step === 4 && agreeTerms);

  /* ---- Stubs d’intégration Smart Contract ---- */
  async function createFixedListing() {
    // TODO: appeler ton SC local (listFixed(identifier, price, token))
    return {
      listingId: `local:${selected!.id}`,
      price: { ticker: token, amount: fixedPrice, decimals: 18 }
    };
  }
  async function createAuctionListing() {
    // TODO: appeler ton SC (listAuction(identifier, startPrice, reserve?, startAt, endAt, opts))
    return {
      listingId: `local:A-${selected!.id}`,
      startPrice: { ticker: token, amount: startPrice, decimals: 18 },
      reserve: reservePrice
        ? { ticker: token, amount: reservePrice, decimals: 18 }
        : undefined
    };
  }

  const onSubmit = async () => {
    if (busy) return;
    if (!agreeTerms) return alert('Merci de valider les conditions.');
    setBusy(true);
    try {
      let created: { listingId: string };
      if (saleType === 'fixed') {
        const res = await createFixedListing();
        created = { listingId: res.listingId };
      } else {
        const res = await createAuctionListing();
        created = { listingId: res.listingId };
      }
      // redirige vers la page de détail du listing
      navigate(
        `/marketplace/listings/${encodeURIComponent(created.listingId)}`
      );
    } catch (e: any) {
      console.error(e);
      alert('La création a échoué (stub). Vérifie la console.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 space-y-6'>
      {/* Header */}
      <div className='text-sm text-slate-600'>
        <Link to='/marketplace' className='underline'>
          Marketplace
        </Link>
        <span className='px-2'>/</span>
        <span>Sell</span>
      </div>
      <div className='flex items-center gap-2'>
        <div className='h-6 w-6 rounded-md bg-slate-200' />
        <h1 className='text-2xl font-semibold'>List an item</h1>
        <div className='ml-2 flex gap-1'>
          <Badge>Local</Badge>
        </div>
      </div>

      {/* Stepper */}
      <div className='grid grid-cols-4 gap-2 text-sm'>
        {['Select NFT', 'Sale type', 'Configure', 'Review'].map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4;
          const active = step === n;
          const done = step > n;
          return (
            <div
              key={n}
              className={`rounded-lg border px-3 py-2 ${
                active ? 'border-slate-900' : 'border-slate-200'
              } ${done ? 'bg-slate-50' : 'bg-white'}`}
            >
              <div className='font-medium'>{label}</div>
              <div className='text-xs text-slate-500'>Step {n}</div>
            </div>
          );
        })}
      </div>

      {/* Content */}
      {step === 1 && (
        <div className='grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6'>
          {/* Inventory */}
          <Card>
            <CardHeader className='flex items-center justify-between'>
              <div className='font-semibold'>Your wallet NFTs</div>
              <div className='flex items-center gap-2'>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Search by id / name / collection'
                  className='h-9 w-64 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                />
              </div>
            </CardHeader>
            <CardContent className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'>
              {filtered.map((n) => {
                const isSel = n.id === selectedId;
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedId(n.id)}
                    className={`text-left rounded-2xl border overflow-hidden hover:opacity-90 ${
                      isSel ? 'ring-2 ring-slate-900' : ''
                    }`}
                    title={n.id}
                  >
                    <div className='aspect-square bg-slate-100'>
                      <img
                        src={n.image}
                        alt={n.name}
                        className='h-full w-full object-cover'
                      />
                    </div>
                    <div className='px-3 py-2'>
                      <div className='text-xs text-slate-500 truncate'>
                        {n.id}
                      </div>
                      <div className='text-sm font-medium truncate'>
                        {n.name}
                      </div>
                      <div className='mt-1 text-xs text-slate-500'>
                        {n.collectionSlug}
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <div className='font-semibold'>Preview</div>
            </CardHeader>
            <CardContent className='space-y-3'>
              {selected ? (
                <>
                  <div className='rounded-xl overflow-hidden border'>
                    <img
                      src={selected.image}
                      alt={selected.name}
                      className='w-full object-cover'
                    />
                  </div>
                  <div>
                    <div className='text-sm text-slate-500'>{selected.id}</div>
                    <div className='text-lg font-semibold'>{selected.name}</div>
                    <div className='text-sm text-slate-500'>
                      {selected.collectionSlug}
                    </div>
                  </div>
                  {selected.attributes?.length ? (
                    <div className='grid grid-cols-2 gap-2'>
                      {selected.attributes.map((a, i) => (
                        <div key={i} className='rounded-md border p-2'>
                          <div className='text-[11px] uppercase tracking-wide text-slate-500'>
                            {a.trait}
                          </div>
                          <div className='text-sm font-medium'>{a.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className='text-sm text-slate-500'>
                  Select an NFT to continue.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <div className='font-semibold'>Choose sale type</div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <label className='flex items-start gap-3 rounded-xl border p-3'>
                <input
                  type='radio'
                  name='saleType'
                  checked={saleType === 'fixed'}
                  onChange={() => setSaleType('fixed')}
                />
                <div>
                  <div className='font-medium'>Fixed price</div>
                  <div className='text-sm text-slate-500'>
                    Set a single price; instant purchase.
                  </div>
                </div>
              </label>
              <label className='flex items-start gap-3 rounded-xl border p-3'>
                <input
                  type='radio'
                  name='saleType'
                  checked={saleType === 'auction'}
                  onChange={() => setSaleType('auction')}
                />
                <div>
                  <div className='font-medium'>Auction</div>
                  <div className='text-sm text-slate-500'>
                    Bids between start and end time; optional reserve &
                    anti-snipe.
                  </div>
                </div>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className='font-semibold'>Selected NFT</div>
            </CardHeader>
            <CardContent>
              {selected ? (
                <div className='flex gap-3'>
                  <img
                    src={selected.image}
                    className='h-24 w-24 rounded-lg object-cover border'
                  />
                  <div>
                    <div className='text-sm text-slate-500'>{selected.id}</div>
                    <div className='text-lg font-semibold'>{selected.name}</div>
                    <div className='text-sm text-slate-500'>
                      {selected.collectionSlug}
                    </div>
                  </div>
                </div>
              ) : (
                <div className='text-sm text-slate-500'>
                  No NFT selected (go back to step 1).
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && (
        <div className='grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6'>
          {/* Config */}
          <Card>
            <CardHeader>
              <div className='font-semibold'>Configure listing</div>
            </CardHeader>
            <CardContent className='space-y-5'>
              {saleType === 'fixed' ? (
                <>
                  <div>
                    <label className='block text-sm text-slate-600 mb-1'>
                      Price
                    </label>
                    <div className='flex items-center gap-2'>
                      <input
                        value={fixedPrice}
                        onChange={(e) => setFixedPrice(e.target.value)}
                        inputMode='decimal'
                        className='h-10 w-48 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                      />
                      <Badge>{token}</Badge>
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>
                      Marketplace fee & royalties calculés à la vente.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm text-slate-600 mb-1'>
                        Start price
                      </label>
                      <div className='flex items-center gap-2'>
                        <input
                          value={startPrice}
                          onChange={(e) => setStartPrice(e.target.value)}
                          inputMode='decimal'
                          className='h-10 w-48 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                        />
                        <Badge>{token}</Badge>
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm text-slate-600 mb-1'>
                        Reserve price (optional)
                      </label>
                      <div className='flex items-center gap-2'>
                        <input
                          value={reservePrice}
                          onChange={(e) => setReservePrice(e.target.value)}
                          inputMode='decimal'
                          placeholder='e.g. 0.60'
                          className='h-10 w-48 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                        />
                        <Badge>{token}</Badge>
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm text-slate-600 mb-1'>
                        Start time
                      </label>
                      <input
                        type='datetime-local'
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                        className='h-10 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                      />
                    </div>
                    <div>
                      <label className='block text-sm text-slate-600 mb-1'>
                        End time
                      </label>
                      <input
                        type='datetime-local'
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
                        className='h-10 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={antiSnipe}
                        onChange={(e) => setAntiSnipe(e.target.checked)}
                      />
                      <span className='text-sm'>
                        Enable anti-snipe (extends on late bids)
                      </span>
                    </label>
                    <div>
                      <label className='block text-sm text-slate-600 mb-1'>
                        Min bid step (%)
                      </label>
                      <input
                        type='number'
                        value={minBidStepPct}
                        onChange={(e) =>
                          setMinBidStepPct(parseInt(e.target.value || '0'))
                        }
                        className='h-10 w-28 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={allowBuyNow}
                        onChange={(e) => setAllowBuyNow(e.target.checked)}
                      />
                      <span className='text-sm'>Allow “Buy now”</span>
                    </label>
                    {allowBuyNow && (
                      <div>
                        <label className='block text-sm text-slate-600 mb-1'>
                          Buy now price
                        </label>
                        <div className='flex items-center gap-2'>
                          <input
                            value={buyNowPrice}
                            onChange={(e) => setBuyNowPrice(e.target.value)}
                            inputMode='decimal'
                            className='h-10 w-48 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                          />
                          <Badge>{token}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Live preview */}
          <Card>
            <CardHeader>
              <div className='font-semibold'>Live preview</div>
            </CardHeader>
            <CardContent className='space-y-3'>
              {selected ? (
                <>
                  <div className='rounded-xl overflow-hidden border'>
                    <img src={selected.image} className='w-full object-cover' />
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='text-lg font-semibold'>{selected.name}</div>
                    <Badge>{saleType}</Badge>
                  </div>
                  <div className='text-sm text-slate-500'>
                    {selected.id} • {selected.collectionSlug}
                  </div>

                  {saleType === 'fixed' ? (
                    <div className='rounded-xl border p-3'>
                      <div className='text-xs uppercase tracking-wide text-slate-500'>
                        Price
                      </div>
                      <div className='text-2xl font-semibold'>
                        {fmt({
                          ticker: token,
                          amount: fixedPrice,
                          decimals: 18
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className='rounded-xl border p-3 space-y-1'>
                      <div className='text-xs uppercase tracking-wide text-slate-500'>
                        Auction
                      </div>
                      <div className='text-sm'>
                        Start:{' '}
                        <span className='font-medium'>
                          {new Date(startAt).toLocaleString()}
                        </span>
                      </div>
                      <div className='text-sm'>
                        End:{' '}
                        <span className='font-medium'>
                          {new Date(endAt).toLocaleString()}
                        </span>
                      </div>
                      <div className='text-sm'>
                        Start price:{' '}
                        <span className='font-medium'>
                          {fmt({
                            ticker: token,
                            amount: startPrice,
                            decimals: 18
                          })}
                        </span>
                      </div>
                      {reservePrice && (
                        <div className='text-sm'>
                          Reserve:{' '}
                          <span className='font-medium'>
                            {fmt({
                              ticker: token,
                              amount: reservePrice,
                              decimals: 18
                            })}
                          </span>
                        </div>
                      )}
                      {allowBuyNow && buyNowPrice && (
                        <div className='text-sm'>
                          Buy now:{' '}
                          <span className='font-medium'>
                            {fmt({
                              ticker: token,
                              amount: buyNowPrice,
                              decimals: 18
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className='text-xs text-slate-500'>
                    Fees/royalties affichés sur la page de détail au moment de
                    la vente.
                  </div>
                </>
              ) : (
                <div className='text-sm text-slate-500'>
                  Select an NFT to preview.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 4 && (
        <div className='grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6'>
          <Card>
            <CardHeader>
              <div className='font-semibold'>Review & confirm</div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='rounded-xl border overflow-hidden'>
                <img src={selected?.image} className='w-full object-cover' />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
                <div className='rounded-md border p-3'>
                  <div className='text-xs text-slate-500'>Item</div>
                  <div className='font-medium'>{selected?.name}</div>
                  <div className='text-slate-500'>{selected?.id}</div>
                </div>
                <div className='rounded-md border p-3'>
                  <div className='text-xs text-slate-500'>Sale type</div>
                  <div className='font-medium'>
                    {saleType === 'fixed' ? 'Fixed price' : 'Auction'}
                  </div>
                </div>
                {saleType === 'fixed' ? (
                  <div className='rounded-md border p-3'>
                    <div className='text-xs text-slate-500'>Price</div>
                    <div className='font-medium'>
                      {fmt({ ticker: token, amount: fixedPrice, decimals: 18 })}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className='rounded-md border p-3'>
                      <div className='text-xs text-slate-500'>Start price</div>
                      <div className='font-medium'>
                        {fmt({
                          ticker: token,
                          amount: startPrice,
                          decimals: 18
                        })}
                      </div>
                    </div>
                    {reservePrice && (
                      <div className='rounded-md border p-3'>
                        <div className='text-xs text-slate-500'>Reserve</div>
                        <div className='font-medium'>
                          {fmt({
                            ticker: token,
                            amount: reservePrice,
                            decimals: 18
                          })}
                        </div>
                      </div>
                    )}
                    <div className='rounded-md border p-3'>
                      <div className='text-xs text-slate-500'>Schedule</div>
                      <div className='font-medium'>
                        {new Date(startAt).toLocaleString()} →{' '}
                        {new Date(endAt).toLocaleString()}
                      </div>
                    </div>
                    <div className='rounded-md border p-3'>
                      <div className='text-xs text-slate-500'>Options</div>
                      <div className='font-medium'>
                        {antiSnipe ? 'Anti-snipe ON' : 'Anti-snipe OFF'} · Min
                        step {minBidStepPct}%{' '}
                        {allowBuyNow && buyNowPrice
                          ? `· Buy now ${fmt({
                              ticker: token,
                              amount: buyNowPrice,
                              decimals: 18
                            })}`
                          : ''}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <label className='mt-2 flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span className='text-sm'>
                  I confirm I own this item and agree to the marketplace terms.
                </span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className='font-semibold'>Create listing</div>
            </CardHeader>
            <CardContent className='space-y-3'>
              <button
                onClick={onSubmit}
                disabled={!agreeTerms || busy}
                className={`inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium text-white ${
                  !agreeTerms || busy
                    ? 'bg-slate-400'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {busy ? 'Listing…' : 'Confirm & list'}
              </button>
              <div className='text-xs text-slate-500'>
                Cette action ouvrira votre wallet pour signer la transaction
                (quand branché au SC).
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer actions */}
      <div className='flex items-center justify-between'>
        <button
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as any) : s))}
          className='h-10 rounded-md border px-4 text-sm'
        >
          Back
        </button>
        <div className='flex items-center gap-2'>
          {step < 4 && (
            <button
              onClick={() => canContinue && setStep((s) => (s + 1) as any)}
              disabled={!canContinue}
              className={`h-10 rounded-md px-4 text-sm text-white ${
                canContinue ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-400'
              }`}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
