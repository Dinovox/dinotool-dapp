import { ActionAuctionToken } from 'contracts/dinauction/actions/AuctionToken';
import DisplayNft from 'helpers/DisplayNft';
import { useGetUserNFT, UserNftResponse, UserNft } from 'helpers/useGetUserNft';
import { useGetAccountInfo } from 'lib';
import NftDisplay from 'pages/LotteryList/NftDisplay';
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import { m } from 'framer-motion';
import { use } from 'i18next';
import { max } from 'moment';
/* ---------------- Types ---------------- */
type SaleType = 'fixed' | 'auction';
type TokenAmount = { ticker: string; amount: string; decimals: number };

type OwnedNft = {
  id: string; // unique (identifier, e.g. "DINOVOX-3001")
  collectionSlug: string;
  name: string;
  image: string;
  attributes?: Array<{ trait: string; value: string }>;
  // Tu pourras rajouter ici le vrai identifier + nonce + balance NFT/SFT
  // e.g. identifier: string; nonce: number; balance: string;
};

type AuctionTokenArgs = {
  minBid: string; // BigUint, en base 10 (EGLD * 10^18 par ex.)
  maxBid: string; // "0" si pas de max
  deadlineTs: number; // u64, timestamp seconds
  acceptedPaymentToken: string; // EgldOrEsdtTokenIdentifier -> "EGLD" ici
  minBidDiff: string; // BigUint, "0" si pas de min diff
  sftMaxOnePerPayment: boolean; // false pour un NFT
  acceptedPaymentTokenNonce?: number | null; // undefined/null pour EGLD
  startTimeTs?: number | null; // null/undefined => now côté SC
};

/* ---------------- MOCK wallet inventory (à remplacer) ---------------- */
// const MOCK_OWNED: OwnedNft[] = Array.from({ length: 12 }).map((_, i) => ({
//   id: `DINOVOX-${3000 + i}`,
//   collectionSlug: 'dinovox',
//   name: `My Dino #${3000 + i}`,
//   image: `https://placehold.co/640/png?text=Dino+${3000 + i}`,
//   attributes: [
//     { trait: 'Background', value: i % 2 ? 'Volcano' : 'Jungle' },
//     { trait: 'Eyes', value: i % 3 ? 'Laser' : 'Cute' }
//   ]
// }));

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
  return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
};

const toTimestampSeconds = (value: string): number =>
  Math.floor(new Date(value).getTime() / 1000);

// Convertit une string "0.5" en integer string "500000000000000000" (18 décimales par défaut)
const toDenominatedInteger = (amount: string, decimals = 18): string => {
  if (!amount) return '0';
  const [intPartRaw, fracPartRaw = ''] = amount.replace(',', '.').split('.');
  const intPart = intPartRaw || '0';
  const fracPart = fracPartRaw.slice(0, decimals);
  const paddedFrac = fracPart.padEnd(decimals, '0');
  const normalized = `${intPart}${paddedFrac}`.replace(/^0+/, '') || '0';
  return normalized;
};

// Exemple de calcul d’un minBidDiff absolu à partir d’un pourcentage
const computeMinBidDiff = (minBidAmount: string, pct: number): string => {
  if (!minBidAmount || pct <= 0) return '0';
  const base = parseFloat(minBidAmount.replace(',', '.'));
  if (!isFinite(base) || base <= 0) return '0';
  const diff = (base * pct) / 100;
  return toDenominatedInteger(diff.toString());
};

/* ---------------- Constantes marketplace ---------------- */
const PAYMENT_TOKEN_TICKER: TokenAmount['ticker'] = 'EGLD';
// Tu pourras ensuite autoriser des ESDT spécifiques via la whitelist du SC

