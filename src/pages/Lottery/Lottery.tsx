import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { ActionBuy } from './Transaction/ActionBuy';
import { useGetNftInformations } from './Transaction/helpers/useGetNftInformation';
import { formatAmount } from 'utils/sdkDappUtils';
import './MintSFT.css';
import ShortenedAddress from 'helpers/shortenedAddress';
import { useGetAccount } from 'hooks';
import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import { useGetLottery } from 'pages/Dashboard/widgets/LotteryAbi/hooks';
import { useGetUserTickets } from 'pages/Dashboard/widgets/LotteryAbi/hooks/useGetUserTickets';
import { useGetEsdtInformations } from './Transaction/helpers/useGetEsdtInformation';
import EsdtDisplay from './EsdtDisplay';
import NftDisplay from './NftDisplay';
import { ActionDraw } from './Transaction/ActionDraw';
import CreateLotteryModal from './Create';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { ActionCancel } from './Transaction/ActionCancel';
import LotteryList from './LotteryList';
import freeChest from 'assets/img/freeChest.png';
import FileDisplay from './FileDisplay';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import { useGetLotteries } from 'pages/Dashboard/widgets/LotteryAbi/hooks/useGetLotteries';
import { graou_identifier, lottery_cost, xgraou_identifier } from 'config';
import { ActionDelete } from './Transaction/ActionDelete';
import { useGetUserParticipations } from 'pages/Dashboard/widgets/LotteryAbi/hooks/useGetUserParticipations';
import LotteryWinner from './LotteryWinner';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';
import formatTime from 'helpers/formatTime';
import TwitterShareButton from './Transaction/helpers/shareOnX';

