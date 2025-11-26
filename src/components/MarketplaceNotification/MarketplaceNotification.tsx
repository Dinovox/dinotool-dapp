import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketplaceEvents } from 'hooks/useMarketplaceEvents';
import { DecodedEvent } from 'helpers/transactionEventHelper';
import { X } from 'lucide-react';
import DisplayNftByToken from 'helpers/DisplayNftByToken';
import { FormatAmount } from 'helpers/api/useGetEsdtInformations';

interface NotificationItemProps {
  event: DecodedEvent;
  onClose: (id: string) => void;
}

const NotificationItem = ({ event, onClose }: NotificationItemProps) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<React.ReactNode>('');
  const [icon, setIcon] = useState<string>('🔔');
  const [tokenId, setTokenId] = useState<string>('');
  const [nonce, setNonce] = useState<string>('');

  useEffect(() => {
    // Parse event details for UI
    switch (event.identifier) {
      case 'bid_event':
        setTitle('New Bid Placed!');
        setIcon('💸');
        setTokenId(event.auction_token_id);
        setNonce(event.auctioned_token_nonce?.toString());
        setMessage(
          <span>
            Bid of{' '}
            <strong>
              <FormatAmount
                amount={event.bid_amount}
                identifier={event.payment_token_id}
              />
            </strong>{' '}
            placed on item.
            <br />
            <a
              href={`/marketplace/listings/${event.auction_id}`}
              className='text-blue-500 hover:underline'
            >
              View Auction
            </a>
          </span>
        );
        console.log(event);
        break;
      case 'end_auction_event':
        setTitle('Auction Ended!');
        setIcon('🏆');
        setTokenId(event.auction_token_id);
        setNonce(event.auctioned_token_nonce?.toString());
        setMessage(
          <span>
            Item sold for{' '}
            <a
              href={`/nfts/${
                event.auction_token_id
              }-${event.auctioned_token_nonce?.toString()}`}
              className='text-blue-500 hover:underline'
            >
              <FormatAmount
                amount={event.winning_bid_amount}
                identifier={event.payment_token_id}
              />
            </a>
          </span>
        );
        console.log(event);
        break;
      case 'buy_sft_event':
        setTitle('Item Purchased!');
        setIcon('🛒');
        setTokenId(event.auction_token_id);
        setNonce(event.auctioned_token_nonce?.toString());
        setMessage(
          <span>
            <strong>{event.nr_bought_tokens?.toString()}</strong> items bought
            directly!
          </span>
        );
        break;
      case 'auction_token_event':
        setTitle('New Listing!');
        setIcon('🏷️');
        setTokenId(event.auction_token_id);
        setNonce(event.auctioned_token_nonce?.toString());
        setMessage(
          <span>
            New item listed for auction/sale!
            <br />
            <a
              href={`/marketplace/listings/${event.auction_id}`}
              className='text-blue-500 hover:underline'
            >
              View listing
            </a>
          </span>
        );
        break;
      case 'withdraw_event':
        setTitle('Auction Cancelled!');
        setIcon('❌');
        setTokenId(event.auction_token_id);
        setNonce(event.auctioned_token_nonce?.toString());
        setMessage(<span>Auction cancelled by seller.</span>);
        break;
      default:
        setTitle('Marketplace Update');
        setMessage('New activity on the marketplace.');
        console.log(event);
    }
  }, [event]);

  // Auto-close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(event.uniqueId);
    }, 8000);
    return () => clearTimeout(timer);
  }, [event.uniqueId, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      layout
      className='pointer-events-auto flex w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5'
    >
      <div className='p-4 w-full'>
        <div className='flex items-start'>
          <div className='flex-shrink-0 pt-0.5'>
            {tokenId ? (
              <div className='h-10 w-10 rounded-md overflow-hidden'>
                <DisplayNftByToken
                  tokenIdentifier={tokenId}
                  nonce={nonce}
                  className='h-full w-full object-cover'
                  variant='media-only'
                />
              </div>
            ) : (
              <span className='text-3xl'>{icon}</span>
            )}
          </div>
          <div className='ml-3 w-0 flex-1 pt-0.5'>
            <p className='text-sm font-medium text-gray-900'>{title}</p>
            <p className='mt-1 text-sm text-gray-500'>{message}</p>
          </div>
          <div className='ml-4 flex flex-shrink-0'>
            <button
              type='button'
              className='inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
              onClick={() => onClose(event.uniqueId)}
            >
              <span className='sr-only'>Close</span>
              <X className='h-5 w-5' aria-hidden='true' />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const MarketplaceNotification = () => {
  const { events, clearEvents } = useMarketplaceEvents();
  const [notifications, setNotifications] = useState<DecodedEvent[]>([]);

  useEffect(() => {
    if (events.length > 0) {
      // Add new events to the notification queue
      // Filter out duplicates if any (though hook handles basic dedup)
      const newNotifs = events.filter(
        (e) => !notifications.find((n) => n.uniqueId === e.uniqueId)
      );

      if (newNotifs.length > 0) {
        setNotifications((prev) => [...prev, ...newNotifs]);
        // Clear events from hook so we don't re-process them
        clearEvents();
      }
    }
  }, [events, notifications, clearEvents]);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.uniqueId !== id));
  };

  return (
    <div
      aria-live='assertive'
      className='pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-end sm:p-6 z-[9999]'
    >
      <div className='flex w-full flex-col items-center space-y-4 sm:items-end'>
        <AnimatePresence>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.uniqueId}
              event={notification}
              onClose={removeNotification}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
