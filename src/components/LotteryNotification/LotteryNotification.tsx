import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLotteryEvents } from 'hooks/useLotteryEvents';
import { DecodedEvent } from 'helpers/transactionEventHelper';
import { X } from 'lucide-react';
import ShortenedAddress from 'helpers/shortenedAddress';

interface NotificationItemProps {
  event: DecodedEvent;
  onClose: (id: string) => void;
}

const NotificationItem = ({ event, onClose }: NotificationItemProps) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<React.ReactNode>('');
  const [icon, setIcon] = useState<string>('🔔');

  useEffect(() => {
    switch (event.identifier) {
      case 'lotteryCreated':
        setTitle('New Lottery Created!');
        setIcon('🎟️');
        setMessage(
          <span>
            Lottery <strong>#{event.lottery_id.toString()}</strong> has been
            created!
            <br />
            <a
              href={`/lotteries/${event.lottery_id}`}
              className='text-blue-500 hover:underline'
            >
              Check it out
            </a>
          </span>
        );
        break;
      case 'lotteryDrawn':
        setTitle('Lottery Drawn!');
        setIcon('🏆');
        setMessage(
          <span>
            Winner found for Lottery{' '}
            <strong>#{event.lottery_id.toString()}</strong>!
            <br />
            Winner:{' '}
            <span className='font-mono text-xs'>
              <ShortenedAddress address={event.winner} />
            </span>
            <br />
            <a
              href={`/lotteries/${event.lottery_id}`}
              className='text-blue-500 hover:underline'
            >
              View Lottery
            </a>
          </span>
        );
        break;
      case 'lotteryBuyed':
        setTitle('Ticket Purchased!');
        setIcon('🎫');
        setMessage(
          <span>
            A ticket was purchased for Lottery{' '}
            <strong>#{event.lottery_id.toString()}</strong>!
            <br />
            Buyer:{' '}
            <span className='font-mono text-xs'>
              <ShortenedAddress address={event.buyer} />
            </span>
            <br />
            <a
              href={`/lotteries/${event.lottery_id}`}
              className='text-blue-500 hover:underline'
            >
              View Lottery
            </a>
          </span>
        );
        break;

      default:
        setTitle('Lottery Update');
        setMessage('New activity on the lottery.');
    }
  }, [event]);

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
            <span className='text-3xl'>{icon}</span>
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

export const LotteryNotification = () => {
  const { events, clearEvents } = useLotteryEvents();
  const [notifications, setNotifications] = useState<DecodedEvent[]>([]);

  useEffect(() => {
    if (events.length > 0) {
      const newNotifs = events.filter(
        (e) => !notifications.find((n) => n.uniqueId === e.uniqueId)
      );

      if (newNotifs.length > 0) {
        setNotifications((prev) => [...prev, ...newNotifs]);
        clearEvents();
      }
    }
  }, [events, notifications, clearEvents]);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.uniqueId !== id));
  };

  if (notifications.length === 0) return null;

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
