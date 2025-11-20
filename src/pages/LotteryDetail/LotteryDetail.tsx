import { PageWrapper } from 'wrappers';
import { ActionBuy } from './Transaction/ActionBuy';
import { useGetNftInformations } from './Transaction/helpers/useGetNftInformation';
import './MintSFT.css';
import ShortenedAddress from 'helpers/shortenedAddress';
import { useGetAccount } from 'lib';
import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import { useGetLottery } from 'pages/Dashboard/widgets/LotteryAbi/hooks';
import { useGetUserTickets } from 'pages/Dashboard/widgets/LotteryAbi/hooks/useGetUserTickets';
import {
  useGetEsdtInformations,
  FormatAmount
} from 'helpers/api/useGetEsdtInformations';
import EsdtDisplay from './EsdtDisplay';
import NftDisplay from './NftDisplay';
import { ActionDraw } from './Transaction/ActionDraw';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { ActionCancel } from './Transaction/ActionCancel';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import { graou_identifier } from 'config';
import { ActionDelete } from './Transaction/ActionDelete';
import LotteryWinner from './LotteryWinner';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';
import formatTime from 'helpers/formatTime';
import TwitterShareButton from './Transaction/helpers/shareOnX';
import { EditDescription } from './EditDescription';
import SafeMarkdown from '../../components/SafeMarkdown';
import { useLocation } from 'react-router-dom';
import bigToHex from 'helpers/bigToHex';

