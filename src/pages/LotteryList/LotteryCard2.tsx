import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from 'hooks/useLoadTranslations';
import './LotteryList.css';
import { useNavigate } from 'react-router-dom';
import TicketProgressBar from '../../components/TicketProgressBar';
import BigNumber from 'bignumber.js';
// Types
interface LotteryData {
  id: number;
  lottery_name: string;
  prize_identifier: string;
  prize_nonce: number;
  tickets_sold: number;
  max_tickets: number;
  start_time: string;
  end_time: string;
  price_type: string;
  price_amount: BigNumber;
  price_identifier: string;
  image_url?: string;
  cancelled: boolean;
  winner_id?: number;
  price_data: {
    decimals: number;
  };
}

interface LotteryCard2Props {
  data: LotteryData;
  page_number?: number;
  status_filter?: string;
  price_filter?: string;
}

const LotteryCard2: React.FC<LotteryCard2Props> = ({
  data,
  page_number,
  status_filter,
  price_filter
}) => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [timerColor, setTimerColor] = useState<string>('text-gray-500');
  const [borderColor, setBorderColor] = useState<string>('border-green-500');
  const [hoverTime, setHoverTime] = useState<string>('');

  // Calculate ticket progress percentage
  const ticketProgress = (data.tickets_sold / data.max_tickets) * 100;

  // Get status
  const now = Math.floor(Date.now() / 1000);
  const start = parseInt(data.start_time);

  const status = data.cancelled
    ? 'cancelled'
    : data.winner_id && data.winner_id > 0
    ? 'ended'
    : start > now
    ? 'soon'
    : data.tickets_sold >= data.max_tickets ||
      (parseInt(data.end_time) > 0 && parseInt(data.end_time) < now)
    ? 'draw'
    : 'ongoing';

  // Get progress bar color based on percentage
  const getProgressColor = () => {
    if (ticketProgress < 50) return 'bg-green-500';
    if (ticketProgress < 90) return 'bg-orange-500';
    return 'bg-orange-500';
  };

  // Get border color based on urgency and status
  const getBorderColor = () => {
    const now = Math.floor(Date.now() / 1000);
    const start = parseInt(data.start_time);

    if (now < start) {
      return 'border-gray-400';
    }

    if (timerColor === 'text-orange-500' || ticketProgress >= 100) {
      return 'border-orange-600';
    } else if (timerColor === 'text-orange-500') {
      return 'border-orange-600';
    }
    return 'border-green-600';
  };

  // Format price identifier to keep only the first part
  const formatPriceIdentifier = (identifier: string | undefined) => {
    if (!identifier) return '';
    return identifier.split('-')[0];
  };

  // Update timer and colors
  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const start = parseInt(data.start_time);
      const end = data.end_time === '0' ? 0 : parseInt(data.end_time);

      if (now < start) {
        // Not started yet
        const diff = start - now;
        setTimeRemaining(
          `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
        );
        setHoverTime(
          t('lotteries:open_in', {
            time: `${Math.floor(diff / 3600)}h ${Math.floor(
              (diff % 3600) / 60
            )}m`
          })
        );
        setTimerColor('text-gray-500');
      } else if (end === 0) {
        // Infinite duration
        setTimeRemaining('∞');
        setHoverTime(t('lotteries:no_end_date'));
        setTimerColor('text-green-500');
      } else {
        // Running lottery
        const diff = end - now;
        if (diff <= 0) {
          setTimeRemaining(
            data.cancelled
              ? t('lotteries:status_cancelled')
              : t('lotteries:expired')
          );
          setHoverTime(
            data.cancelled
              ? t('lotteries:status_cancelled')
              : t('lotteries:expired')
          );
          setTimerColor('text-orange-500');
        } else if (diff <= 300) {
          // Less than 5 minutes
          setTimeRemaining(`${Math.floor(diff / 60)}m ${diff % 60}s`);
          setHoverTime(
            t('lotteries:end_in', {
              time: `${Math.floor(diff / 60)}m ${diff % 60}s`
            })
          );
          setTimerColor('text-orange-500');
        } else if (diff <= 3600) {
          // Less than 1 hour
          setTimeRemaining(`${Math.floor(diff / 60)}m`);
          setHoverTime(
            t('lotteries:end_in', { time: `${Math.floor(diff / 60)}m` })
          );
          setTimerColor('text-orange-500');
        } else {
          setTimeRemaining(
            `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
          );
          setHoverTime(
            t('lotteries:end_in', {
              time: `${Math.floor(diff / 3600)}h ${Math.floor(
                (diff % 3600) / 60
              )}m`
            })
          );
          setTimerColor('text-green-500');
        }
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [data.start_time, data.end_time, t]);

  // Update border color based on urgency
  useEffect(() => {
    const updateBorderColor = () => {
      const newBorderColor = getBorderColor();
      setBorderColor(newBorderColor);
    };

    updateBorderColor();
    // Met à jour la couleur toutes les secondes
    const interval = setInterval(updateBorderColor, 1000);
    return () => clearInterval(interval);
  }, [
    timerColor,
    data.tickets_sold,
    data.max_tickets,
    data.start_time,
    data.end_time
  ]);

  return (
    <div
      className={`cardMesNFT relative bg-white !border-2 ${borderColor} !important transition-all duration-300 rounded-xl overflow-hidden d-nav-card hover:shadow-lg`}
      style={{
        cursor: 'pointer',
        height: '350px',
        display: 'flex',
        flexDirection: 'column',
        borderStyle: 'solid',
        borderWidth: '2px'
      }}
      onClick={() =>
        navigate(`/lotteries/${data.id}`, {
          state: {
            page_number: page_number,
            status: status_filter,
            price: price_filter
          },
          replace: false
        })
      }
    >
      {/* Section haute - Badge et Image */}
      <div className='relative'>
        <span
          className={`buttonStatus ${
            status === 'soon'
              ? '!bg-gray-400'
              : status === 'ongoing'
              ? '!bg-yellow-400'
              : '!bg-orange-500'
          }`}
          style={{
            fontFamily: 'Bit Cell',
            fontSize: '16px',
            letterSpacing: '-0.02em',
            lineHeight: '120%',
            backgroundColor: status === 'soon' ? '#9CA3AF' : undefined
          }}
        >
          {t('lotteries:status_' + status.toLowerCase())}
        </span>
        <img
          src={
            data.image_url
              ? data.image_url
              : 'https://app.dinovox.com/assets/lotteries-CgkojzQT.png'
          }
          alt={data.lottery_name || 'Lottery image'}
          className='w-full h-[168px] object-cover'
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src =
              'https://app.dinovox.com/assets/lotteries-CgkojzQT.png';
          }}
        />
      </div>

      {/* Section basse - Informations */}
      <div className='flex-1 flex flex-col p-3 w-full'>
        {/* Lottery ID */}
        <h2 className='text-base font-bold mb-2'>
          {t('lotteries:lottery_number', { number: data.id })}
        </h2>

        {/* Ticket Progress */}
        <div className='mb-2 w-full'>
          <TicketProgressBar
            ticketsSold={data.tickets_sold}
            maxTickets={data.max_tickets}
            height='h-1'
          />
        </div>

        {/* Price Information */}
        <div className='flex items-center justify-between text-xs mb-2 w-full'>
          <span className='text-gray-600'>{t('lotteries:price')}:</span>
          <span
            className={`font-medium ${
              data.price_type.toLowerCase().includes('locked')
                ? 'line-through'
                : ''
            }`}
          >
            {Number(
              data.price_amount
                .dividedBy(
                  data.price_data.decimals ? 10 ** data.price_data.decimals : 1
                )
                .toFixed()
            ).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 8
            })}{' '}
            {formatPriceIdentifier(data.price_identifier)}
          </span>
        </div>

        {/* Timer with icon */}
        <div className={`flex items-center justify-center mb-3 ${timerColor}`}>
          <div
            className={`group relative inline-flex items-center px-3 py-1 rounded ${
              timerColor === 'text-orange-500'
                ? 'bg-orange-100'
                : timerColor === 'text-orange-500'
                ? 'bg-orange-100'
                : timerColor === 'text-gray-500'
                ? 'bg-gray-100'
                : 'bg-green-100'
            }`}
          >
            <div className='relative'>
              <svg
                className='w-3 h-3 mr-1 transition-opacity duration-200 group-hover:opacity-0'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <svg
                className='w-3 h-3 mr-1 absolute top-0 left-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <span className='font-mono text-xs whitespace-nowrap'>
              {timeRemaining}
            </span>
            {/* Tooltip */}
            <div className='absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white rounded bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none'>
              {hoverTime}
              <div className='absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800'></div>
            </div>
          </div>
        </div>

        {/* Remove the Participate Button since the whole card is now clickable */}
        <div className='lotteryParticipateButton pointer-events-none'>
          {t('lotteries:open_details')}
        </div>
      </div>
    </div>
  );
};

export default LotteryCard2;
