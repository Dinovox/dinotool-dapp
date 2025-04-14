import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import './MintSFT.css';
import { useGetAccount } from 'hooks';
import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import CreateLotteryModal from './Create';
import LotteryCard2 from './LotteryCard2';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import {
  useGetLotteriesDB,
  useGetLotteriesVM
} from 'pages/Dashboard/widgets/LotteryAbi/hooks/useGetLotteries';
import { graou_identifier, lottery_cost } from 'config';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

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
  price_amount: BigNumber;
  price_identifier: string;
  winner_id?: number;
  cancelled: boolean;
  price_data: {
    decimals: number;
    media: [
      {
        url: string;
        thumbnailUrl: string;
      }
    ];
  };
  prize_data: {
    decimals: number;
    media: [
      {
        url: string;
        thumbnailUrl: string;
      }
    ];
  };
}

// Interface pour la réponse de l'API
interface LotteriesResponse {
  lotteries: DBLottery[];
  total_count: number;
  page: number;
  limit: number;
}

interface FilteredLotteries {
  lotteries: DBLottery[];
  total_count: number;
}

export const LotteryList = () => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();

  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit, setLimit] = useState<number>(12);
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get('page');
  const priceParam = searchParams.get('price');
  const statusParam = searchParams.get('status');

  const [page, setPage] = useState<number>(pageParam ? parseInt(pageParam) : 1);
  const [status, setStatus] = useState<string>(
    statusParam ? statusParam : 'ongoing'
  );
  const [price, setPrice] = useState<string>(priceParam || '');

  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      setPage(parseInt(pageParam));
    }
  }, [searchParams]);

  useEffect(() => {
    searchParams.set('page', page.toString());
    searchParams.set('status', status);
    if (price) {
      searchParams.set('price', price.toString());
    } else {
      searchParams.delete('price');
    }
    setSearchParams(searchParams);
  }, [page, price, status]);

  const lotteriesVM = useGetLotteriesVM();
  const {
    lotteries: lotteriesDB,
    total_count,
    isLoading
  } = useGetLotteriesDB({
    page,
    limit,
    status,
    ids:
      status === 'owned'
        ? lotteriesVM.user_owned
        : status === 'user'
        ? lotteriesVM.user_tickets
        : [],
    price
  }) as { lotteries: DBLottery[]; total_count: number; isLoading: boolean };
  //console.log('LotteriesDB:', lotteriesDB);
  // const runningLottery = lotteriesVM.running;
  // const endedLottery = lotteriesVM.ended;
  //only vm can return user lotteries list
  // const userLotteries = useGetUserParticipations(status);

  const { balance } = useGetAccount();
  const user_esdt = useGetUserESDT();

  //todo move into create modal
  const userGraouBalance = new BigNumber(
    user_esdt.find((esdt: any) => esdt.identifier === graou_identifier)
      ?.balance || 0
  );
  const graou_cost = new BigNumber(lottery_cost.graou);
  const egld_cost = new BigNumber(lottery_cost.egld);

  // Sélectionner les loteries à afficher selon le filtre
  // const getLotteriesToDisplay = (): FilteredLotteries => {
  //   if (!Array.isArray(lotteriesDB)) {
  //     return { lotteries: [], total: 0 };
  //   }

  //   const now = Math.floor(Date.now() / 1000);

  //   // Filtrer d'abord selon le statut
  //   const filteredLotteries =
  //     filter === 'ended'
  //       ? lotteriesDB.filter(
  //           (lottery: DBLottery) =>
  //             lottery.winner_id ||
  //             (lottery.end_time !== '0' && parseInt(lottery.end_time) < now)
  //         )
  //       : lotteriesDB.filter(
  //           (lottery: DBLottery) =>
  //             !lottery.winner_id &&
  //             (lottery.end_time === '0' || parseInt(lottery.end_time) > now) &&
  //             parseInt(lottery.start_time) <= now
  //         );

  //   // Calculer le nombre total de pages basé sur les loteries filtrées
  //   const filteredTotal = filteredLotteries.length;

  //   // Appliquer la pagination
  //   const startIndex = (page - 1) * 4;
  //   const endIndex = startIndex + 4;
  //   return {
  //     lotteries: filteredLotteries.slice(startIndex, endIndex),
  //     total: filteredTotal
  //   };
  // };

  // const { lotteries: lotteriesDisplay, total: filteredTotal } =
  //   getLotteriesToDisplay();
  // const itemsPerPage = 12;
  // const totalPages = Math.ceil(filteredTotal / itemsPerPage);
  // const maxPagesToShow = filteredTotal;

  // let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
  // let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  // if (endPage - startPage + 1 < maxPagesToShow) {
  //   startPage = Math.max(1, endPage - maxPagesToShow + 1);
  // }

  useEffect(() => {
    if (total_count > 0) {
      setTotalPages(Math.ceil(total_count / limit));
    }
  }, [total_count, limit]);

  const maxButtons = totalPages - page > 3 ? 3 : totalPages - page;
  return (
    <AuthRedirectWrapper requireAuth={false}>
      <PageWrapper>
        <div className='dinocard-wrapper rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          <>
            <div className='mintGazTitle dinoTitle' style={{ width: '340px' }}>
              {t('lotteries:lotteries')}
            </div>
            <div
              className='filter-options'
              style={{ margin: '3px', width: '100%' }}
            >
              {/* <button
                className={`dinoButton ${status !== 'all' ? 'reverse' : ''}`}
                name='filter'
                value='all'
                onClick={() => (setStatus('all'), setPage(1))}
              >
                {t('lotteries:status_all')}
              </button> */}
              {/* <button
                className={`dinoButton ${
                  status !== 'ongoing' ? 'reverse' : ''
                }`}
                name='filter'
                value='ongoing'
                onClick={() => (setStatus('ongoing'), setPage(1))}
              >
                {t('lotteries:status_ongoing')}
              </button> */}

              {/* <button
                className={`dinoButton ${status !== 'ended' ? 'reverse' : ''}`}
                name='filter'
                value='ended'
                onClick={() => (setStatus('ended'), setPage(1))}
              >
                {t('lotteries:status_ended')}
              </button> */}

              {/* {lotteriesVM.user_owned.length > 0 && (
                <button
                  className={`dinoButton ${
                    status !== 'owned' ? 'reverse' : ''
                  }`}
                  name='filter'
                  value='owned'
                  onClick={() => (setStatus('owned'), setPage(1))}
                >
                  {t('lotteries:status_owned')}
                </button>
              )} */}
              {/* {lotteriesVM.user_tickets.length > 0 && (
                <button
                  className={`dinoButton ${status !== 'user' ? 'reverse' : ''}`}
                  name='filter'
                  value='user'
                  onClick={() => (setStatus('user'), setPage(1))}
                >
                  {t('lotteries:status_participated')}
                </button>
              )} */}

              <select
                className='dinoButton dropdownButton'
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value='ongoing'>{t('lotteries:status_ongoing')}</option>
                <option value='all'>{t('lotteries:status_all')}</option>
                <option value='ended'>{t('lotteries:status_ended')}</option>
                {lotteriesVM.user_tickets.length > 0 && (
                  <option value='user'>
                    {t('lotteries:status_participated')}
                  </option>
                )}
                {lotteriesVM.user_owned.length > 0 && (
                  <option value='owned'>{t('lotteries:status_owned')}</option>
                )}
              </select>

              <select
                className='dinoButton dropdownButton'
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setPage(1);
                }}
              >
                <option value=''>{t('lotteries:all_price_types')}</option>
                <option value='xgraou'>XGRAOU</option>
                <option value='bee'>BEE</option>
                <option value='egld'>EGLD</option>
                <option value='kwak'>KWAK</option>
                <option value='poxp'>POXP</option>
                <option value='qwt'>QWT</option>
              </select>
            </div>

            {/* Affichage des cartes de loterie */}
            <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6 p-3'>
              {loading || isLoading ? (
                <div>Chargement...</div>
              ) : lotteriesDB && lotteriesDB.length > 0 ? (
                lotteriesDB.map((lottery: DBLottery) => (
                  <LotteryCard2
                    key={lottery.id}
                    page_number={page}
                    status_filter={status}
                    price_filter={price}
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
                      price_amount: new BigNumber(lottery.price_amount || 0),
                      price_identifier: lottery.price_identifier || 'N/A',
                      cancelled: lottery.cancelled || false,
                      price_data: lottery.price_data,
                      image_url:
                        lottery?.prize_data?.media[0]?.thumbnailUrl ||
                        lottery?.price_data?.media[0]?.url ||
                        '/default-lottery-image.png',
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
              {page > 1 && (
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
                  {page > 2 && <span style={{ margin: '0 5px' }}>...</span>}
                </>
              )}

              {/* Bouton page */}
              {maxButtons > 0 &&
                [...Array(maxButtons)].map((_, index) => {
                  const pageNum = page + index;
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
                        fontWeight: pageNum === page + 1 ? 'bold' : 'normal'
                      }}
                    >
                      {pageNum}
                    </span>
                  );
                })}

              {/* Bouton mid */}
              {totalPages >= page + maxButtons && (
                <>
                  {page < totalPages - 1 && (
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
              {page < totalPages && totalPages > 1 && (
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
              count={lotteriesVM?.user_owned?.length}
              cost_graou={userGraouBalance.isGreaterThanOrEqualTo(graou_cost)}
              cost_egld={new BigNumber(balance).isGreaterThanOrEqualTo(
                egld_cost
              )}
            />
          </>
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
