import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { Transaction } from './Transaction';
import { ActionBuy } from './Transaction/ActionBuy';
import { useGetNftInformations } from './Transaction/helpers/useGetNftInformation';
import { formatAmount } from 'utils/sdkDappUtils';
import toHex from 'helpers/toHex';
import './MintSFT.css';
import ShortenedAddress from 'helpers/shortenedAddress';
import { useGetAccount } from 'hooks';
import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import sold_graout from 'assets/img/sold_graout.jpg';
import { useGetLottery } from 'pages/Dashboard/widgets/LotteryAbi/hooks';
import { useGetUserTickets } from 'pages/Dashboard/widgets/LotteryAbi/hooks/useGetUserTickets';
import { useGetEsdtInformations } from './Transaction/helpers/useGetEsdtInformation';
import EsdtDisplay from './EsdtDisplay';
import NftDisplay from './NftDisplay';
import { time } from 'console';
import { ActionDraw } from './Transaction/ActionDraw';
import CreateLotteryModal from './Create';
import { useGetRunningLottery } from 'pages/Dashboard/widgets/LotteryAbi/hooks/useGetRunningLottery';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { ActionCancel } from './Transaction/ActionCancel';
import LotteryList from './LotteryList';
import freeChest from 'assets/img/freeChest.png';
import FileDisplay from './FileDisplay';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import { useGetEndedLottery } from 'pages/Dashboard/widgets/LotteryAbi/hooks/useGetEndedLottery';

