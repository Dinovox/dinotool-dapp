import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { ActionBuy } from './Transaction/ActionBuy';
import { useGetNftInformations } from './Transaction/helpers/useGetNftInformation';
import { useGetAccount } from 'hooks';
import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import { useGetUserTickets } from 'pages/Dashboard/widgets/LotteryAbi/hooks/useGetUserTickets';
import { useGetEsdtInformations } from './Transaction/helpers/useGetEsdtInformation';
import EsdtDisplay from './EsdtDisplay';
import NftDisplay from './NftDisplay';
import { ActionDraw } from './Transaction/ActionDraw';
import { useParams, useNavigate } from 'react-router-dom';
import { ActionCancel } from './Transaction/ActionCancel';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import { graou_identifier } from 'config';
import { ActionDelete } from './Transaction/ActionDelete';
import LotteryWinner from './LotteryWinner';
import { useTranslation } from 'react-i18next';
import TwitterShareButton from './Transaction/helpers/shareOnX';
import { EditDescription } from './EditDescription';
import SafeMarkdown from '../../components/SafeMarkdown';
import ShortenedAddress from 'helpers/shortenedAddress';
import TicketProgressBar from '../../components/TicketProgressBar';

interface LotteryData {
  field0: {
    id: string;
    owner_id: string;
    winner_id: string;
    start_time: string;
    end_time: string;
    prize_type: {
      name: string;
      fields: any[];
    };
    prize_identifier: string;
    prize_nonce: string;
    prize_amount: string;
    price_type: {
      name: string;
      fields: any[];
    };
    price_identifier: string;
    price_nonce: string;
    price_amount: string;
    max_tickets: string;
    max_per_wallet: string;
    tickets_sold: string;
    auto_draw: boolean;
  };
  field1: {
    bech32: string;
    pubkey: string;
  };
  field2: {
    bech32: string;
    pubkey: string;
  };
  description: string;
  prize_image: string;
  price_image: string;
  owner: {
    id: number;
    address: string;
    herotag: string;
  };
  winner: {
    id: number;
    address: string;
    herotag: string | null;
  };
}

