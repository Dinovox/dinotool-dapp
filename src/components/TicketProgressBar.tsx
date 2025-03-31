import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TicketProgressBarProps {
  ticketsSold: number;
  maxTickets: number;
  showText?: boolean;
  height?: string;
}

const TicketProgressBar: React.FC<TicketProgressBarProps> = ({ 
  ticketsSold, 
  maxTickets, 
  showText = true,
  height = "h-2"
}) => {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [currentColor, setCurrentColor] = useState('rgb(34, 197, 94)');

  // Fonction pour interpoler les couleurs
  const interpolateColor = (percent: number) => {
    let r, g;
    if (percent < 50) {
      r = Math.round(34 + (249 - 34) * (percent / 50));
      g = Math.round(197 + (115 - 197) * (percent / 50));
    } else {
      const adjustedPercent = (percent - 50) / 50;
      r = Math.round(249 + (239 - 249) * adjustedPercent);
      g = Math.round(115 + (68 - 115) * adjustedPercent);
    }
    return `rgb(${r}, ${g}, ${percent < 50 ? 94 : Math.round(22 + (68 - 22) * ((percent - 50) / 50))})`;
  };

  useEffect(() => {
    const targetProgress = (ticketsSold / maxTickets) * 100;
    const duration = 1000;
    const steps = 60;
    const increment = targetProgress / steps;
    let currentProgress = 0;

    const timer = setInterval(() => {
      if (currentProgress >= targetProgress) {
        clearInterval(timer);
        setProgress(targetProgress);
        setCurrentColor(interpolateColor(targetProgress));
      } else {
        currentProgress += increment;
        setProgress(currentProgress);
        setCurrentColor(interpolateColor(currentProgress));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [ticketsSold, maxTickets]);

  return (
    <div className="w-full space-y-2">
      {showText && (
        <div className="flex justify-between text-xs mb-1">
          <span>{t('lotteries:tickets')}: {ticketsSold}/{maxTickets}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div 
        className={`${height} bg-gray-200 rounded-full overflow-hidden relative`}
      >
        <div 
          className="h-full transition-all duration-300 ease-out absolute top-0 left-0"
          style={{ 
            width: `${progress}%`,
            backgroundColor: currentColor,
            transition: 'width 0.3s ease-out, background-color 0.3s ease-out',
          }}
        />
      </div>
    </div>
  );
};

export default TicketProgressBar; 