export const Lottery = () => {
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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

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

  const runningLottery = useGetRunningLottery().sort((a, b) => b - a);
  const endedLottery = useGetEndedLottery().sort((a, b) => b - a);
  // console.log('runningLottery', runningLottery.toString());

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
      const newTimeStart = lottery?.start - currentTime;
      setTimeStart(newTimeStart > 0 ? Math.floor(newTimeStart) : 0);
      const newTimeEnd = lottery?.end - currentTime;
      setTimeEnd(newTimeEnd > 0 ? Math.floor(newTimeEnd) : 0);

      // Empêche le temps restant d'aller en dessous de 0
    }, 1000);

    return () => clearInterval(interval); // Nettoyage de l'intervalle
  }, [lottery]);

  const userEsdtBalance = user_esdt.find(
    (esdt: any) => esdt.identifier === lottery?.price_identifier
  )?.balance;
  const userSftBalance = user_sft.find(
    (sft: any) =>
      sft.collection == lottery?.price_identifier &&
      sft.nonce == lottery?.price_nonce
  )?.balance;
  const lotteriesDisplay =
    filter === 'owned'
      ? [lotteryID]
      : filter === 'ongoing'
      ? runningLottery
      : endedLottery;

  return (
    <AuthRedirectWrapper requireAuth={false}>
      <PageWrapper>
        <div className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          {!lottery.id ? (
            <>
              <div
                className='mintGazTitle dinoTitle'
                style={{ width: '340px' }}
              >
                Lotteries
              </div>{' '}
              <div className='filter-options' style={{ margin: '3px' }}>
                <label style={{ margin: '3px' }}>
                  <input
                    type='radio'
                    name='filter'
                    value='ongoing'
                    checked={filter === 'ongoing'}
                    onChange={() => (setFilter('ongoing'), setPage(1))}
                  />
                  Ongoing
                </label>
                <label style={{ margin: '3px' }}>
                  <input
                    type='radio'
                    name='filter'
                    value='ended'
                    checked={filter === 'ended'}
                    onChange={() => (setFilter('ended'), setPage(1))}
                  />
                  Ended
                </label>
                <label style={{ margin: '3px' }}>
                  <input
                    type='radio'
                    name='filter'
                    value='owned'
                    checked={filter === 'owned'}
                    onChange={() => (setFilter('owned'), setPage(1))}
                  />
                  Owned
                </label>
              </div>
              <LotteryList
                runningLottery={lotteriesDisplay.slice(4 * page - 4, 4 * page)}
              />
              <div className='pagination'>
                <button
                  onClick={() => {
                    if (page > 1) {
                      setPage(page - 1);
                    }
                  }}
                  disabled={page <= 1}
                >
                  Previous
                </button>

                {lotteriesDisplay
                  .slice(4 * page - 4, 4 * page)
                  .map((lottery) => (
                    <span
                      key={lottery}
                      onClick={() => {
                        setLotteryID(lottery);
                        navigate(`/lotteries/${lottery}`, { replace: true });
                      }}
                      style={{
                        display: 'inline-block',
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ccc',
                        textAlign: 'center',
                        lineHeight: '20px',
                        margin: '2px',
                        cursor: 'pointer'
                      }}
                      className='pagination-square'
                    >
                      {lottery}
                    </span>
                  ))}
                <button
                  disabled={lotteriesDisplay.length <= page * 4}
                  onClick={() => {
                    if (lotteriesDisplay.length > page * 4) {
                      setPage(page + 1);
                    }
                  }}
                >
                  Next
                </button>
              </div>
              <CreateLotteryModal />
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
              <button onClick={() => navigate('/lotteries')}>Return</button>
            </div>
          )}
          {lottery.id > 0 && (
            <>
              <div
                className='mintGazTitle dinoTitle'
                style={{ width: '340px' }}
              >
                Lottery #{lottery?.id.toFixed()}
              </div>{' '}
              <div className='dinocard'>
                <div className='sub-dinocard box-item'>
                  {lottery && (
                    <>
                      <div className='info-item'>
                        <span className='text-label'>Owner: </span>
                        {lottery.owner && (
                          <>
                            <ShortenedAddress address={lottery.owner} />
                          </>
                        )}
                      </div>
                      <div className='info-item'>
                        <span className='text-label'>Tickets: </span>{' '}
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
                        <span className='text-label'>Start: </span>{' '}
                        {blockToTime(lottery?.start)}{' '}
                      </div>
                      {lottery.end > 0 && (
                        <div className='info-item'>
                          <span className='text-label'>End: </span>{' '}
                          {blockToTime(lottery?.end)}{' '}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className='dinocard'>
                {lottery && lottery.prize_identifier && (
                  <>
                    <div className='sub-dinocard box-item'>
                      <span className='text-label'>Entry Cost </span>

                      {lottery.price_nonce > 0 ? (
                        <NftDisplay
                          nftInfo={price_nft_information}
                          amount={lottery.price_amount}
                        />
                      ) : (
                        <>
                          {' '}
                          {lottery.price_identifier == 'FREE-000000' ? (
                            <div
                              className='mint-image'
                              style={{ margin: 'auto', width: '200px' }}
                            >
                              <FileDisplay
                                source={freeChest}
                                fileType={''}
                                width='200px'
                                height='200px'
                              />
                              <p>Free</p>
                            </div>
                          ) : (
                            <EsdtDisplay
                              esdtInfo={price_esdt_information}
                              amount={lottery.price_amount}
                            />
                          )}
                        </>
                      )}
                    </div>
                    <div className='sub-dinocard'>
                      <span className='text-label'>Winning Prize </span>
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
                {/* {timeStart >= 60 * 30 && (
                  <div className='sub-dinocard'>{displayText}</div>
                )}{' '} */}
              </div>
              {lottery.winner !=
              'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu' ? (
                <>
                  <div className='dinocard'>
                    <div className='sub-dinocard'>
                      <div className='info-item'></div>
                      <span className='text-label'>Winner: </span>

                      <ShortenedAddress address={lottery.winner} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {lottery.tickets_sold >= lottery.max_tickets && (
                    <> Waiting for the owner to draw the winner</>
                  )}
                </>
              )}
              {lottery.owner == address && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {lottery.winner ==
                    'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu' && (
                    <ActionDraw
                      lottery_id={lotteryID}
                      disabled={lottery.tickets_sold == 0}
                    />
                  )}
                  {lottery.winner ==
                    'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu' && (
                    <ActionCancel lottery_id={lotteryID} />
                  )}
                </div>
              )}
              {/* {lottery &&
                (lottery.tickets_sold >= lottery.max_tickets ||
                  (lottery.end < Date.now() && lottery.end > 0)) ? (

                       <></>
                        ) : (
                          <>
                           
                          </>
                        )}
                )}{' '} */}
              <div
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  display: 'grid'
                }}
              >
                <div className='text-label' style={{ margin: 'auto' }}>
                  {lottery && lottery.max_tickets > lottery.tickets_sold ? (
                    <>
                      {timeStart > 0 ? (
                        <div>Open in : {formatTime(timeStart)}</div>
                      ) : (
                        <>
                          {timeEnd > 0 || lottery.end == 0 ? (
                            <>
                              {lottery.owner != address ? (
                                <ActionBuy
                                  lottery_id={lotteryID}
                                  price_identifier={lottery?.price_identifier}
                                  price_nonce={lottery.price_nonce}
                                  price_amount={lottery.price_amount}
                                  balance={new BigNumber(balance)}
                                  esdt_balance={
                                    new BigNumber(
                                      userEsdtBalance ? userEsdtBalance : 0
                                    )
                                  }
                                  sft_balance={
                                    new BigNumber(
                                      userSftBalance ? userSftBalance : 0
                                    )
                                  }
                                  buyed={
                                    lottery.max_per_wallet > 0 &&
                                    buyed >= lottery.max_per_wallet
                                      ? true
                                      : false
                                  }
                                />
                              ) : (
                                <>Owner can't buy ticket</>
                              )}
                              {buyed > 0 && (
                                <p>You have {buyed.toFixed()} tickets</p>
                              )}

                              {lottery.end > 0 && (
                                <div>End in : {formatTime(timeEnd)}</div>
                              )}
                            </>
                          ) : (
                            <>
                              {lottery.winner ==
                                'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu' &&
                                lottery.tickets_sold > 0 && (
                                  <>Sale ended waiting for final draw</>
                                )}
                              {lottery.end > 0 && timeEnd == 0 && (
                                <div>
                                  The lottery has ended as the deadline expired.
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <span>
                        {buyed && buyed > 0 && (
                          <>
                            You have {buyed.toFixed()} tickets
                            <br />
                          </>
                        )}
                      </span>{' '}
                    </>
                  )}
                  <div></div>
                </div>
              </div>{' '}
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
