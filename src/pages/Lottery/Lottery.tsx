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

export const Lottery = () => {
  const [timeStart, setTimeStart] = useState(60 * 60);
  const [timeEnd, setTimeEnd] = useState(60 * 60);
  const { address } = useGetAccount();
  const [lotteryID, setLotteryID] = useState<number>(0);
  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    if (id) {
      setLotteryID(Number(id));
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

  const runningLottery = useGetRunningLottery();
  // console.log('runningLottery', runningLottery.toString());

  const lottery = useGetLottery(lotteryID == 0 ? runningLottery[0] : lotteryID);

  const { buyed, esdtAmount } = useGetUserTickets(lotteryID);
  const { balance } = useGetAccount();

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

  return (
    <AuthRedirectWrapper requireAuth={false}>
      <PageWrapper>
        <div className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          <CreateLotteryModal />
          {runningLottery && runningLottery.length > 0 && (
            <div className='running-lottery'>
              <h2>Running Lotteries</h2>
              <ul>
                {runningLottery.map((lottery) => (
                  <span
                    key={lottery}
                    onClick={() => {
                      setLotteryID(lottery);
                      navigate(`/lottery/${lottery}`, { replace: true });
                      // window.history.pushState({}, '', `/lottery/${lottery}`);
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
              </ul>
            </div>
          )}
          <div className='mintGazTitle dinoTitle' style={{ width: '340px' }}>
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
                  <div className='info-item'>
                    <span className='text-label'>End: </span>{' '}
                    {blockToTime(lottery?.end)}{' '}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className='dinocard'>
            {lottery && lottery.prize_identifier && timeStart <= 60 * 30 ? (
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
                      <EsdtDisplay
                        esdtInfo={price_esdt_information}
                        amount={lottery.price_amount}
                      />
                    </>
                  )}

                  {/* <div className='info-item'>
                    <span className='text-label'>Wallet:</span>{' '}
                    {lottery.payment_token == 'EGLD' ? (
                      <>
                        {formatAmount({
                          input: balance,
                          decimals: 18,
                          digits: 2,
                          showLastNonZeroDecimal: false,
                          addCommas: true
                        })}
                      </>
                    ) : (
                      <>
                        {formatAmount({
                          input: esdtAmount.toFixed(),
                          decimals: 18,
                          digits: 2,
                          showLastNonZeroDecimal: false,
                          addCommas: true
                        })}
                      </>
                    )}{' '}
                    <span className='identifier'>
                      {' '}
                      {lottery.price_identifier}
                    </span>
                  </div> */}
                  {/* <div className='info-item'>
                    <span className='text-label'>Price: </span>
                    {formatAmount({
                      input: lottery?.price_amount?.toFixed(),
                      decimals: 18,
                      digits: 2,
                      showLastNonZeroDecimal: false,
                      addCommas: true
                    })}{' '}
                    <span className='identifier'>
                      {' '}
                      {lottery?.price_identifier}
                    </span>
                  </div> */}

                  {/* {lottery.prize_amount && lottery.prize_amount > 1 && (
                    <div className='info-item'>
                      <span className='text-label'>Amount: </span>{' '}
                      {formatAmount({
                        input: lottery.prize_amount.toFixed(),
                        digits: 0,
                        decimals: prize_esdt_information?.decimals,
                        showLastNonZeroDecimal: false,
                        addCommas: true
                      })}
                    </div>
                  )} */}
                  {/* <div className='info-item'>
                    <span className='text-label'>SFT: </span>{' '}
                    {lottery?.prize_identifier}-
                    {toHex(lottery?.prize_nonce.toFixed())}
                  </div> */}

                  {/* {lottery?.fee_percentage > 0 && (
                    <div className='info-item'>
                      <span className='text-label'>Fees: </span>{' '}
                      {lottery?.fee_percentage / 100} %
                    </div>
                  )} */}
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
            ) : (
              <div className='sub-dinocard'>{displayText}</div>
            )}
          </div>
          {lottery &&
            (lottery.tickets_sold >= lottery.max_tickets ||
              timeEnd > lottery.end) && (
              <div className='dinocard'>
                <div className='sub-dinocard'>
                  <div className='info-item'>
                    {lottery.winner &&
                    lottery.winner !=
                      'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu' ? (
                      <>
                        <span className='text-label'>Winner: </span>

                        <ShortenedAddress address={lottery.winner} />
                      </>
                    ) : (
                      <>
                        {lottery.owner != address ? (
                          <>Waiting for the owner to draw the winner</>
                        ) : (
                          <>
                            <ActionDraw lottery_id={lotteryID} />
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          <div
            style={{ width: '100%', justifyContent: 'center', display: 'grid' }}
          >
            <div className='text-label' style={{ margin: 'auto' }}>
              {lottery && lottery.max_tickets > lottery.tickets_sold ? (
                <>
                  {timeStart > 0 ? (
                    <div>Open in : {formatTime(timeStart)}</div>
                  ) : (
                    <>
                      {timeEnd > 0 ? (
                        <>
                          {lottery.owner != address ? (
                            <ActionBuy
                              lottery_id={lotteryID}
                              price_identifier={lottery?.price_identifier}
                              price_nonce={lottery.price_nonce}
                              price_amount={lottery.price_amount}
                              balance={new BigNumber(balance)}
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

                          {buyed > 0 && <>You have {buyed.toFixed()} tickets</>}
                          <div>End in : {formatTime(timeEnd)}</div>
                        </>
                      ) : (
                        <>Sale ended waiting for final draw</>
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
                    SOLD GRAOUT
                  </span>{' '}
                </>
              )}
              <div></div>
            </div>
            {/* <MxLink
              className='dinoButton  rounded-lg px-3 py-2 text-center hover:no-underline my-0 bg-blue-600 '
              to={RouteNamesEnum.unlock}
            >
              Connect
            </MxLink> */}
          </div>{' '}
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};

const blockToTime = (timestamp: any) => {
  const date = new Date(timestamp * 1000); // Convertir en millisecondes
  return date.toLocaleString(); // Retourner l'heure en format UTC
};