export const Lottery = () => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();

  const [timeStart, setTimeStart] = useState(60 * 60);
  const [timeEnd, setTimeEnd] = useState(60 * 60);
  const { address } = useGetAccount();
  const [lotteryID, setLotteryID] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [filter, setFilter] = useState<string>('ongoing');
  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    if (id) {
      setLotteryID(Number(id));
    } else {
      setLotteryID(0);
    }
  }, [id]);

  const [currentTime, setCurrentTime] = useState(Date.now() / 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now() / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [displayText, setDisplayText] = useState('');
  const fullText =
    'Impression... 🦖... GRAOU!🦖 Impression... 🦖... GRAOU!🦖 Impression... 🦖... GRAOU!🦖 Impression... 🦖... GRAOU!🦖 Impression... 🦖... GRAOU!🦖 Impression... 🦖... GRAOU!🦖 Impression... 🦖... GRAOU!🦖 Impression... 🦖... GRAOU!🦖 Impression... 🦖... GRAOU!🦖 Impression... 🦖... GRAOU!🦖 Impression... 🦖... GRAOU!🦖 Impression... 🦖... GRAOU!🦖';
  useEffect(() => {
    const characters = Array.from(fullText); //array for emoji..
    let index = 0;

    const interval = setInterval(() => {
      if (index < characters.length) {
        setDisplayText(characters.slice(0, index + 1).join(''));
        index++;
      } else {
        index = 0;
        setDisplayText('');
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const lotteries = useGetLotteries();
  const runningLottery = lotteries.running;
  const endedLottery = lotteries.ended;
  const userLotteries = useGetUserParticipations(filter);

  // const lottery = useGetLottery(lotteryID == 0 ? runningLottery[0] : lotteryID);
  const lottery = useGetLottery(lotteryID);

  const { buyed } = useGetUserTickets(lotteryID);
  const { balance } = useGetAccount();
  const user_esdt = useGetUserESDT();
  const user_sft = useGetUserNFT(address);
  const prize_nft_information = useGetNftInformations(
    lottery?.prize_nonce > 0 ? lottery?.prize_identifier : '',
    lottery?.prize_nonce > 0 ? lottery?.prize_nonce : ''
  );
  const prize_esdt_information = useGetEsdtInformations(
    lottery?.prize_nonce == 0 ? lottery?.prize_identifier : ''
  );

  const price_nft_information = useGetNftInformations(
    lottery?.price_nonce > 0 ? lottery?.price_identifier : '',
    lottery?.price_nonce > 0 ? lottery?.price_nonce : ''
  );
  const price_esdt_information = useGetEsdtInformations(
    lottery?.price_nonce == 0 ? lottery?.price_identifier : ''
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now() / 1000;
      const newTimeStart = lottery?.start_time - currentTime;
      setTimeStart(newTimeStart > 0 ? Math.floor(newTimeStart) : 0);
      const newTimeEnd = lottery?.end_time - currentTime;
      setTimeEnd(newTimeEnd > 0 ? Math.floor(newTimeEnd) : 0);

      // Empêche le temps restant d'aller en dessous de 0
    }, 1000);

    return () => clearInterval(interval); // Nettoyage de l'intervalle
  }, [lottery]);

  const userEsdtBalance = new BigNumber(
    user_esdt.find((esdt: any) => esdt.identifier === lottery?.price_identifier)
      ?.balance || 0
  );

  const userSftBalance = new BigNumber(
    user_sft.find(
      (sft: any) =>
        sft.collection == lottery?.price_identifier &&
        sft.nonce == lottery?.price_nonce
    )?.balance || 0
  );
  const userGraouBalance = new BigNumber(
    user_esdt.find((esdt: any) => esdt.identifier === graou_identifier)
      ?.balance || 0
  );

  const cost = new BigNumber(lottery_cost);

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
          {!lottery.id ? (
            <>
              <div
                className='mintGazTitle dinoTitle'
                style={{ width: '340px' }}
              >
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
                    className={`dinoButton ${
                      filter !== 'user' ? 'reverse' : ''
                    }`}
                    name='filter'
                    value='user'
                    onClick={() => (setFilter('user'), setPage(1))}
                  >
                    {t('lotteries:status_participated')}
                  </button>
                )}
              </div>
              <LotteryList
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
                        backgroundColor:
                          page === totalPages ? '#ddd' : '#f0f0f0',
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
                cost={userGraouBalance.isGreaterThanOrEqualTo(cost)}
              />
            </>
          ) : (
            <div
              style={{
                float: 'right',
                marginTop: '20px',
                marginRight: '20px'
              }}
            >
              {' '}
              <button onClick={() => navigate('/lotteries')}>
                {t('lotteries:return')}
              </button>
            </div>
          )}

          {/* Bloce 2 == Détails de la lotterie */}
          {lottery.id > 0 && (
            <>
              <div
                className='mintGazTitle dinoTitle'
                style={{ width: '340px' }}
              >
                {t('lotteries:lottery_number', {
                  number: lottery?.id.toFixed()
                })}
              </div>{' '}
              {/* Details de la lotterie (owner , tickets, start, end, max per wallet) */}
              <div className='dinocard'>
                <div className='sub-dinocard box-item'>
                  {lottery && (
                    <>
                      <div className='info-item'>
                        <span className='text-label'>
                          {t('lotteries:owner')}:{' '}
                        </span>
                        {lottery.owner && (
                          <>
                            <ShortenedAddress address={lottery.owner} />
                          </>
                        )}
                      </div>
                      <div className='info-item'>
                        <span className='text-label'>
                          {t('lotteries:tickets')}:{' '}
                        </span>{' '}
                        {lottery?.tickets_sold.toFixed()} /{' '}
                        {lottery?.max_tickets.toFixed()}
                      </div>{' '}
                      {lottery.max_per_wallet > 0 && (
                        <div className='info-item'>
                          <span className='text-label'>MAX / wallet: </span>{' '}
                          {lottery?.max_per_wallet.toFixed()}{' '}
                        </div>
                      )}
                      <div className='info-item'>
                        <span className='text-label'>
                          {t('lotteries:start')}:{' '}
                        </span>{' '}
                        {blockToTime(lottery?.start_time)}{' '}
                      </div>
                      {lottery.end_time > 0 && (
                        <div className='info-item'>
                          <span className='text-label'>
                            {t('lotteries:end')}:{' '}
                          </span>{' '}
                          {blockToTime(lottery?.end_time)}{' '}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              {/* Details du prix d'entrée et récompense*/}
              <div className='bg-[#fefaf5] pt-6 justify-center pb-6 mb-6 '>
                {' '}
                <LotteryWinner lottery={lottery} />
                <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'></div>
                <div className='dinocard' style={{ minHeight: '250px' }}>
                  {lottery && lottery.prize_identifier && (
                    <>
                      <div className='sub-dinocard box-item'>
                        <span className='text-label'>
                          {t('lotteries:entry_cost')}{' '}
                        </span>
                        {lottery.price_nonce.isGreaterThan(0) ? (
                          <NftDisplay
                            nftInfo={price_nft_information}
                            amount={lottery.price_amount}
                            is_free={
                              ['FreeEgld', 'FreeSft', 'FreeEsdt'].includes(
                                lottery.price_type.name
                              )
                                ? true
                                : false
                            }
                            is_locked={
                              [
                                'LockedEgld',
                                'LockedSft',
                                'LockedEsdt'
                              ].includes(lottery.price_type.name)
                                ? true
                                : false
                            }
                          />
                        ) : (
                          <>
                            {' '}
                            <EsdtDisplay
                              esdtInfo={price_esdt_information}
                              amount={lottery.price_amount}
                              is_free={
                                ['FreeEgld', 'FreeSft', 'FreeEsdt'].includes(
                                  lottery.price_type.name
                                )
                                  ? true
                                  : false
                              }
                              is_locked={
                                [
                                  'LockedEgld',
                                  'LockedSft',
                                  'LockedEsdt'
                                ].includes(lottery.price_type.name)
                                  ? true
                                  : false
                              }
                            />
                          </>
                        )}
                      </div>
                      <div className='sub-dinocard box-item'>
                        <span className='text-label'>
                          {' '}
                          {t('lotteries:prize')}{' '}
                        </span>
                        {lottery.prize_nonce > 0 ? (
                          <NftDisplay
                            nftInfo={prize_nft_information}
                            amount={lottery.prize_amount}
                          />
                        ) : (
                          <>
                            {' '}
                            <EsdtDisplay
                              esdtInfo={prize_esdt_information}
                              amount={lottery.prize_amount}
                            />
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>{' '}
                {/* Il reste des tickets à vendre */}
                {lottery &&
                  lottery.owner != address &&
                  lottery.max_tickets.isGreaterThan(lottery.tickets_sold) && (
                    <div style={{ justifyContent: 'center', display: 'grid' }}>
                      <ActionBuy
                        lottery_id={lotteryID}
                        price_identifier={lottery?.price_identifier}
                        price_nonce={lottery.price_nonce}
                        price_amount={lottery.price_amount}
                        balance={new BigNumber(balance)}
                        esdt_balance={
                          new BigNumber(userEsdtBalance ? userEsdtBalance : 0)
                        }
                        graou_balance={userGraouBalance}
                        sft_balance={
                          new BigNumber(userSftBalance ? userSftBalance : 0)
                        }
                        buyed={
                          lottery.max_per_wallet > 0 &&
                          buyed >= lottery.max_per_wallet
                            ? true
                            : false
                        }
                        started={timeStart}
                        ended={
                          lottery.end_time > 0 && timeEnd <= 0 ? true : false
                        }
                      />
                      <div
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          display: 'grid'
                        }}
                      >
                        {' '}
                        {Number(buyed) > 0 && (
                          <>
                            {t('lotteries:you_have_tickets', {
                              number: buyed.toFixed(),
                              s: buyed > 1 ? 's' : ''
                            })}
                            <br />
                          </>
                        )}
                      </div>
                    </div>
                  )}
              </div>
              {/* Tout est vendu ou la lotterie est terminée */}
              {lottery &&
                lottery.tickets_sold.isGreaterThanOrEqualTo(
                  lottery.max_tickets && lottery.winner_id == 0
                ) && (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {t('lotteries:wait_owner')}{' '}
                  </div>
                )}
              {/* Actions pour l'owner */}
              {lottery.owner == address && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {lottery.winner_id == 0 ? (
                    <ActionDraw
                      lottery_id={lotteryID}
                      disabled={
                        lottery.tickets_sold.isLessThan(1) ||
                        (lottery.end_time.isGreaterThan(0) &&
                          timeEnd > 0 &&
                          lottery.tickets_sold.isLessThan(lottery.max_tickets))
                      }
                      tickets={lottery.tickets_sold}
                    />
                  ) : (
                    <ActionDelete lottery_id={lotteryID} />
                  )}
                  {lottery.winner_id == 0 && (
                    <ActionCancel
                      lottery_id={lotteryID}
                      disabled={lottery.tickets_sold.isGreaterThan(50)}
                    />
                  )}
                  <TwitterShareButton lottery_id={lotteryID} />
                </div>
              )}
              {/* Timer pour tout le monde */}
              {timeStart > 0 && (
                <div
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    display: 'grid'
                  }}
                >
                  {t('lotteries:open_in', { time: formatTime(timeStart) })}
                </div>
              )}
              {timeStart == 0 && lottery.end_time > 0 && timeEnd > 0 && (
                <div
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    display: 'grid'
                  }}
                >
                  {t('lotteries:end_in', { time: formatTime(timeEnd) })}
                </div>
              )}
              {/* Actions pour les participants */}
              {(timeStart == 0 || lottery.start_time == 0) &&
                lottery.owner != address && (
                  <div
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      display: 'grid'
                    }}
                  ></div>
                )}
            </>
          )}
        </div>{' '}
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};

const blockToTime = (timestamp: any) => {
  const date = new Date(timestamp * 1000); // Convertir en millisecondes
  return date.toLocaleString(); // Retourner l'heure en format UTC
};
