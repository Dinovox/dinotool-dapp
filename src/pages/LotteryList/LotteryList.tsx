import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import './MintSFT.css';
import { useGetAccount } from 'hooks';
import { useState } from 'react';
import BigNumber from 'bignumber.js';
import CreateLotteryModal from './Create';
import LotteryCard from './LotteryCard';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import { useGetLotteries } from 'pages/Dashboard/widgets/LotteryAbi/hooks/useGetLotteries';
import { graou_identifier, lottery_cost } from 'config';
import { useGetUserParticipations } from 'pages/Dashboard/widgets/LotteryAbi/hooks/useGetUserParticipations';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';

export const LotteryList = () => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();
  const [page, setPage] = useState<number>(1);
  const [filter, setFilter] = useState<string>('ongoing');

  const lotteries = useGetLotteries();
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
  const lotteriesDisplay =
    filter === 'user'
      ? userLotteries
      : filter === 'owned'
      ? lotteries.user_owned
      : filter === 'ongoing'
      ? runningLottery
      : endedLottery;

  //calcul pagination
  const itemsPerPage = 4;
  const totalPages = Math.ceil(lotteriesDisplay.length / itemsPerPage);
  const maxPagesToShow = 5;

  let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  return (
    <AuthRedirectWrapper requireAuth={false}>
      <PageWrapper>
        <div className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          {/* Bloc 1 == Liste des lotteries  */}
          <>
            <div className='mintGazTitle dinoTitle' style={{ width: '340px' }}>
              {t('lotteries:lotteries')}
            </div>{' '}
            <div
              className='filter-options'
              style={{ margin: '3px', width: '100%' }}
            >
              <button
                className={`dinoButton ${
                  filter !== 'ongoing' ? 'reverse' : ''
                }`}
                name='filter'
                value='ongoing'
                onClick={() => (setFilter('ongoing'), setPage(1))}
              >
                {t('lotteries:status_ongoing')}
              </button>

              {lotteries.ended.length > 0 && (
                <button
                  className={`dinoButton ${
                    filter !== 'ended' ? 'reverse' : ''
                  }`}
                  name='filter'
                  value='ended'
                  onClick={() => (setFilter('ended'), setPage(1))}
                >
                  {t('lotteries:status_ended')}
                </button>
              )}

              {lotteries.user_owned.length > 0 && (
                <button
                  className={`dinoButton ${
                    filter !== 'owned' ? 'reverse' : ''
                  }`}
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
            {/* Liste des lotteries */}
            <LotteryCard
              runningLottery={
                lotteriesDisplay.length > 0
                  ? lotteriesDisplay?.slice(4 * page - 4, 4 * page)
                  : []
              }
            />
            {/* Start pagination */}
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
              cost_egld={new BigNumber(balance).isGreaterThanOrEqualTo(
                egld_cost
              )}
            />
          </>
        </div>{' '}
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