const LotteryDetailV2 = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [lottery, setLottery] = useState<LotteryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [timerColor, setTimerColor] = useState<string>('text-gray-500');
  const [borderColor, setBorderColor] = useState<string>('border-green-500');
  const [hoverTime, setHoverTime] = useState<string>('');
  const [editingDescription, setEditingDescription] = useState(false);

  const { address } = useGetAccount();
  const { buyed } = useGetUserTickets(Number(id));
  const { balance } = useGetAccount();
  const user_esdt = useGetUserESDT();
  const user_sft = useGetUserNFT(address);

  const prize_nft_information = useGetNftInformations(
    Number(lottery?.field0.prize_nonce) > 0 ? lottery?.field0.prize_identifier ?? '' : '',
    Number(lottery?.field0.prize_nonce) > 0 ? lottery?.field0.prize_nonce ?? '' : ''
  );
  const prize_esdt_information = useGetEsdtInformations(
    Number(lottery?.field0.prize_nonce) === 0 ? lottery?.field0.prize_identifier ?? '' : ''
  );

  const price_nft_information = useGetNftInformations(
    Number(lottery?.field0.price_nonce) > 0 ? lottery?.field0.price_identifier ?? '' : '',
    Number(lottery?.field0.price_nonce) > 0 ? lottery?.field0.price_nonce ?? '' : ''
  );
  const price_esdt_information = useGetEsdtInformations(
    Number(lottery?.field0.price_nonce) === 0 ? lottery?.field0.price_identifier ?? '' : ''
  );

  const userEsdtBalance = new BigNumber(
    user_esdt.find((esdt: any) => esdt.identifier === lottery?.field0.price_identifier)
      ?.balance || 0
  );

  const userSftBalance = new BigNumber(
    user_sft.find(
      (sft: any) =>
        sft.collection === lottery?.field0.price_identifier &&
        sft.nonce === lottery?.field0.price_nonce
    )?.balance || 0
  );

  const userGraouBalance = new BigNumber(
    user_esdt.find((esdt: any) => esdt.identifier === graou_identifier)
      ?.balance || 0
  );

  useEffect(() => {
    const fetchLotteryData = async () => {
      try {
        const response = await fetch(`https://internal.mvx.fr/dinovox/lotteries/${id}`);
        const data = await response.json();
        setLottery(data);
      } catch (error) {
        console.error('Error fetching lottery data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLotteryData();
    }
  }, [id]);

  const ticketProgress = lottery ? (Number(lottery.field0.tickets_sold) / Number(lottery.field0.max_tickets)) * 100 : 0;

  // Get status
  const now = Math.floor(Date.now() / 1000);
  const start = lottery ? Number(lottery.field0.start_time) : 0;
  
  const status = 
    (lottery?.field0.winner_id && Number(lottery.field0.winner_id) > 0)
      ? 'ended'
      : start > now
        ? 'soon'
        : Number(lottery?.field0.tickets_sold) >= Number(lottery?.field0.max_tickets) ||
          (Number(lottery?.field0.end_time) > 0 && Number(lottery?.field0.end_time) < now)
          ? 'draw'
          : 'ongoing';

  // Get progress bar color based on percentage
  const getProgressColor = () => {
    if (ticketProgress < 50) return 'bg-green-500';
    if (ticketProgress < 90) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get border color based on urgency and status
  const getBorderColor = () => {
    if (now < start) {
      return 'border-gray-400';
    }
    
    if (timerColor === 'text-red-500' || ticketProgress >= 90) {
      return 'border-red-600';
    } else if (timerColor === 'text-orange-500' || ticketProgress >= 50) {
      return 'border-orange-600';
    }
    return 'border-green-600';
  };

  // Update timer and colors
  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const start = Number(lottery?.field0.start_time);
      const end = lottery?.field0.end_time === '0' ? 0 : Number(lottery?.field0.end_time);

      if (now < start) {
        // Not started yet
        const diff = start - now;
        setTimeRemaining(`${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`);
        setHoverTime(t('lotteries:open_in', { time: `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m` }));
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
          setTimeRemaining(t('lotteries:expired'));
          setHoverTime(t('lotteries:expired'));
          setTimerColor('text-red-500');
        } else if (diff <= 300) { // Less than 5 minutes
          setTimeRemaining(`${Math.floor(diff / 60)}m ${diff % 60}s`);
          setHoverTime(t('lotteries:end_in', { time: `${Math.floor(diff / 60)}m ${diff % 60}s` }));
          setTimerColor('text-red-500');
        } else if (diff <= 3600) { // Less than 1 hour
          setTimeRemaining(`${Math.floor(diff / 60)}m`);
          setHoverTime(t('lotteries:end_in', { time: `${Math.floor(diff / 60)}m` }));
          setTimerColor('text-orange-500');
        } else {
          setTimeRemaining(`${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`);
          setHoverTime(t('lotteries:end_in', { time: `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m` }));
          setTimerColor('text-green-500');
        }
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [lottery?.field0.start_time, lottery?.field0.end_time, t]);

  // Update border color based on urgency
  useEffect(() => {
    const updateBorderColor = () => {
      const newBorderColor = getBorderColor();
      setBorderColor(newBorderColor);
    };

    updateBorderColor();
    const interval = setInterval(updateBorderColor, 1000);
    return () => clearInterval(interval);
  }, [timerColor, lottery?.field0.tickets_sold, lottery?.field0.max_tickets, lottery?.field0.start_time, lottery?.field0.end_time]);

  if (loading) {
    return (
      <AuthRedirectWrapper requireAuth={false}>
        <PageWrapper>
          <div className="flex justify-center items-center h-64">
            <span className="text-lg">Loading...</span>
          </div>
        </PageWrapper>
      </AuthRedirectWrapper>
    );
  }

  if (!lottery) {
    return (
      <AuthRedirectWrapper requireAuth={false}>
        <PageWrapper>
          <div className="flex justify-center items-center h-64">
            <span className="text-lg">Lottery not found</span>
          </div>
        </PageWrapper>
      </AuthRedirectWrapper>
    );
  }

  return (
    <AuthRedirectWrapper requireAuth={false}>
      <PageWrapper>
        <div className={`dinocard-wrapper rounded-xl bg-white flex-col items-center h-full w-full ${borderColor} border-2`}>
          {/* Header avec bouton retour et titre */}
          <div className="w-full flex justify-between items-center p-4">
            <div className="mintGazTitle dinoTitle" style={{ width: '340px' }}>
              {t('lotteries:lottery_number', { number: lottery.field0.id })}
            </div>
            <button 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              onClick={() => navigate('/lotteries')}
            >
              {t('lotteries:return')}
            </button>
          </div>

          {/* Contenu principal */}
          <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
            {/* Zone grise avec owner et description */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              {/* Owner */}
              <div className="flex items-center justify-center space-x-2">
                <span className="text-gray-600 text-lg">{t('lotteries:owner')}</span>
                <ShortenedAddress
                  address={lottery.owner.address}
                  herotag={lottery.owner.herotag}
                />
              </div>

              {/* Description */}
              {lottery.description && (
                <div className="text-center">
                  <SafeMarkdown content={lottery.description} />
                  {lottery.owner.address === address && (
                    <button
                      onClick={() => setEditingDescription(!editingDescription)}
                      className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      ✏️ {editingDescription ? 'Annuler' : 'Modifier'}
                    </button>
                  )}
                </div>
              )}

              {editingDescription && (
                <div className="mt-4">
                  <EditDescription
                    lottery_id={Number(id)}
                    lottery_description={lottery.description}
                  />
                </div>
              )}

              {/* Max per wallet après la description */}
              {Number(lottery.field0.max_per_wallet) > 0 && (
                <div className="flex justify-center space-x-2 pt-2 text-sm">
                  <span className="text-gray-600">MAX / wallet:</span>
                  <span>{lottery.field0.max_per_wallet}</span>
                </div>
              )}
            </div>

            {/* Progression et Timer sur la même ligne */}
            <div className="flex items-center gap-8">
              {/* Barre de progression - prend l'espace restant */}
              <div className="flex-1">
                <TicketProgressBar
                  ticketsSold={Number(lottery.field0.tickets_sold)}
                  maxTickets={Number(lottery.field0.max_tickets)}
                  height="h-2"
                />
              </div>

              {/* Timer - taille fixe */}
              <div className={`flex-shrink-0 ${timerColor}`}>
                <div className={`group relative inline-flex items-center px-6 py-3 rounded-lg ${
                  timerColor === 'text-red-500' ? 'bg-red-100' :
                  timerColor === 'text-orange-500' ? 'bg-orange-100' :
                  timerColor === 'text-gray-500' ? 'bg-gray-100' :
                  'bg-green-100'
                }`}>
                  <svg 
                    className="w-5 h-5 mr-3" 
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
                  <span className={`font-mono text-sm whitespace-nowrap ${timeRemaining === '∞' ? 'text-xl' : ''}`}>{timeRemaining}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1 text-sm text-white rounded bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {hoverTime}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prix et récompense */}
            <div className="bg-[#fefaf5] p-8 rounded-lg space-y-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-medium mb-4 text-center text-lg">{t('lotteries:entry_cost')}</h3>
                  {Number(lottery.field0.price_nonce) > 0 ? (
                    <NftDisplay
                      nftInfo={price_nft_information}
                      amount={Number(lottery.field0.price_amount)}
                      is_free={['FreeEgld', 'FreeSft', 'FreeEsdt'].includes(lottery.field0.price_type.name)}
                      is_locked={['LockedEgld', 'LockedSft', 'LockedEsdt'].includes(lottery.field0.price_type.name)}
                    />
                  ) : (
                    <EsdtDisplay
                      esdtInfo={price_esdt_information}
                      amount={Number(lottery.field0.price_amount)}
                      is_free={['FreeEgld', 'FreeSft', 'FreeEsdt'].includes(lottery.field0.price_type.name)}
                      is_locked={['LockedEgld', 'LockedSft', 'LockedEsdt'].includes(lottery.field0.price_type.name)}
                    />
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-4 text-center text-lg">{t('lotteries:prize')}</h3>
                  {Number(lottery.field0.prize_nonce) > 0 ? (
                    <NftDisplay
                      nftInfo={prize_nft_information}
                      amount={Number(lottery.field0.prize_amount)}
                    />
                  ) : (
                    <EsdtDisplay
                      esdtInfo={prize_esdt_information}
                      amount={Number(lottery.field0.prize_amount)}
                    />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-6 pt-6">
                {/* Boutons pour l'owner */}
                {lottery.owner.address === address && (
                  <div className="flex flex-wrap gap-2">
                    {Number(lottery.field0.winner_id) === 0 ? (
                      <>
                        <ActionDraw
                          lottery_id={Number(id)}
                          disabled={
                            Number(lottery.field0.tickets_sold) < 1 ||
                            (Number(lottery.field0.end_time) > 0 &&
                              timeRemaining !== t('lotteries:expired') &&
                              Number(lottery.field0.tickets_sold) < Number(lottery.field0.max_tickets))
                          }
                          tickets={Number(lottery.field0.tickets_sold)}
                        />
                        <ActionCancel
                          lottery_id={Number(id)}
                          disabled={Number(lottery.field0.tickets_sold) > 50}
                        />
                      </>
                    ) : (
                      <ActionDelete lottery_id={Number(id)} />
                    )}
                    <TwitterShareButton lottery_id={Number(id)} />
                  </div>
                )}

                {/* Bouton d'achat pour les participants */}
                {lottery.owner.address !== address &&
                 Number(lottery.field0.max_tickets) > Number(lottery.field0.tickets_sold) && (
                  <div className="space-y-2">
                    <ActionBuy
                      lottery_id={Number(id)}
                      price_identifier={lottery.field0.price_identifier}
                      price_nonce={lottery.field0.price_nonce}
                      price_amount={new BigNumber(lottery.field0.price_amount)}
                      balance={new BigNumber(balance)}
                      esdt_balance={userEsdtBalance}
                      graou_balance={userGraouBalance}
                      sft_balance={userSftBalance}
                      buyed={
                        Number(lottery.field0.max_per_wallet) > 0 &&
                        Number(buyed) >= Number(lottery.field0.max_per_wallet)
                      }
                      time_start={now < start ? start - now : 0}
                      ended={
                        Number(lottery.field0.end_time) > 0 && 
                        timeRemaining === t('lotteries:expired')
                      }
                    />
                    {Number(buyed) > 0 && (
                      <p className="text-center text-sm text-gray-600">
                        {t('lotteries:you_have_tickets', {
                          number: buyed,
                          s: Number(buyed) > 1 ? 's' : ''
                        })}
                      </p>
                    )}
                    {Number(buyed) === 0 && (
                      <p className="text-center text-sm text-gray-600">
                        {t('lotteries:check_collection')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Affichage du gagnant */}
            {lottery.winner.id > 0 && (
              <div className="mt-4">
                <LotteryWinner lottery={lottery} />
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};

export default LotteryDetailV2; 