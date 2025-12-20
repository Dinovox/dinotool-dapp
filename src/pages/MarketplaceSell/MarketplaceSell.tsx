import { ActionAuctionToken } from 'contracts/dinauction/actions/AuctionToken';
import DisplayNft from 'helpers/DisplayNft';
import { useGetUserNFT, UserNftResponse, UserNft } from 'helpers/useGetUserNft';
import { useGetAccountInfo } from 'lib';
import NftDisplay from 'pages/LotteryList/NftDisplay';
import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { max } from 'moment';
import { LoginModal } from 'provider/LoginModal';
import { ConnectButton } from 'components/Button/ConnectButton';
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
const MARKETPLACE_FEE_PERCENT = 1; // 1%
import { auction_tokens } from 'config';

// Tu pourras ensuite autoriser des ESDT spécifiques via la whitelist du SC

/* ---------------- Page ---------------- */
export const MarketplaceSell = () => {
  const { address } = useGetAccountInfo();
  useLoadTranslations('marketplace');
  const { t } = useTranslation();

  /* ---------------- URL params ---------------- */
  const [searchParams] = useSearchParams();
  const collectionParam = searchParams.get('collection');

  // Pagination & Search state
  const [query, setQuery] = React.useState(collectionParam || ''); // Init with collection param if present
  const [from, setFrom] = React.useState(0);
  const pageSize = 12;

  // Debounce search query if needed, or just pass directly if user ok with instant search
  // For now passing directly.
  const user_nft = useGetUserNFT(address, undefined, undefined, {
    // If query matches collection param, we pass it as collection filter specifically to be more precise?
    // Or just generic search. Let's stick to generic search as per existing logic, or simple search=query.
    // If collectionParam is present, maybe we want to filter exactly by collection?
    // Let's rely on 'search' valid for collection too.
    search: query,
    from: from,
    size: pageSize
  });

  const navigate = useNavigate();

  // steps: 1 = select NFT, 2 = select sale type, 3 = configure, 4 = review
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);

  // selection
  // const [query, setQuery] = React.useState(''); // Moved up
  // Reset pagination when query changes
  React.useEffect(() => {
    setFrom(0);
  }, [query]);
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
  const [minBidStep, setMinBidStep] = React.useState('');
  const [allowBuyNow, setAllowBuyNow] = React.useState(false);
  const [buyNowPrice, setBuyNowPrice] = React.useState('');
  const [hasEndTime, setHasEndTime] = React.useState(false);
  const [paymentToken, setPaymentToken] = React.useState(
    auction_tokens && auction_tokens.length > 0
      ? auction_tokens[0].identifier
      : 'EGLD'
  );

  const selectedPaymentToken = React.useMemo(
    () =>
      auction_tokens.find((t) => t.identifier === paymentToken) ||
      auction_tokens[0],
    [paymentToken]
  );

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
          365 * 24 * 3600 * 1000 -
          new Date().getTimezoneOffset() * 60000
      );
      setEndAt(d.toISOString().slice(0, 16));
    }
  }, [saleType]);

  // search inventory
  // Client-side filtering removed in favor of server-side
  const filtered = user_nft;
  /*
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
  */

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
          {t('marketplace:marketplace')}
        </Link>
        <span className='px-2'>/</span>
        <span>{t('marketplace:sell')}</span>
      </div>
      <div className='flex items-center gap-2'>
        <div className='h-6 w-6 rounded-md bg-slate-200' />
        <h1 className='text-2xl font-semibold'>{t('marketplace:list_item')}</h1>
        <div className='ml-2 flex gap-1'>
          <Badge>{t('marketplace:auction_sc')}</Badge>
        </div>
      </div>

      {/* Stepper */}
      <div className='grid grid-cols-4 gap-2 text-sm'>
        {[
          t('marketplace:select_nft'),
          t('marketplace:sale_type'),
          t('marketplace:configure'),
          t('marketplace:review')
        ].map((label, i) => {
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
              <div className='text-xs text-slate-500'>
                {t('marketplace:step')} {n}
              </div>
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
              <div className='font-semibold'>{t('marketplace:select_nft')}</div>
              <div className='flex items-center gap-2'>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('marketplace:search_placeholder')}
                  className='h-9 w-64 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                />
              </div>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
              <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 min-h-[200px]'>
                {filtered.map((n: UserNft) => {
                  const isSel = n.identifier === selectedId; // Fix: n.id might be undefined in some types, use identifier
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
                        <DisplayNft nft={n} useThumbnail />
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
                {filtered.length === 0 && (
                  <div className='col-span-full py-8 text-center text-slate-500'>
                    {t('marketplace:no_nfts')}
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              <div className='flex items-center justify-between border-t pt-4'>
                <button
                  disabled={from === 0}
                  onClick={() => setFrom(Math.max(0, from - pageSize))}
                  className='rounded-md border px-3 py-1 text-sm disabled:opacity-50 hover:bg-slate-50'
                >
                  {t('marketplace:previous')}
                </button>
                <span className='text-xs text-slate-500'>
                  {t('marketplace:showing_range', {
                    start: from + 1,
                    end: from + filtered.length
                  })}
                </span>
                <button
                  disabled={filtered.length < pageSize}
                  onClick={() => setFrom(from + pageSize)}
                  className='rounded-md border px-3 py-1 text-sm disabled:opacity-50 hover:bg-slate-50'
                >
                  {t('marketplace:next')}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <div className='font-semibold'>{t('marketplace:preview')}</div>
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
                  {(selected.metadata as any)?.attributes &&
                  Array.isArray((selected.metadata as any).attributes) &&
                  (selected.metadata as any).attributes.length > 0 ? (
                    <div className='grid grid-cols-2 gap-2'>
                      {(selected.metadata as any).attributes.map(
                        (a: any, i: number) => (
                          <div key={i} className='rounded-md border p-2'>
                            <div className='text-[11px] uppercase tracking-wide text-slate-500'>
                              {a.trait_type || a.trait}
                            </div>
                            <div className='text-sm font-medium'>{a.value}</div>
                          </div>
                        )
                      )}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className='text-sm text-slate-500'>
                  {t('marketplace:select_preview')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className='mx-auto max-w-2xl space-y-6'>
          {/* Selected NFT Summary */}
          {selected ? (
            <div className='flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
              <div className='h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100'>
                <DisplayNft
                  nft={selected}
                  variant='media-only'
                  useThumbnail
                  className='h-full w-full object-cover'
                />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='text-lg font-semibold truncate'>
                  {selected.name}
                </div>
                <div className='text-sm text-slate-500 truncate'>
                  {selected.identifier}
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                className='text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline'
              >
                {t('marketplace:change')}
              </button>
            </div>
          ) : (
            <div className='rounded-xl border border-red-200 bg-red-50 p-4 text-red-700'>
              {t('marketplace:no_nft_selected')}
            </div>
          )}

          {/* Sale Type Selection */}
          <Card>
            <CardHeader>
              <div className='font-semibold'>{t('marketplace:sale_type')}</div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <label className='flex cursor-pointer items-start gap-3 rounded-xl border p-3 hover:bg-slate-50 transition-colors'>
                <input
                  type='radio'
                  name='saleType'
                  className='mt-1'
                  checked={saleType === 'fixed'}
                  onChange={() => setSaleType('fixed')}
                />
                <div>
                  <div className='font-medium'>
                    {t('marketplace:fixed_price')}
                  </div>
                  <div className='text-sm text-slate-500'>
                    {t('marketplace:fixed_price_desc')}
                  </div>
                </div>
              </label>
              <label className='flex cursor-pointer items-start gap-3 rounded-xl border p-3 hover:bg-slate-50 transition-colors'>
                <input
                  type='radio'
                  name='saleType'
                  className='mt-1'
                  checked={saleType === 'auction'}
                  onChange={() => setSaleType('auction')}
                />
                <div>
                  <div className='font-medium'>{t('marketplace:auction')}</div>
                  <div className='text-sm text-slate-500'>
                    {t('marketplace:auction_desc')}
                  </div>
                </div>
              </label>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && (
        <div className='mx-auto max-w-2xl space-y-6'>
          {/* Selected NFT Summary */}
          {selected && (
            <div className='flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
              <div className='h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100'>
                <DisplayNft
                  nft={selected}
                  variant='media-only'
                  useThumbnail
                  className='h-full w-full object-cover'
                />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='text-lg font-semibold truncate'>
                  {selected.name}
                </div>
                <div className='text-sm text-slate-500 truncate'>
                  {selected.identifier}
                </div>
              </div>
              <div className='text-right'>
                <div className='text-sm font-medium'>
                  {saleType === 'fixed'
                    ? t('marketplace:fixed_price')
                    : t('marketplace:auction')}
                </div>
                <button
                  onClick={() => setStep(2)}
                  className='text-xs text-blue-600 hover:underline'
                >
                  {t('marketplace:change_type')}
                </button>
              </div>
            </div>
          )}

          {/* Config */}
          <Card>
            <CardHeader>
              <div className='font-semibold'>
                {t('marketplace:configure_listing')}
              </div>
            </CardHeader>
            <CardContent className='space-y-5'>
              {saleType === 'fixed' ? (
                <>
                  <div>
                    <label className='block text-sm text-slate-600 mb-1'>
                      {t('marketplace:price')}
                    </label>
                    <div className='flex items-center gap-2'>
                      <input
                        value={fixedPrice}
                        onChange={(e) => setFixedPrice(e.target.value)}
                        inputMode='decimal'
                        className='h-10 w-48 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                      />
                      <select
                        value={paymentToken}
                        onChange={(e) => setPaymentToken(e.target.value)}
                        className='h-10 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                      >
                        {auction_tokens.map((t) => (
                          <option key={t.identifier} value={t.identifier}>
                            {t.token}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>
                      {t('marketplace:price_hint')}
                    </p>
                  </div>
                  <div>
                    <label className='block text-sm text-slate-600 mb-1'>
                      {t('marketplace:start_time')}
                    </label>
                    <input
                      type='datetime-local'
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      className='h-10 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                    />
                    <p className='mt-1 text-xs text-slate-500'>
                      {t('marketplace:start_time_hint')}
                    </p>
                  </div>
                  {/* SFT Options for Fixed Price */}
                  {selected && parseInt(selected.balance || '1') > 1 && (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm text-slate-600 mb-1'>
                          {t('marketplace:qty')}
                        </label>
                        <div className='flex items-center gap-2'>
                          <input
                            type='number'
                            min={1}
                            max={Number(selected.balance || '1')}
                            value={amountToSell}
                            onChange={(e) => {
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
                            {selected.balance} {t('marketplace:available')}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <label className='block text-sm text-slate-600 mb-2'>
                          {t('marketplace:sell_type')}
                        </label>
                        <div className='flex gap-4'>
                          <label className='flex items-center gap-2 cursor-pointer'>
                            <input
                              type='radio'
                              checked={!maxOnePerPayment}
                              onChange={() => setMaxOnePerPayment(false)}
                            />
                            <span className='text-sm'>
                              {t('marketplace:sell_batch')}
                            </span>
                          </label>
                          <label className='flex items-center gap-2 cursor-pointer'>
                            <input
                              type='radio'
                              checked={maxOnePerPayment}
                              onChange={() => setMaxOnePerPayment(true)}
                            />
                            <span className='text-sm'>
                              {t('marketplace:sell_unit')}
                            </span>
                          </label>
                        </div>
                        <p className='mt-1 text-xs text-slate-500'>
                          {maxOnePerPayment
                            ? t('marketplace:sell_unit_desc')
                            : t('marketplace:sell_batch_desc')}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className='flex items-center gap-2 mb-2'>
                      <input
                        type='checkbox'
                        checked={hasEndTime}
                        onChange={(e) => setHasEndTime(e.target.checked)}
                      />
                      <span className='text-sm text-slate-600'>
                        {t('marketplace:set_expiration_date')}
                      </span>
                    </label>
                    {hasEndTime && (
                      <>
                        <label className='block text-sm text-slate-600 mb-1'>
                          {t('marketplace:end_time')}
                        </label>
                        <input
                          type='datetime-local'
                          value={endAt}
                          onChange={(e) => setEndAt(e.target.value)}
                          className='h-10 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                        />
                        <p className='mt-1 text-xs text-slate-500'>
                          {endAt && startAt
                            ? `${Math.max(
                                0,
                                Math.floor(
                                  (new Date(endAt).getTime() -
                                    new Date(startAt).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                              )} ${t('marketplace:days') || 'days'}`
                            : ''}
                        </p>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm text-slate-600 mb-1'>
                        {t('marketplace:min_price')}
                      </label>
                      <div className='flex items-center gap-2'>
                        <input
                          value={minBid}
                          onChange={(e) => setMinBid(e.target.value)}
                          inputMode='decimal'
                          className='h-10 w-48 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                        />
                        <select
                          value={paymentToken}
                          onChange={(e) => setPaymentToken(e.target.value)}
                          className='h-10 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                        >
                          {auction_tokens.map((t) => (
                            <option key={t.identifier} value={t.identifier}>
                              {t.token}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className='mt-1 text-xs text-slate-500'>
                        {t('marketplace:min_price_hint')}
                      </p>
                    </div>
                    <div>
                      <label className='block text-sm text-slate-600 mb-1'>
                        {t('marketplace:min_step')}
                      </label>
                      <input
                        value={minBidStep}
                        onChange={(e) => setMinBidStep(e.target.value)}
                        inputMode='decimal'
                        className='h-10 w-28 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                      />
                      <p className='mt-1 text-xs text-slate-500'>
                        {t('marketplace:min_step_hint')}
                      </p>
                    </div>

                    <div>
                      <label className='block text-sm text-slate-600 mb-1'>
                        {t('marketplace:qty')}
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
                            ? `${selected.balance || '1'} ${t(
                                'marketplace:available'
                              )}`
                            : '—'}
                        </Badge>
                      </div>
                      <p className='mt-1 text-xs text-slate-500'>
                        {t('marketplace:qty_hint')}
                      </p>
                    </div>
                    <div>
                      <label className='block text-sm text-slate-600 mb-1'>
                        {t('marketplace:start_time')}
                      </label>
                      <input
                        type='datetime-local'
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                        className='h-10 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                      />
                      <p className='mt-1 text-xs text-slate-500'>
                        {t('marketplace:start_time_hint')}
                      </p>
                    </div>

                    <div>
                      <label className='block text-sm text-slate-600 mb-1'>
                        {t('marketplace:end_time')}
                      </label>
                      <input
                        type='datetime-local'
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
                        className='h-10 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                      />
                      <p className='mt-1 text-xs text-slate-500'>
                        {endAt && startAt
                          ? `${Math.max(
                              0,
                              Math.floor(
                                (new Date(endAt).getTime() -
                                  new Date(startAt).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            )} ${t('marketplace:days') || 'days'}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={allowBuyNow}
                        onChange={(e) => setAllowBuyNow(e.target.checked)}
                      />
                      <span className='text-sm'>
                        {t('marketplace:allow_buy_now')}{' '}
                      </span>
                    </label>
                    {allowBuyNow && (
                      <div>
                        <label className='block text-sm text-slate-600 mb-1'>
                          {t('marketplace:buy_now_price')}
                        </label>
                        <div className='flex items-center gap-2'>
                          <input
                            value={buyNowPrice}
                            onChange={(e) => setBuyNowPrice(e.target.value)}
                            inputMode='decimal'
                            className='h-10 w-48 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400'
                          />
                          <Badge>{paymentToken}</Badge>
                        </div>
                        <p className='mt-1 text-xs text-slate-500'>
                          {t('marketplace:buy_now_hint')}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className='rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800'>
                    {t('marketplace:auction_bid_warning')}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 4 && (
        <div className='mx-auto max-w-2xl space-y-6'>
          {selected && (
            <div className='flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
              <div className='h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100'>
                <DisplayNft
                  nft={selected}
                  variant='media-only'
                  useThumbnail
                  className='h-full w-full object-cover'
                />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='text-lg font-semibold truncate'>
                  {selected.name}
                </div>
                <div className='text-sm text-slate-500 truncate'>
                  {selected.identifier}
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <div className='font-semibold'>
                {t('marketplace:review_confirm')}
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
                <div className='rounded-md border p-3'>
                  <div className='text-xs text-slate-500'>
                    {t('marketplace:sale_type')}
                  </div>
                  <div className='font-medium'>
                    {saleType === 'fixed'
                      ? t('marketplace:fixed_price')
                      : t('marketplace:auction')}
                  </div>
                </div>

                {/* Info commune: Quantité / Type de vente SFT */}
                <div className='rounded-md border p-3'>
                  <div className='text-xs text-slate-500'>
                    {t('marketplace:qty') || 'Quantity'}
                  </div>
                  <div className='font-medium'>
                    {amountToSell} item(s)
                    {parseInt(amountToSell) > 1 && (
                      <span className='ml-1 text-slate-500 text-xs font-normal'>
                        ({maxOnePerPayment ? 'Unit' : 'Batch'})
                      </span>
                    )}
                  </div>
                </div>

                {/* Info commune: Calendrier */}
                <div className='rounded-md border p-3'>
                  <div className='text-xs text-slate-500'>
                    {t('marketplace:schedule')}
                  </div>
                  <div className='font-medium'>
                    {new Date(startAt).toLocaleString()}{' '}
                    <span className='text-slate-400'>→</span>{' '}
                    {hasEndTime || saleType === 'auction'
                      ? new Date(endAt).toLocaleString()
                      : t('marketplace:infinite')}
                  </div>
                </div>

                {saleType === 'fixed' ? (
                  <>
                    <div className='rounded-md border p-3'>
                      <div className='text-xs text-slate-500'>
                        {t('marketplace:price')}
                      </div>
                      <div className='font-medium'>
                        {fmt({
                          ticker: selectedPaymentToken.token,
                          amount: fixedPrice,
                          decimals: selectedPaymentToken.decimals
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className='rounded-md border p-3'>
                      <div className='text-xs text-slate-500'>
                        {t('marketplace:min_price')}
                      </div>
                      <div className='font-medium'>
                        {fmt({
                          ticker: selectedPaymentToken.token,
                          amount: minBid,
                          decimals: selectedPaymentToken.decimals
                        })}
                      </div>
                    </div>
                    {/* Schedule moved up to common */}
                    <div className='rounded-md border p-3'>
                      <div className='text-xs text-slate-500'>
                        {t('marketplace:options')}
                      </div>
                      <div className='font-medium'>
                        {t('marketplace:min_step')}{' '}
                        {fmt({
                          ticker: selectedPaymentToken.token,
                          amount: minBidStep,
                          decimals: selectedPaymentToken.decimals
                        })}{' '}
                        {allowBuyNow && buyNowPrice
                          ? `· ${t('marketplace:buy_now_price')} ${fmt({
                              ticker: selectedPaymentToken.token,
                              amount: buyNowPrice,
                              decimals: selectedPaymentToken.decimals
                            })}`
                          : ''}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* FEE SUMMARY */}
              {selected && (
                <div className='rounded-xl bg-slate-50 p-4 space-y-2 border border-slate-200'>
                  <h3 className='font-semibold text-slate-700 text-sm mb-2'>
                    {t('marketplace:fees_summary')}
                  </h3>

                  {saleType === 'fixed' ? (
                    <div className='space-y-1 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-slate-600'>
                          {t('marketplace:sales_price')}
                        </span>
                        <span className='font-medium'>
                          {maxOnePerPayment && parseInt(amountToSell) > 1
                            ? (
                                parseFloat(fixedPrice || '0') *
                                parseInt(amountToSell)
                              ).toFixed(4)
                            : fixedPrice}{' '}
                          {selectedPaymentToken.token}
                        </span>
                      </div>
                      <div className='flex justify-between text-slate-500'>
                        <span>
                          {t('marketplace:marketplace_fee', {
                            percent: MARKETPLACE_FEE_PERCENT
                          })}
                        </span>
                        <span>
                          -
                          {(
                            ((maxOnePerPayment && parseInt(amountToSell) > 1
                              ? parseFloat(fixedPrice || '0') *
                                parseInt(amountToSell)
                              : parseFloat(fixedPrice || '0')) *
                              MARKETPLACE_FEE_PERCENT) /
                            100
                          ).toFixed(4)}{' '}
                          {selectedPaymentToken.token}
                        </span>
                      </div>
                      <div className='flex justify-between text-slate-500'>
                        <span>
                          {t('marketplace:creator_royalties', {
                            percent: selected.royalties || 0
                          })}
                        </span>
                        <span>
                          -
                          {(
                            ((maxOnePerPayment && parseInt(amountToSell) > 1
                              ? parseFloat(fixedPrice || '0') *
                                parseInt(amountToSell)
                              : parseFloat(fixedPrice || '0')) *
                              (selected.royalties || 0)) /
                            100
                          ).toFixed(4)}{' '}
                          {selectedPaymentToken.token}
                        </span>
                      </div>
                      <div className='border-t border-slate-200 my-2 pt-2 flex justify-between font-semibold text-slate-900 text-base'>
                        <span>{t('marketplace:estimated_receive')}</span>
                        <span>
                          {(
                            (maxOnePerPayment && parseInt(amountToSell) > 1
                              ? parseFloat(fixedPrice || '0') *
                                parseInt(amountToSell)
                              : parseFloat(fixedPrice || '0')) *
                            (1 -
                              (MARKETPLACE_FEE_PERCENT +
                                (selected.royalties || 0)) /
                                100)
                          ).toFixed(4)}{' '}
                          {selectedPaymentToken.token}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className='text-sm text-slate-500'>
                      <p>{t('marketplace:auction_fee_intro')}</p>
                      <ul className='list-disc list-inside mt-1 ml-1 space-y-0.5'>
                        <li>
                          <strong>
                            {t('marketplace:auction_fee_marketplace', {
                              percent: MARKETPLACE_FEE_PERCENT
                            })}
                          </strong>
                        </li>
                        <li>
                          <strong>
                            {t('marketplace:auction_fee_royalties', {
                              percent: selected.royalties || 0
                            })}
                          </strong>
                        </li>
                      </ul>
                      <p className='mt-2 italic'>
                        {t('marketplace:auction_fee_receive', {
                          percent:
                            100 -
                            MARKETPLACE_FEE_PERCENT -
                            (selected.royalties || 0)
                        })}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className='border-t pt-4'>
                <label className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span className='text-sm'>
                    {t('marketplace:confirm_terms')}
                  </span>
                </label>
              </div>

              <div className='pt-2'>
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
                      ? new BigNumber(
                          toDenominatedInteger(
                            fixedPrice,
                            selectedPaymentToken.decimals
                          )
                        )
                      : new BigNumber(
                          toDenominatedInteger(
                            minBid,
                            selectedPaymentToken.decimals
                          )
                        )
                  }
                  maximum_bid={
                    saleType === 'fixed'
                      ? new BigNumber(
                          toDenominatedInteger(
                            fixedPrice,
                            selectedPaymentToken.decimals
                          )
                        )
                      : allowBuyNow && buyNowPrice
                      ? new BigNumber(
                          toDenominatedInteger(
                            buyNowPrice,
                            selectedPaymentToken.decimals
                          )
                        )
                      : new BigNumber(0)
                  }
                  deadline={
                    saleType === 'fixed' && !hasEndTime
                      ? 0
                      : toTimestampSeconds(endAt)
                  }
                  accepted_payment_token_identifier={paymentToken}
                  opt_min_bid_diff={
                    saleType === 'fixed'
                      ? new BigNumber(0)
                      : minBidStep && parseFloat(minBidStep) > 0
                      ? new BigNumber(
                          toDenominatedInteger(
                            minBidStep,
                            selectedPaymentToken.decimals
                          )
                        )
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
                <div className='mt-2 text-center text-xs text-slate-500'>
                  {t('marketplace:wallet_sign_hint')}
                </div>
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
          {t('marketplace:back')}
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
              {t('marketplace:continue')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
