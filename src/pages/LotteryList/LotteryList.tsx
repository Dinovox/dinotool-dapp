import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import './MintSFT.css';
import { useGetAccount } from 'hooks';
import { useState } from 'react';
import BigNumber from 'bignumber.js';
import CreateLotteryModal from './Create';
import LotteryCard2 from './LotteryCard2';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import {
  useGetLotteriesDB,
  useGetLotteriesVM
} from 'pages/Dashboard/widgets/LotteryAbi/hooks/useGetLotteries';
import { graou_identifier, lottery_cost } from 'config';
import { useGetUserParticipations } from 'pages/Dashboard/widgets/LotteryAbi/hooks/useGetUserParticipations';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';

// Interface pour les loteries de la DB
interface DBLottery {
  id: number;
  description: string;
  end_time: string;
  max_tickets: number;
  price_type: string;
  prize_identifier: string;
  prize_nonce: number;
  start_time: string;
  tickets_sold: number;
  image_url: string;
  price_amount: number;
  price_identifier: string;
  winner_id?: number;
}

// Interface pour la réponse de l'API
interface LotteriesResponse {
  lotteries: DBLottery[];
  total: number;
  page: number;
  limit: number;
}

export const LotteryList = () => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();
  const [page, setPage] = useState<number>(1);
  const [filter, setFilter] = useState<string>('ongoing');

  const lotteries = useGetLotteriesVM();
  const { lotteries: lotteriesDB, isLoading } = useGetLotteriesDB({ page, limit: 4 }) as { lotteries: DBLottery[], isLoading: boolean };
  //console.log('LotteriesDB:', lotteriesDB);
  const runningLottery = lotteries.running;
  const endedLottery = lotteries.ended;
  const userLotteries = useGetUserParticipations(filter);

  const { balance } = useGetAccount();
  const user_esdt = useGetUserESDT();

  const userGraouBalance = new BigNumber(
    user_esdt.find((esdt: any) => esdt.identifier === graou_identifier)
      ?.balance || 0
  );

  const graou_cost = new BigNumber(lottery_cost.graou);
  const egld_cost = new BigNumber(lottery_cost.egld);

  // Sélectionner les loteries à afficher selon le filtre
  const getLotteriesToDisplay = () => {
    if (!Array.isArray(lotteriesDB)) {
      return [];
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    switch (filter) {
      case 'ended':
        return lotteriesDB.filter((lottery: DBLottery) => 
          lottery.winner_id || 
          (lottery.end_time !== "0" && parseInt(lottery.end_time) < now)
        );
      case 'ongoing':
      default:
        return lotteriesDB.filter((lottery: DBLottery) => 
          !lottery.winner_id && 
          (lottery.end_time === "0" || parseInt(lottery.end_time) > now) &&
          parseInt(lottery.start_time) <= now
        );
    }
  };

  const lotteriesDisplay = getLotteriesToDisplay();

  //calcul pagination
  const itemsPerPage = 4;
  const totalPages = Math.ceil((lotteriesDisplay?.length || 0) / itemsPerPage);
  const maxPagesToShow = 5;

  let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  return (
    <AuthRedirectWrapper requireAuth={false}>
      <PageWrapper>
        <div className='dinocard-wrapper rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          <>
            <div className='mintGazTitle dinoTitle' style={{ width: '340px' }}>
              {t('lotteries:lotteries')}
            </div>
            <div className='filter-options' style={{ margin: '3px', width: '100%' }}>
              <button
                className={`dinoButton ${filter !== 'ongoing' ? 'reverse' : ''}`}
                name='filter'
                value='ongoing'
                onClick={() => (setFilter('ongoing'), setPage(1))}
              >
                {t('lotteries:status_ongoing')}
              </button>

              <button
                className={`dinoButton ${filter !== 'ended' ? 'reverse' : ''}`}
                name='filter'
                value='ended'
                onClick={() => (setFilter('ended'), setPage(1))}
              >
                {t('lotteries:status_ended')}
              </button>

              {lotteries.user_owned.length > 0 && (
                <button
                  className={`dinoButton ${filter !== 'owned' ? 'reverse' : ''}`}
                  name='filter'
                  value='owned'
                  onClick={() => (setFilter('owned'), setPage(1))}
                >
                  {t('lotteries:status_owned')}
                </button>
              )}
              {lotteries.user_tickets.length > 0 && (
                <button
                  className={`dinoButton ${filter !== 'user' ? 'reverse' : ''}`}
                  name='filter'
                  value='user'
                  onClick={() => (setFilter('user'), setPage(1))}
                >
                  {t('lotteries:status_participated')}
                </button>
              )}
            </div>
            
            {/* Affichage des cartes de loterie */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {loading || isLoading ? (
                <div>Chargement...</div>
              ) : lotteriesDisplay && lotteriesDisplay.length > 0 ? (
                lotteriesDisplay.map((lottery: DBLottery) => (
                  <LotteryCard2 
                    key={lottery.id} 
                    data={{
                      id: lottery.id,
                      lottery_name: 'N/A',
                      prize_identifier: lottery.prize_identifier || 'N/A',
                      prize_nonce: lottery.prize_nonce || 0,
                      tickets_sold: lottery.tickets_sold || 0,
                      max_tickets: lottery.max_tickets || 0,
                      start_time: lottery.start_time || '0',
                      end_time: lottery.end_time || '0',
                      price_type: lottery.price_type || 'N/A',
                      price_amount: lottery.price_amount || 0,
                      price_identifier: lottery.price_identifier || 'N/A',
                      image_url: lottery.image_url || '/default-lottery-image.png',
                      winner_id: lottery.winner_id
                    }} 
                  />
                ))
              ) : (
                <div>Aucune loterie disponible</div>
              )}
            </div>

            {/* Pagination */}
            <div className='pagination'>
              {/* Bouton "Précédent" */}
              {page > 1 && (
                <span
                  className='pageButton'
                  onClick={() => setPage(page - 1)}
                  style={{
                    height: '30px',
                    width: '30px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ccc',
                    lineHeight: '30px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    margin: '0 5px'
                  }}
                >
                  ‹
                </span>
              )}

              {/* Affichage dynamique des numéros de pages */}
              {startPage > 1 && (
                <>
                  <span
                    className='pageButton'
                    onClick={() => setPage(1)}
                    style={{
                      height: '30px',
                      width: '30px',
                      backgroundColor: page === 1 ? '#ddd' : '#f0f0f0',
                      border: '1px solid #ccc',
                      lineHeight: '30px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      margin: '0 5px',
                      fontWeight: page === 1 ? 'bold' : 'normal'
                    }}
                  >
                    1
                  </span>
                  {startPage > 2 && (
                    <span style={{ margin: '0 5px' }}>...</span>
                  )}
                </>
              )}

              {[...Array(endPage - startPage + 1)].map((_, index) => {
                const pageNum = startPage + index;
                return (
                  <span
                    key={pageNum}
                    className='pageButton'
                    onClick={() => setPage(pageNum)}
                    style={{
                      height: '30px',
                      width: '30px',
                      backgroundColor: pageNum === page ? '#ddd' : '#f0f0f0',
                      border: '1px solid #ccc',
                      lineHeight: '30px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      margin: '0 5px',
                      fontWeight: pageNum === page ? 'bold' : 'normal'
                    }}
                  >
                    {pageNum}
                  </span>
                );
              })}

              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && (
                    <span style={{ margin: '0 5px' }}>...</span>
                  )}
                  <span
                    className='pageButton'
                    onClick={() => setPage(totalPages)}
                    style={{
                      height: '30px',
                      width: '30px',
                      backgroundColor: page === totalPages ? '#ddd' : '#f0f0f0',
                      border: '1px solid #ccc',
                      lineHeight: '30px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      margin: '0 5px',
                      fontWeight: page === totalPages ? 'bold' : 'normal'
                    }}
                  >
                    {totalPages}
                  </span>
                </>
              )}

              {/* Bouton "Suivant" */}
              {page < totalPages && (
                <span
                  className='pageButton'
                  onClick={() => setPage(page + 1)}
                  style={{
                    height: '30px',
                    width: '30px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ccc',
                    lineHeight: '30px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    margin: '0 5px'
                  }}
                >
                  ›
                </span>
              )}
            </div>

            <CreateLotteryModal
              count={lotteries?.user_owned?.length}
              cost_graou={userGraouBalance.isGreaterThanOrEqualTo(graou_cost)}
              cost_egld={new BigNumber(balance).isGreaterThanOrEqualTo(egld_cost)}
            />
          </>
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
