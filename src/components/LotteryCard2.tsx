import { useEffect, useState } from 'react';

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
  price_amount: number;
  price_identifier: string;
  image_url: string;
}

interface LotteryCard2Props {
  data: LotteryData;
}

const LotteryCard2: React.FC<LotteryCard2Props> = ({ data }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [timerColor, setTimerColor] = useState<string>('text-gray-500');
  const [borderColor, setBorderColor] = useState<string>('border-green-500');
  const [hoverTime, setHoverTime] = useState<string>('');

  // Calculate ticket progress percentage
  const ticketProgress = (data.tickets_sold / data.max_tickets) * 100;

  // Get progress bar color based on percentage
  const getProgressColor = () => {
    if (ticketProgress < 50) return 'bg-green-500';
    if (ticketProgress < 90) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get border color based on urgency and status
  const getBorderColor = () => {
    const now = Math.floor(Date.now() / 1000);
    const start = parseInt(data.start_time);
    
    if (now < start) {
      return 'border-gray-300';
    }
    
    if (timerColor === 'text-red-500' || ticketProgress >= 90) {
      return 'border-red-500';
    } else if (timerColor === 'text-orange-500' || ticketProgress >= 50) {
      return 'border-orange-500';
    }
    return 'border-green-500';
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
        setTimeRemaining(`${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`);
        setHoverTime(`Starts in ${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`);
        setTimerColor('text-gray-500');
      } else if (end === 0) {
        // Infinite duration
        setTimeRemaining('∞');
        setHoverTime('No end date');
        setTimerColor('text-green-500');
      } else {
        // Running lottery
        const diff = end - now;
        if (diff <= 0) {
          setTimeRemaining('Ended');
          setHoverTime('Lottery ended');
          setTimerColor('text-red-500');
        } else if (diff <= 300) { // Less than 5 minutes
          setTimeRemaining(`${Math.floor(diff / 60)}m ${diff % 60}s`);
          setHoverTime(`Ends in ${Math.floor(diff / 60)}m ${diff % 60}s`);
          setTimerColor('text-red-500');
        } else if (diff <= 3600) { // Less than 1 hour
          setTimeRemaining(`${Math.floor(diff / 60)}m`);
          setHoverTime(`Ends in ${Math.floor(diff / 60)}m`);
          setTimerColor('text-orange-500');
        } else {
          setTimeRemaining(`${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`);
          setHoverTime(`Ends in ${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`);
          setTimerColor('text-green-500');
        }
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [data.start_time, data.end_time]);

  // Update border color based on urgency
  useEffect(() => {
    setBorderColor(getBorderColor());
  }, [timerColor, ticketProgress]);

  return (
    <div 
      className={`relative cardMesNFT bg-white border-2 transition-colors duration-300`}
      style={{ 
        borderColor: borderColor.replace('border-', '').replace('-500', ''),
        minHeight: '340px'
      }}
    >
      {/* Status Badge */}
      <span className={`buttonStatus ${timerColor === 'text-red-500' ? 'bg-orange-500' : 'bg-yellow-400'}`}>
        Active
      </span>

      {/* Image */}
      <div className="flex justify-center items-center" style={{ width: '168px', height: '168px', margin: '0 auto' }}>
        <img 
          src={data.image_url} 
          alt={data.lottery_name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="subCard flex flex-col flex-grow p-2">
        {/* Lottery ID */}
        <h2 className="text-base font-bold mb-1">
          Lottery #{data.id}
        </h2>

        {/* Ticket Progress */}
        <div className="mb-1.5">
          <div className="flex justify-between text-xs mb-1">
            <span>Tickets: {data.tickets_sold}/{data.max_tickets}</span>
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressColor()} transition-all duration-300`}
              style={{ width: `${ticketProgress}%` }}
            />
          </div>
        </div>

        {/* Price Information */}
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-gray-600">Price:</span>
          <span className="font-medium">
            {data.price_amount} {data.price_identifier}
          </span>
        </div>

        {/* Timer with icon */}
        <div className={`flex items-center justify-center mb-2 ${timerColor}`}>
          <div className={`group relative flex items-center px-3 py-1 rounded ${
            timerColor === 'text-red-500' ? 'bg-red-100' :
            timerColor === 'text-orange-500' ? 'bg-orange-100' :
            timerColor === 'text-gray-500' ? 'bg-gray-100' :
            'bg-green-100'
          }`}>
            <div className="relative">
              <svg 
                className="w-3 h-3 mr-1 transition-opacity duration-200 group-hover:opacity-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <svg 
                className="w-3 h-3 mr-1 absolute top-0 left-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <span className="font-mono text-xs">{timeRemaining}</span>
            
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white rounded bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              {hoverTime}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
            </div>
          </div>
        </div>

        {/* Participate Button */}
        <div className="mt-auto flex justify-center w-full">
          <button 
            className="smallDinoButton text-sm"
            style={{ width: "calc(100% - 16px)" }}
            onClick={() => console.log('Participate in lottery:', data.id)}
          >
            Participate
          </button>
        </div>
      </div>
    </div>
  );
};

export default LotteryCard2; 