/* ---------------- Page ---------------- */
export const MarketplaceSell = () => {
  const { address } = useGetAccountInfo();
  const user_nft = useGetUserNFT(address);

  const navigate = useNavigate();

  // steps: 1 = select NFT, 2 = select sale type, 3 = configure, 4 = review
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);

  // selection
  const [query, setQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = React.useMemo(
    () => user_nft.find((n: UserNft) => n.identifier === selectedId) || null,
    [selectedId]
  );

  // sale type
  const [saleType, setSaleType] = React.useState<SaleType>('fixed');
  const [maxOnePerPayment, setMaxOnePerPayment] =
    React.useState<boolean>(false);
  // config (fixed)
  const [fixedPrice, setFixedPrice] = React.useState('0.50'); // EGLD

  // config (auction) – adapté au SC
  const [amountToSell, setAmountToSell] = React.useState('1'); // nombre d’items à vendre (SFT)
  const [minBid, setMinBid] = React.useState('0.20'); // min_bid = reserve
  const [startAt, setStartAt] = React.useState(nowLocalISO());
  const [endAt, setEndAt] = React.useState(() => {
    const d = new Date(
      Date.now() +
        31 * 24 * 3600 * 1000 -
        new Date().getTimezoneOffset() * 60000
    );
    return d.toISOString().slice(0, 16);
  });
  const [minBidStep, setMinBidStep] = React.useState(0);
  const [allowBuyNow, setAllowBuyNow] = React.useState(false);
  const [buyNowPrice, setBuyNowPrice] = React.useState('');

  // misc
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  useEffect(() => {
    if (saleType === 'auction') {
      const d = new Date(
        Date.now() +
          31 * 24 * 3600 * 1000 -
          new Date().getTimezoneOffset() * 60000
      );
      setEndAt(d.toISOString().slice(0, 16));
    } else {
      const d = new Date(
        Date.now() +
          10 * 365 * 24 * 3600 * 1000 -
          new Date().getTimezoneOffset() * 60000
      );
      setEndAt(d.toISOString().slice(0, 16));
    }
  }, [saleType]);

  // search inventory
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return user_nft;
    return user_nft.filter(
      (n: UserNft) =>
        n.name.toLowerCase().includes(q) ||
        n.identifier.toLowerCase().includes(q) ||
        n.collection.toLowerCase().includes(q)
    );
  }, [query, user_nft]);

  // validations
  const fixedValid =
    saleType === 'fixed' && selected && !!fixedPrice && Number(fixedPrice) > 0;

  const auctionValid =
    saleType === 'auction' &&
    selected &&
    !!minBid &&
    Number(minBid) > 0 &&
    new Date(endAt).getTime() > new Date(startAt).getTime() &&
    (!allowBuyNow ||
      (allowBuyNow && !!buyNowPrice && Number(buyNowPrice) >= Number(minBid)));

  const canContinue =
    (step === 1 && !!selected) ||
    (step === 2 && (saleType === 'fixed' || saleType === 'auction')) ||
    (step === 3 && (saleType === 'fixed' ? fixedValid : auctionValid)) ||
    (step === 4 && agreeTerms);

  /* ------------ Helpers d’intégration avec le smart contract ------------ */

  // const buildAuctionTokenArgs = (mode: SaleType): AuctionTokenArgs => {
  //   const nowTs = Math.floor(Date.now() / 1000);

  //   if (mode === 'fixed') {
  //     const minBidRaw = toDenominatedInteger(fixedPrice);
  //     // Fixed price = min_bid == max_bid, min_bid_diff = 0
  //     const deadlineTs = nowTs + 30 * 24 * 3600; // exemple : 30 jours de validité
  //     return {
  //       minBid: minBidRaw,
  //       maxBid: minBidRaw,
  //       deadlineTs,
  //       acceptedPaymentToken: PAYMENT_TOKEN_TICKER, // "EGLD"
  //       minBidDiff: '0',
  //       sftMaxOnePerPayment: false,
  //       acceptedPaymentTokenNonce: null,
  //       startTimeTs: null
  //     };
  //   }

  //   // Auction classique
  //   const minBidRaw = toDenominatedInteger(minBid);
  //   const maxBidRaw =
  //     allowBuyNow && buyNowPrice ? toDenominatedInteger(buyNowPrice) : '0';
  //   const deadlineTs = toTimestampSeconds(endAt);
  //   const startTimeTs = toTimestampSeconds(startAt);

  //   const minBidDiffRaw = minBidStep > 0 ? minBidStep : '0';

  //   return {
  //     minBid: minBidRaw,
  //     maxBid: maxBidRaw,
  //     deadlineTs,
  //     acceptedPaymentToken: PAYMENT_TOKEN_TICKER,
  //     minBidDiff: minBidDiffRaw,
  //     sftMaxOnePerPayment: false,
  //     acceptedPaymentTokenNonce: null,
  //     // si start_time <= now, tu peux décider de passer null pour laisser le SC prendre current_time
  //     startTimeTs: startTimeTs <= nowTs ? null : startTimeTs
  //   };
  // };

  async function sendAuctionTokenTx(
    _nft: any,
    _args: AuctionTokenArgs
  ): Promise<{ auctionId: string }> {
    // TODO: intégrer ici ton call réel vers le SC :
    // - construction de la tx ESDTNFTTransfer ou MultiESDTNFTTransfer
    // - endpoint: auctionToken
    // - paiement: NFT/SFT sélectionné
    // - arguments: min_bid, max_bid, deadline, accepted_payment_token,
    //              opt_min_bid_diff, opt_sft_max_one_per_payment,
    //              opt_accepted_payment_token_nonce, opt_start_time
    //
    // Exemple pseudo-code:
    //
    // const tx = new Transaction({
    //   receiver: MARKETPLACE_SC_ADDRESS,
    //   data: new TransactionPayload(
    //     `auctionToken@${args.minBidHex}@${args.maxBidHex}@${args.deadlineHex}@...`
    //   ),
    //   // + ESDTNFTTransfer du NFT vers le SC
    // });
    // await signAndSend(tx);
    //
    // Pour l’instant on renvoie un mock.
    // Support different NFT shapes (OwnedNft, UserNft, etc.) by resolving a best-effort identifier.
    const nftId =
      (_nft && typeof _nft.id === 'string' && _nft.id) ||
      (_nft && typeof _nft.identifier === 'string' && _nft.identifier) ||
      (_nft && typeof _nft.tokenId === 'string' && _nft.tokenId) ||
      'unknown';
    return {
      auctionId: `local:${nftId}:${Date.now()}`
    };
  }

  // async function createFixedListing() {
  //   if (!selected) throw new Error('No NFT selected');
  //   const args = buildAuctionTokenArgs('fixed');
  //   const res = await sendAuctionTokenTx(selected, args);
  //   return {
  //     listingId: res.auctionId,
  //     price: {
  //       ticker: PAYMENT_TOKEN_TICKER,
  //       amount: fixedPrice,
  //       decimals: 18
  //     }
  //   };
  // }

  // async function createAuctionListing() {
  //   if (!selected) throw new Error('No NFT selected');
  //   const args = buildAuctionTokenArgs('auction');
  //   const res = await sendAuctionTokenTx(selected, args);
  //   return {
  //     listingId: res.auctionId,
  //     minBid: {
  //       ticker: PAYMENT_TOKEN_TICKER,
  //       amount: minBid,
  //       decimals: 18
  //     },
  //     buyNow:
  //       allowBuyNow && buyNowPrice
  //         ? { ticker: PAYMENT_TOKEN_TICKER, amount: buyNowPrice, decimals: 18 }
  //         : undefined
  //   };
  // }

  // const onSubmit = async () => {
  //   if (busy) return;
  //   if (!agreeTerms) {
  //     alert('Merci de valider les conditions.');
  //     return;
  //   }
  //   setBusy(true);
  //   try {
  //     let created: { listingId: string };
  //     if (saleType === 'fixed') {
  //       const res = await createFixedListing();
  //       created = { listingId: res.listingId };
  //     } else {
  //       const res = await createAuctionListing();
  //       created = { listingId: res.listingId };
  //     }
  //     navigate(
  //       `/marketplace/listings/${encodeURIComponent(created.listingId)}`
  //     );
  //   } catch (e: any) {
  //     console.error(e);
  //     alert('La création a échoué (stub). Vérifie la console.');
  //   } finally {
  //     setBusy(false);
  //   }
  // };

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
          <Badge>Auction SC</Badge>
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
              {filtered.map((n: UserNft) => {
                const isSel = n.id === selectedId;
                return (
                  <button
                    key={n.identifier}
                    onClick={() => setSelectedId(n.identifier)}
                    className={`text-left rounded-2xl border overflow-hidden hover:opacity-90 ${
                      isSel ? 'ring-2 ring-slate-900' : ''
                    }`}
                    title={n.identifier}
                  >
                    <div className='aspect-square bg-slate-100'>
                      <DisplayNft nft={n} />
                    </div>
                    <div className='px-3 py-2'>
                      <div className='text-xs text-slate-500 truncate'>
                        {n.identifier}
                      </div>
                      <div className='text-sm font-medium truncate'>
                        {n.name}
                      </div>
                      <div className='mt-1 text-xs text-slate-500'>
                        {n.collection}
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
                    <DisplayNft nft={selected} amount={selected.balance} />
                  </div>
                  <div>
                    <div className='text-sm text-slate-500'>{selected.id}</div>
                    <div className='text-lg font-semibold'>{selected.name}</div>
                    <div className='text-sm text-slate-500'>
                      {selected.collection}
                    </div>
                  </div>
                  {Array.isArray(selected.attributes) &&
                  selected.attributes.length ? (
                    <div className='grid grid-cols-2 gap-2'>
                      {selected.attributes.map((a: any, i: any) => (
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
                  <div className='font-medium'>
                    Fixed price (via auctionToken)
                  </div>
                  <div className='text-sm text-slate-500'>
                    Uses min_bid = max_bid. Instant sale when someone bids the
                    price.
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
                    Bids between start and end time. Optional min step and “Buy
                    now” (max bid).
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
                  <DisplayNft nft={selected} amount={selected.balance} />
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
                      Fixed price
                    </label>
                    <div className='flex items-center gap-2'>
                      <input
                        value={fixedPrice}
                        onChange={(e) => setFixedPrice(e.target.value)}
                        inputMode='decimal'
                        className='h-10 w-48 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                      />
                      <Badge>{PAYMENT_TOKEN_TICKER}</Badge>
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>
                      Will be mapped to min_bid = max_bid in the auctionToken
                      call. Marketplace fee & royalties calculés à la vente.
                    </p>
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
                    <p className='mt-1 text-xs text-slate-500'>
                      If set in the past, the SC will treat it as starting now.
                    </p>
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
                </>
              ) : (
                <>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm text-slate-600 mb-1'>
                        Minimum price (reserve)
                      </label>
                      <div className='flex items-center gap-2'>
                        <input
                          value={minBid}
                          onChange={(e) => setMinBid(e.target.value)}
                          inputMode='decimal'
                          className='h-10 w-48 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                        />
                        <Badge>{PAYMENT_TOKEN_TICKER}</Badge>
                      </div>
                      <p className='mt-1 text-xs text-slate-500'>
                        This maps directly to <code>min_bid</code> in the smart
                        contract.
                      </p>
                    </div>
                    <div>
                      <label className='block text-sm text-slate-600 mb-1'>
                        Minimum bid step (optional)
                      </label>
                      <input
                        type='number'
                        value={minBidStep}
                        onChange={(e) =>
                          setMinBidStep(parseInt(e.target.value || '0', 10))
                        }
                        className='h-10 w-28 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                      />
                      <p className='mt-1 text-xs text-slate-500'>
                        Minimal amount that a new bid must exceed the current
                      </p>
                    </div>

                    <div>
                      <label className='block text-sm text-slate-600 mb-1'>
                        Amount to sell
                      </label>
                      <div className='flex items-center gap-2'>
                        <input
                          type='number'
                          min={1}
                          max={
                            selected
                              ? Number(selected.balance || '1')
                              : undefined
                          }
                          value={amountToSell}
                          onChange={(e) => {
                            // keep as string to match state shape, clamp to available balance if possible
                            const raw = e.target.value;
                            const num =
                              raw === ''
                                ? ''
                                : String(Math.max(0, Number(raw)));
                            setAmountToSell(num);
                          }}
                          className='h-10 w-28 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                        />
                        <Badge>
                          {selected
                            ? `${selected.balance || '1'} available`
                            : '—'}
                        </Badge>
                      </div>
                      <p className='mt-1 text-xs text-slate-500'>
                        Number of items to include in the auction (for SFTs).
                        For NFTs use 1.
                      </p>
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
                      <p className='mt-1 text-xs text-slate-500'>
                        If set in the past, the SC will treat it as starting
                        now.
                      </p>
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

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'></div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={allowBuyNow}
                        onChange={(e) => setAllowBuyNow(e.target.checked)}
                      />
                      <span className='text-sm'>Allow “Buy now” </span>
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
                          <Badge>{PAYMENT_TOKEN_TICKER}</Badge>
                        </div>
                        <p className='mt-1 text-xs text-slate-500'>
                          Mapped to <code>max_bid</code>. If a bid reaches this
                          value, the auction ends instantly.
                        </p>
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
                    <DisplayNft nft={selected} />
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='text-lg font-semibold'>{selected.name}</div>
                    <Badge>{saleType}</Badge>
                  </div>
                  <div className='text-sm text-slate-500'>
                    {selected.identifier} • {selected.collection}
                  </div>

                  {saleType === 'fixed' ? (
                    <div className='rounded-xl border p-3'>
                      <div className='text-xs uppercase tracking-wide text-slate-500'>
                        Fixed price
                      </div>
                      <div className='text-2xl font-semibold'>
                        {fmt({
                          ticker: PAYMENT_TOKEN_TICKER,
                          amount: fixedPrice,
                          decimals: 18
                        })}
                      </div>
                      <div className='mt-1 text-xs text-slate-500'>
                        Internally uses auctionToken(min_bid = max_bid).
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
                        Min bid:{' '}
                        <span className='font-medium'>
                          {fmt({
                            ticker: PAYMENT_TOKEN_TICKER,
                            amount: minBid,
                            decimals: 18
                          })}
                        </span>
                      </div>
                      {allowBuyNow && buyNowPrice && (
                        <div className='text-sm'>
                          Buy now:{' '}
                          <span className='font-medium'>
                            {fmt({
                              ticker: PAYMENT_TOKEN_TICKER,
                              amount: buyNowPrice,
                              decimals: 18
                            })}
                          </span>
                        </div>
                      )}
                      {minBidStep > 0 && (
                        <div className='text-sm'>
                          Min bid step: {minBidStep}% of min bid
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
                <DisplayNft nft={selected!} amount={selected?.balance} />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
                <div className='rounded-md border p-3'>
                  <div className='text-xs text-slate-500'>Item</div>
                  <div className='font-medium'>{selected?.name}</div>
                  <div className='text-slate-500'>{selected?.identifier}</div>
                </div>
                <div className='rounded-md border p-3'>
                  <div className='text-xs text-slate-500'>Sale type</div>
                  <div className='font-medium'>
                    {saleType === 'fixed'
                      ? 'Fixed price (auctionToken)'
                      : 'Auction'}
                  </div>
                </div>
                {saleType === 'fixed' ? (
                  <div className='rounded-md border p-3'>
                    <div className='text-xs text-slate-500'>Price</div>
                    <div className='font-medium'>
                      {fmt({
                        ticker: PAYMENT_TOKEN_TICKER,
                        amount: fixedPrice,
                        decimals: 18
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className='rounded-md border p-3'>
                      <div className='text-xs text-slate-500'>Min bid</div>
                      <div className='font-medium'>
                        {fmt({
                          ticker: PAYMENT_TOKEN_TICKER,
                          amount: minBid,
                          decimals: 18
                        })}
                      </div>
                    </div>
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
                        Min step {minBidStep}{' '}
                        {allowBuyNow && buyNowPrice
                          ? `· Buy now ${fmt({
                              ticker: PAYMENT_TOKEN_TICKER,
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
              <ActionAuctionToken
                auctionned_token_identifier={
                  selected ? selected.collection : ''
                }
                auctionned_nonce={
                  selected
                    ? new BigNumber(selected.nonce ? selected.nonce : 0)
                    : new BigNumber(0)
                }
                auctionned_amount={new BigNumber(amountToSell)}
                minimum_bid={
                  saleType === 'fixed'
                    ? new BigNumber(toDenominatedInteger(fixedPrice))
                    : new BigNumber(toDenominatedInteger(minBid))
                }
                maximum_bid={
                  saleType === 'fixed'
                    ? new BigNumber(toDenominatedInteger(fixedPrice))
                    : allowBuyNow && buyNowPrice
                    ? new BigNumber(toDenominatedInteger(buyNowPrice))
                    : new BigNumber(0)
                }
                deadline={toTimestampSeconds(endAt)}
                accepted_payment_token_identifier={PAYMENT_TOKEN_TICKER}
                opt_min_bid_diff={
                  saleType === 'fixed'
                    ? new BigNumber(0)
                    : minBidStep > 0
                    ? new BigNumber(minBidStep)
                    : new BigNumber(0)
                }
                //Pour vente directe
                opt_sft_max_one_per_payment={
                  saleType === 'fixed' && maxOnePerPayment ? true : false
                }
                opt_start_time={
                  saleType === 'fixed'
                    ? undefined
                    : (() => {
                        const s = toTimestampSeconds(startAt);
                        return s <= Math.floor(Date.now() / 1000)
                          ? undefined
                          : s;
                      })()
                }
                disabled={busy || !agreeTerms}
              />

              {/* Submit */}
              {/* <button
                onClick={onSubmit}
                disabled={!agreeTerms || busy}
                className={`inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium text-white ${
                  !agreeTerms || busy
                    ? 'bg-slate-400'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {busy ? 'Listing…' : 'Confirm & list'}
              </button> */}
              <div className='text-xs text-slate-500'>
                Cette action ouvrira votre wallet pour signer la transaction
                (quand branché au smart contract marketplace).
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
