import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Breadcrumb } from 'components/ui/Breadcrumb';
import { useGetCollections } from 'helpers/api/getCollections';
import { useGetAuctionsPaginated } from 'contracts/dinauction/helpers/useGetAuctionsPaginated';
import { useGetOffers } from 'helpers/api/useGetOffers';
import { useGetCollectionStats } from 'helpers/api/useGetCollectionStats';
import { Auction } from 'pages/Marketplace/Auction';

import { ActionMakeGlobalOffer } from 'contracts/dinauction/actions/MakeGlobalOffer';
import { ActionMakeOffer } from 'contracts/dinauction/actions/MakeOffer';
import BigNumber from 'bignumber.js';
import ShortenedAddress from 'helpers/shortenedAddress';
import { FormatAmount } from 'helpers/api/useGetEsdtInformations';
import { ActionAcceptOffer } from 'contracts/dinauction/actions/AcceptOffer';
import { ActionWithdrawOffer } from 'contracts/dinauction/actions/WithdrawOffer';
import { useGetAccount } from 'lib';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import { DisplayNft } from 'helpers/DisplayNft';
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

const Card: React.FC<
  React.PropsWithChildren<{ className?: string; id?: string }>
> = ({ children, className = '', id }) => (
  <div
    id={id}
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
  const { address } = useGetAccount();
  const { hash } = window.location;
  const [activeTab, setActiveTabState] = useState<'listings' | 'offers'>(
    hash === '#offers' ? 'offers' : 'listings'
  );

  const setActiveTab = (tab: 'listings' | 'offers') => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };
  const [page, setPage] = useState(1);
  const [offersPage, setOffersPage] = useState(1);
  const [saleType, setSaleType] = useState<SaleType>('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');

  // Global Offer State
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNonce, setOfferNonce] = useState('');
  const [offerDuration, setOfferDuration] = useState('3'); // Days

  // Select In Wallet State
  const [selectedOfferForWallet, setSelectedOfferForWallet] = useState<
    number | null
  >(null);
  const [showOfferForWalletModal, setShowOfferForWalletModal] = useState(false);

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

  // 5. Fetch Offers
  const { data: offersData, loading: offersLoading } = useGetOffers({
    page: offersPage,
    limit: 20,
    collection: id
  });

  // 6. Fetch User NFTs for Select Modal
  const userNfts = useGetUserNFT(address, undefined, id, {
    enabled: !!selectedOfferForWallet
  });

  // 7. Fetch Collection Stats
  const { stats: collectionStats } = useGetCollectionStats(id);

  // 4. Stats (Placeholder or derived)
  const stats = {
    floorPrice: collectionStats?.floor_ask_egld || undefined,
    bestOffer: collectionStats?.best_offer_egld || undefined,
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
                  <FormatAmount amount={stats.floorPrice} identifier='EGLD' />
                </span>
              ) : (
                '-'
              )}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className='text-xs text-slate-500'>Best Offer</div>
            <div className='text-lg font-semibold text-slate-900'>
              {stats.bestOffer && stats.bestOffer !== '0' ? (
                <span>
                  <FormatAmount amount={stats.bestOffer} identifier='EGLD' />
                </span>
              ) : (
                '-'
              )}
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

      {/* Collection Actions */}
      <div className='mb-6'>
        {!showOfferForm ? (
          <div className='flex justify-end'>
            <Link
              to={`/marketplace/sell?collection=${id}`}
              className='rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 mr-2'
            >
              Sell Item
            </Link>
            <button
              onClick={() => setShowOfferForm(true)}
              className='rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'
            >
              Make Offer
            </button>
          </div>
        ) : (
          <div className='mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='font-semibold text-lg'>
                {offerNonce ? 'Make Specific Offer' : 'Make Collection Offer'}
              </h3>
              <button
                onClick={() => setShowOfferForm(false)}
                className='text-sm text-slate-500 hover:text-slate-700'
              >
                Cancel
              </button>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Token Nonce (Optional)
                </label>
                <div className='text-xs text-gray-500 mb-2'>
                  Leave empty to make a global offer for ANY item in this
                  collection. Enter a number to offer for a specific item.
                </div>
                <input
                  type='number'
                  value={offerNonce}
                  onChange={(e) => setOfferNonce(e.target.value)}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  placeholder='e.g. 123'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Offer Price (EGLD)
                </label>
                <input
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  placeholder='Amount'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Valid for (days)
                </label>
                <input
                  type='number'
                  value={offerDuration}
                  onChange={(e) => setOfferDuration(e.target.value)}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  min='1'
                />
              </div>

              <div className='pt-2'>
                {offerNonce ? (
                  <ActionMakeOffer
                    nftIdentifier={id}
                    nftNonce={parseInt(offerNonce)}
                    paymentToken='EGLD'
                    offerPrice={new BigNumber(offerPrice || '0')
                      .shiftedBy(18)
                      .toFixed(0)}
                    deadline={
                      Math.floor(Date.now() / 1000) +
                      (parseInt(offerDuration) || 1) * 86400
                    }
                    label={`Offer for #${offerNonce}`}
                    disabled={!offerPrice || parseFloat(offerPrice) <= 0}
                  />
                ) : (
                  <ActionMakeGlobalOffer
                    collectionIdentifier={id}
                    nftAmount={1}
                    paymentToken='EGLD'
                    offerPrice={new BigNumber(offerPrice || '0')
                      .shiftedBy(18)
                      .toFixed(0)}
                    deadline={
                      Math.floor(Date.now() / 1000) +
                      (parseInt(offerDuration) || 1) * 86400
                    }
                    label='Make Global Offer'
                    disabled={!offerPrice || parseFloat(offerPrice) <= 0}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className='mb-4 border-b border-gray-200'>
        <nav className='-mb-px flex space-x-8'>
          <button
            onClick={() => setActiveTab('listings')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'listings'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Listings
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'offers'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Offers
          </button>
        </nav>
      </div>

      {activeTab === 'listings' && (
        <Card id='listings'>
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
      )}

      {activeTab === 'offers' && (
        <Card id='offers'>
          <CardHeader>
            <div className='font-semibold'>Offers</div>
          </CardHeader>
          <CardContent>
            {offersLoading ? (
              <div className='py-16 text-center text-sm text-slate-500'>
                Loading offers...
              </div>
            ) : !offersData || offersData.offers.length === 0 ? (
              <div className='py-16 text-center text-sm text-slate-500'>
                No active offers found.
              </div>
            ) : (
              // Use total_count for pagination logic if needed, simplify for now
              <>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm text-left'>
                    <thead className='text-slate-500 border-b'>
                      <tr>
                        <th className='py-3 pr-4'>Type</th>
                        <th className='py-3 pr-4'>Item</th>
                        <th className='py-3 pr-4'>Price</th>
                        <th className='py-3 pr-4'>Expires</th>
                        <th className='py-3 pr-4'>From</th>
                        <th className='py-3 pr-4'>Status</th>
                        <th className='py-3'>Action</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      {offersData.offers.map((offer) => {
                        const isGlobal =
                          !offer.offerTokenNonce || offer.offerTokenNonce === 0;
                        const deadlineDate = new Date(offer.deadline);
                        const isExpired = Date.now() > deadlineDate.getTime();

                        return (
                          <tr key={offer.id}>
                            <td className='py-3 pr-4'>
                              <Badge tone={isGlobal ? 'brand' : 'neutral'}>
                                {isGlobal
                                  ? 'Collection Offer'
                                  : 'Specific Offer'}
                              </Badge>
                            </td>
                            <td className='py-3 pr-4 inline-flex items-center gap-2'>
                              <span className='font-medium'>
                                {offer.offerTokenIdentifier}
                              </span>
                              {!isGlobal && (
                                <span className='text-slate-500'>
                                  #{offer.offerTokenNonce}
                                </span>
                              )}
                            </td>
                            <td className='py-3 pr-4 font-semibold'>
                              <FormatAmount
                                amount={offer.paymentAmount}
                                identifier={offer.paymentTokenIdentifier}
                              />
                            </td>
                            <td className='py-3 pr-4 text-slate-500'>
                              {deadlineDate.toLocaleDateString()}
                              {isExpired && (
                                <span className='text-red-500 text-xs ml-1'>
                                  (Expired)
                                </span>
                              )}
                            </td>
                            <td className='py-3 pr-4'>
                              {offer.owner ? (
                                <ShortenedAddress
                                  address={offer.owner.address}
                                />
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className='py-3 pr-4'>
                              {isExpired ? (
                                <Badge>Expired</Badge>
                              ) : (
                                <Badge tone='brand'>Active</Badge>
                              )}
                            </td>
                            <td className='py-3'>
                              {offer.owner?.address === address ? (
                                <ActionWithdrawOffer
                                  offerId={offer.id}
                                  label='Withdraw'
                                />
                              ) : (
                                <>
                                  {!isGlobal && !isExpired && (
                                    <ActionAcceptOffer
                                      offerId={offer.id}
                                      offerNonce={1}
                                      nftIdentifier={offer.offerTokenIdentifier}
                                      nftNonce={offer.offerTokenNonce}
                                      label='Accept'
                                    />
                                  )}
                                  {isGlobal && !isExpired && (
                                    <button
                                      onClick={() =>
                                        setSelectedOfferForWallet(offer.id)
                                      }
                                      className='text-xs text-indigo-600 hover:text-indigo-800 font-medium underline'
                                    >
                                      Select in Wallet
                                    </button>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination for Offers */}
                <div className='mt-6 flex items-center justify-center gap-2'>
                  <button
                    onClick={() => setOffersPage((p) => Math.max(1, p - 1))}
                    disabled={offersPage === 1}
                    className='h-9 px-4 rounded-md border bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                  >
                    Previous
                  </button>
                  <span className='text-sm text-slate-600'>
                    Page {offersPage}
                  </span>
                  <button
                    onClick={() => setOffersPage((p) => p + 1)}
                    disabled={offersData.offers.length < 20} // Simple check
                    className='h-9 px-4 rounded-md border bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Select In Wallet Modal */}
      {selectedOfferForWallet && offersData?.offers && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col'>
            <div className='p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10'>
              <h3 className='text-lg font-semibold'>Select Asset to Sell</h3>
              <button
                onClick={() => setSelectedOfferForWallet(null)}
                className='text-slate-500 hover:text-slate-700'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <line x1='18' y1='6' x2='6' y2='18' />
                  <line x1='6' y1='6' x2='18' y2='18' />
                </svg>
              </button>
            </div>

            <div className='p-6 overflow-y-auto'>
              {!userNfts ? (
                <div className='text-center py-10 text-slate-500'>
                  Loading your assets...
                </div>
              ) : userNfts.length === 0 ? (
                <div className='text-center py-10 text-slate-500'>
                  <div>You don't own any assets required for this offer.</div>
                  <div className='text-xs mt-2 text-slate-400'>({id})</div>
                </div>
              ) : (
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                  {userNfts.map((nft) => {
                    // Find offer data to pass to Action
                    const currentOffer = offersData.offers.find(
                      (o) => o.id === selectedOfferForWallet
                    );
                    // Should we filter out NFTs that are already listed or does contract handle it?
                    // Contract will fail if not owner or if locked.
                    // For simplicity, list all.

                    return (
                      <div
                        key={nft.identifier}
                        className='border rounded-xl p-3 hover:border-indigo-500 transition-colors cursor-pointer group'
                      >
                        <div className='aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2 relative'>
                          <DisplayNft
                            nft={nft}
                            className='w-full h-full object-cover'
                          />
                          <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                            {currentOffer && (
                              <ActionAcceptOffer
                                offerId={selectedOfferForWallet}
                                offerNonce={currentOffer?.offerTokenNonce || 0}
                                nftIdentifier={nft.collection}
                                nftNonce={nft.nonce || 0}
                                label='Sell Now'
                              />
                            )}
                          </div>
                        </div>
                        <div className='text-sm font-medium truncate'>
                          {nft.name}
                        </div>
                        <div className='text-xs text-slate-500'>
                          #{nft.nonce}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
