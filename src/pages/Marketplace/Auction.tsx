import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
};

type AuctionItem = {
  id: string;
  source: string;
  saleType: string;
  name: string;
  auctioned_tokens: {
    token_identifier: string;
    token_nonce: number;
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

const Badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center rounded-md border border-gray-200 bg-white/90 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-gray-700 shadow-sm ${className}`}>
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
        token_nonce: tokenNonce
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

  return (
    <div className='group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col h-full'>
      {/* Image Section */}
      <div className='relative aspect-square bg-gray-100 overflow-hidden'>
        <DisplayNftByToken
          tokenIdentifier={auction?.auctioned_tokens?.token_identifier}
          nonce={auction?.auctioned_tokens?.token_nonce?.toString()}
          className='absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
        />

        {/* Badges overlay */}
        <div className='absolute left-2 top-2 flex gap-1 flex-wrap'>
          {auction?.source && <Badge>{String(auction.source)}</Badge>}
          {auction?.saleType && <Badge>{String(auction.saleType)}</Badge>}
          {isCreator && <Badge className='!bg-blue-100 !text-blue-700 !border-blue-200'>Creator</Badge>}
          {isWinner && <Badge className='!bg-green-100 !text-green-700 !border-green-200'>Winning</Badge>}
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

          {auction?.max_bid && (
            <div className='flex justify-between items-center text-xs text-gray-500'>
              <span>Direct Buy</span>
              <span>
                <FormatAmount
                  amount={auction?.max_bid}
                  identifier={auction?.payment_token}
                />
              </span>
            </div>
          )}
        </div>

        <div className='mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-3'>
          <div className='text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md'>
            <Countdown endTime={auction?.auction?.endTime || 0} />
          </div>

          <Link
            to={`/marketplace/listings/${encodeURIComponent(auction.id)}`}
            className='inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm hover:shadow'
          >
            Bid Now
          </Link>
        </div>
      </div>
    </div>
  );
};