export const LotteryDetail = () => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();

  const location = useLocation();
  const page = location.state?.page_number ? location.state?.page_number : 1;
  const status_filter = location.state?.status;
  const price_filter = location.state?.price;
  let return_url = `/lotteries?page=${page}`;

  if (status_filter) {
    return_url += `&status=${status_filter}`;
  }
  if (price_filter) {
    return_url += `&price=${price_filter}`;
  }

  const [timeStart, setTimeStart] = useState(60 * 60);
  const [timeEnd, setTimeEnd] = useState(60 * 60);
  const { address } = useGetAccount();
  const [lotteryID, setLotteryID] = useState<number>(0);
  // const [page, setPage] = useState<number>(1);
  // const [filter, setFilter] = useState<string>('ongoing');
  const [editingDescription, setEditingDescription] = useState(false);

  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    if (id) {
      setLotteryID(Number(id));
    } else {
      navigate('/lotteries');
    }
  }, [id]);

  const [currentTime, setCurrentTime] = useState(Date.now() / 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now() / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const lottery = useGetLottery(lotteryID);

  const { buyed } = useGetUserTickets(lotteryID);
  const { balance } = useGetAccount();
  const user_esdt = useGetUserESDT(lottery?.price_identifier);
  const user_sft = useGetUserNFT(
    address,
    lottery?.price_identifier
      ? lottery?.price_identifier + '-' + bigToHex(lottery?.price_nonce)
      : ''
  );
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

  const blockToTime = (timestamp: any) => {
    const date = new Date(timestamp * 1000); // Convertir en millisecondes
    return date.toLocaleString(); // Retourner l'heure en format UTC
  };

  return (
    <PageWrapper>
      <div className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
        {/* Bloc 1 == return to list  */}
        <div
          style={{
            float: 'right',
            marginTop: '20px',
            marginRight: '20px'
          }}
        >
          {' '}
          <button onClick={() => navigate(return_url)}>
            {t('lotteries:return')}
          </button>
        </div>

        {/* Bloce 2 == Détails de la lotterie */}
        {lottery.id > 0 && (
          <>
            <div className='mintGazTitle dinoTitle' style={{ width: '340px' }}>
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
                      {lottery.owner.address && (
                        <>
                          <ShortenedAddress
                            address={lottery.owner.address}
                            herotag={lottery?.owner?.herotag}
                          />
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
                    {lottery.auto_draw ? (
                      <div className='info-item'>
                        <span className='text-label'>
                          {t('lotteries:auto_draw')}
                        </span>{' '}
                      </div>
                    ) : (
                      <div className='info-item'>
                        <span className='text-label'>
                          {t('lotteries:manual_draw')}
                        </span>{' '}
                      </div>
                    )}
                  </>
                )}

                {/* <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  > */}
                {lottery?.description && (
                  <div className='info-item'>
                    <span className='text-label'>
                      {
                        <SafeMarkdown
                          content={'---\n' + lottery?.description + '\n\n---'}
                        />
                      }
                    </span>
                  </div>
                )}

                {lottery.owner.address == address && (
                  <>
                    <div className='info-item'>
                      <div className='text-label'>
                        <button
                          onClick={() =>
                            setEditingDescription(!editingDescription)
                          }
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            color: '#555'
                          }}
                          title='Modifier la description'
                        >
                          ✏️
                        </button>
                      </div>
                    </div>{' '}
                    <div style={{ width: '100%' }}>
                      {(editingDescription || lottery.description == '') && (
                        <EditDescription
                          lottery_id={lotteryID}
                          lottery_description={lottery.description}
                        />
                      )}
                    </div>
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
                      {lottery.price_nonce > 0 ? (
                        <NftDisplay
                          nftInfo={price_nft_information}
                          amount={lottery.price_amount}
                          is_free={
                            ['FreeEgld', 'FreeSft', 'FreeEsdt'].includes(
                              lottery.price_type
                            )
                              ? true
                              : false
                          }
                          is_locked={
                            ['LockedEgld', 'LockedSft', 'LockedEsdt'].includes(
                              lottery.price_type
                            )
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
                                lottery.price_type
                              )
                                ? true
                                : false
                            }
                            is_locked={
                              [
                                'LockedEgld',
                                'LockedSft',
                                'LockedEsdt'
                              ].includes(lottery.price_type)
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
                !lottery.cancelled &&
                !lottery.drawn &&
                !lottery.deleted &&
                lottery.owner.address != address &&
                lottery.max_tickets.isGreaterThan(lottery.tickets_sold) && (
                  <div
                    style={{
                      justifyContent: 'center',
                      display: 'grid'
                    }}
                  >
                    <div
                      style={{
                        justifyContent: 'center',
                        display: 'grid'
                      }}
                    >
                      <ActionBuy
                        lottery_id={lotteryID}
                        price_identifier={lottery?.price_identifier}
                        price_nonce={lottery.price_nonce}
                        price_amount={new BigNumber(lottery.price_amount)}
                        price_decimals={
                          new BigNumber(
                            lottery?.price_decimals
                              ? lottery?.price_decimals
                              : 0
                          )
                        }
                        balance={new BigNumber(balance)}
                        esdt_balance={
                          new BigNumber(userEsdtBalance ? userEsdtBalance : 0)
                        }
                        graou_balance={userGraouBalance}
                        sft_balance={
                          new BigNumber(userSftBalance ? userSftBalance : 0)
                        }
                        buyed={
                          new BigNumber(lottery.max_per_wallet).isGreaterThan(
                            0
                          ) &&
                          new BigNumber(buyed).isGreaterThanOrEqualTo(
                            lottery.max_per_wallet
                          )
                        }
                        time_start={timeStart}
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
                    {Number(buyed) == 0 && (
                      <> {t('lotteries:check_collection')}</>
                    )}
                  </div>
                )}
              {lottery.cancelled && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button className='dinoButton' disabled>
                    {t('lotteries:status_cancelled')}
                  </button>
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
            {(lottery.owner.address == address ||
              address ==
                'erd1x5zq82l0whpawgr53k6y63xh5jq2649k99q49s0508s82w25ytsq7f89my') &&
              !lottery.deleted && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {lottery.winner_id == 0 ? (
                    <ActionDraw
                      lottery_id={lotteryID}
                      disabled={
                        lottery.tickets_sold.isLessThan(1) ||
                        (lottery.end_time > 0 &&
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
            {timeStart > 0 &&
              lottery.start_time > 0 &&
              !lottery.cancelled &&
              !lottery.deleted &&
              !lottery.drawn && (
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
            {timeStart == 0 &&
              lottery.end_time > 0 &&
              timeEnd > 0 &&
              !lottery.cancelled &&
              !lottery.deleted &&
              !lottery.drawn && (
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
              lottery.owner.address != address &&
              !lottery.cancelled &&
              !lottery.deleted &&
              !lottery.drawn && (
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
  );
};
