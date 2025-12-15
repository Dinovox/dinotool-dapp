import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import DisplayNftByToken from 'helpers/DisplayNftByToken';
import { FormatAmount } from 'helpers/api/useGetEsdtInformations';
import { useGetAccount } from 'lib';
// Types adapted from Marketplace.tsx
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
  maxBid: BigNumber;
};

type AuctionItem = {
  id: string;
  source: string;
  saleType: string;
  name: string;
  auctioned_tokens: {
    token_identifier: string;
    token_nonce: number;
    amount: string;
  };
  payment_token: string;
  payment_nonce: number;
  auction?: {
    current_bid?: TokenAmount;
    startPrice: TokenAmount;
    endTime: number;
  };
  min_bid?: string;
  max_bid?: string;
  original_owner?: string;
  current_winner?: string;
};

function Countdown({ endTime }: { endTime: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  let diff = Math.max(0, endTime - now);
  if (diff === 0) return <span>0s</span>;

  // Convert to seconds
  const s = Math.floor(diff / 1000);

  const secondsInMonth = 30 * 24 * 60 * 60; // 30 days ≈ 1 month
  const secondsInDay = 24 * 60 * 60;

  const months = Math.floor(s / secondsInMonth);
  const afterMonths = s % secondsInMonth;

  const days = Math.floor(afterMonths / secondsInDay);
  const afterDays = afterMonths % secondsInDay;

  const hours = Math.floor(afterDays / 3600);
  const minutes = Math.floor((afterDays % 3600) / 60);
  const seconds = afterDays % 60;

  const parts: string[] = [];

  if (months > 0) parts.push(`${months}M`);
  if (months > 0 || days > 0) parts.push(`${days}d`);
  if (months > 0 || days > 0 || hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0 || months > 0)
    parts.push(`${minutes}m`);

  parts.push(`${seconds}s`);

  return <span>{parts.join(' ')}</span>;
}

const Badge = ({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center rounded-md border border-gray-200 bg-white/90 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-gray-700 shadow-sm ${className}`}
  >
    {children}
  </span>
);

export const Auction = ({ auction: rawAuction }: { auction: any }) => {
  const { address } = useGetAccount();
  // Normalize contract data to AuctionItem
  const auction: AuctionItem = useMemo(() => {
    if (!rawAuction) return {} as AuctionItem;

    // Check if it's already in the correct format (has 'source' or 'saleType')
    if (rawAuction.source || rawAuction.saleType) {
      return rawAuction as AuctionItem;
    }

    // Map contract data
    // Contract struct: { auction_id, auctioned_tokens: { token_identifier, token_nonce, amount }, min_bid, current_bid, deadline, ... }

    const tokenIdentifier =
      rawAuction.auctioned_tokens?.token_identifier?.toString() || '';
    const tokenNonce = Number(rawAuction.auctioned_tokens?.token_nonce || 0);

    const paymentToken = rawAuction.payment_token?.toString() || 'EGLD'; // Default or extract

    return {
      id: rawAuction.auction_id?.toString() || '',
      source: 'dinovox', // It comes from our contract
      saleType: 'auction',
      name: `${tokenIdentifier} #${tokenNonce}`, // Fallback name
      auctioned_tokens: {
        token_identifier: tokenIdentifier,
        token_nonce: tokenNonce,
        amount: rawAuction.auctioned_tokens?.amount?.toString() || '1'
      },
      payment_token: paymentToken,
      payment_nonce: Number(rawAuction.payment_nonce || 0),
      auction: {
        startPrice: {
          ticker: paymentToken,
          amount: rawAuction.min_bid?.toString() || '0',
          decimals: 18 // TODO: fetch decimals
        },
        current_bid: rawAuction.current_bid
          ? {
              ticker: paymentToken,
              amount: rawAuction.current_bid.toString(),
              decimals: 18
            }
          : undefined,
        endTime: Number(rawAuction.deadline || 0) * 1000 // Contract usually uses seconds, JS uses ms
      },
      min_bid: rawAuction.min_bid?.toString(),
      max_bid: rawAuction.max_bid?.toString(),
      original_owner: rawAuction.original_owner?.toString(),
      current_winner: rawAuction.current_winner?.toString()
    };
  }, [rawAuction]);

  const isCreator = address && auction.original_owner === address;
  const isWinner = address && auction.current_winner === address;

  // Determine button display logic
  const isDirectSale = useMemo(() => {
    if (!auction.min_bid || !auction.max_bid) return false;
    return (
      new BigNumber(auction.min_bid).isEqualTo(auction.max_bid) &&
      new BigNumber(auction.max_bid).gt(0)
    );
  }, [auction.min_bid, auction.max_bid]);

  const hasBuyNow = useMemo(() => {
    return auction.max_bid && new BigNumber(auction.max_bid).gt(0);
  }, [auction.max_bid]);

  return (
    <Link
      to={`/marketplace/listings/${encodeURIComponent(auction.id)}`}
      className='group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col h-full'
    >
      {/* Image Section */}
      <div className='relative aspect-square bg-gray-100 overflow-hidden'>
        <DisplayNftByToken
          tokenIdentifier={auction?.auctioned_tokens?.token_identifier}
          nonce={auction?.auctioned_tokens?.token_nonce?.toString()}
          variant='media-only'
          className='absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
        />

        {/* Badges overlay */}
        <div className='absolute left-2 top-2 flex gap-1 flex-wrap'>
          {auction?.source && <Badge>{String(auction.source)}</Badge>}
          {!isDirectSale && <Badge>auction</Badge>}
          {hasBuyNow && <Badge>buy now</Badge>}
          {isCreator && (
            <Badge className='!bg-blue-100 !text-blue-700 !border-blue-200'>
              Creator
            </Badge>
          )}
          {isWinner && (
            <Badge className='!bg-green-100 !text-green-700 !border-green-200'>
              Winning
            </Badge>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className='p-4 flex-1 flex flex-col space-y-3'>
        <div>
          <h3 className='font-semibold text-gray-900 text-lg truncate group-hover:text-blue-600 transition-colors'>
            {auction?.name}
          </h3>
          <p className='text-xs text-gray-500 font-mono truncate'>
            {auction?.auctioned_tokens?.token_identifier}
          </p>
        </div>

        <div className='space-y-1 bg-gray-50 rounded-lg p-3'>
          {isDirectSale ? (
            <>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-gray-500'>Quantity</span>
                <span className='font-bold text-gray-900'>
                  {auction?.auctioned_tokens?.amount || '1'}
                </span>
              </div>

              <div className='flex justify-between items-center text-sm'>
                <span className='text-gray-500'>Price</span>
                <span className='font-bold text-gray-900'>
                  <FormatAmount
                    amount={auction?.max_bid}
                    identifier={auction?.payment_token}
                  />
                </span>
              </div>
              <span className='invisible'>Placeholder</span>
            </>
          ) : (
            <>
              {' '}
              {auction?.min_bid && (
                <div className='flex justify-between items-center text-xs text-gray-500'>
                  <span>Min bid</span>
                  <span>
                    <FormatAmount
                      amount={auction?.min_bid}
                      identifier={auction?.payment_token}
                    />
                  </span>
                </div>
              )}
              <div className='flex justify-between items-center text-sm'>
                <span className='text-gray-500'>Current bid</span>
                <span className='font-bold text-gray-900'>
                  <FormatAmount
                    amount={
                      auction?.auction?.current_bid?.amount ||
                      auction?.auction?.startPrice?.amount
                    }
                    identifier={auction?.payment_token}
                  />
                </span>
              </div>
              {/* Reserve fixed space for Direct Buy to align all cards */}
              <div className='flex justify-between items-center text-xs text-gray-500 min-h-[20px]'>
                {auction?.max_bid ? (
                  <>
                    <span>Direct Buy</span>
                    <span>
                      <FormatAmount
                        amount={auction?.max_bid}
                        identifier={auction?.payment_token}
                      />
                    </span>
                  </>
                ) : (
                  <span className='invisible'>Placeholder</span>
                )}
              </div>
            </>
          )}
        </div>

        <div className='mt-auto pt-3 border-t border-gray-100 space-y-2'>
          <div className='text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-center'>
            <Countdown endTime={auction?.auction?.endTime || 0} />
          </div>

          <div className='flex gap-1.5'>
            {/* Show Bid Now if: not a direct sale (max_price != start_price) */}
            {!isDirectSale && (
              <div className='flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm hover:shadow'>
                Bid Now
              </div>
            )}
            {/* Show Buy Now if: max_price > 0 */}
            {hasBuyNow && (
              <div
                className={`flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg transition-colors shadow-sm hover:shadow ${
                  isDirectSale
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Buy Now
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
