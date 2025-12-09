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
import { Breadcrumb } from 'components/ui/Breadcrumb';
import { PageTemplate } from 'components/PageTemplate';

export const LotteryDetail = () => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();

  const location = useLocation();
  const page = location.state?.page_number ? location.state?.page_number : 1;
  const status_filter = location.state?.status;
  const price_filter = location.state?.price;
  let return_url = `/lotteries?page=${page}`;

  const ids = location.state?.ids;

  if (status_filter) {
    return_url += `&status=${status_filter}`;
  }
  if (price_filter) {
    return_url += `&price=${price_filter}`;
  }

  const handleReturn = () => {
    navigate(return_url, {
      state: {
        ids: ids
      }
    });
  };

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
    lottery?.price_identifier && lottery?.price_nonce != null
      ? lottery?.price_identifier + '-' + bigToHex(lottery?.price_nonce)
      : '',
    undefined,
    {
      enabled: !!(lottery?.price_identifier && lottery?.price_nonce != null)
    }
  );
  const user_prize_esdt = useGetUserESDT(lottery?.prize_identifier);
  const user_prize_sft = useGetUserNFT(
    address,
    lottery?.prize_identifier && lottery?.prize_nonce > 0
      ? lottery?.prize_identifier + '-' + bigToHex(lottery?.prize_nonce)
      : '',
    undefined,
    {
      enabled: !!(lottery?.prize_identifier && lottery?.prize_nonce > 0)
    }
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

  const userPrizeEsdtBalance = new BigNumber(
    user_prize_esdt.find(
      (esdt: any) => esdt.identifier === lottery?.prize_identifier
    )?.balance || 0
  );

  const userPrizeSftBalance = new BigNumber(
    user_prize_sft.find(
      (sft: any) =>
        sft.collection == lottery?.prize_identifier &&
        sft.nonce == lottery?.prize_nonce
    )?.balance || 0
  );

  const blockToTime = (timestamp: any) => {
    const date = new Date(timestamp * 1000); // Convertir en millisecondes
    return date.toLocaleString(); // Retourner l'heure en format UTC
  };

  const statusBadge = (() => {
    let statusContent = null;
    let statusClass = 'bg-gray-100 text-gray-600';

    const isSoldOut =
      new BigNumber(lottery.max_tickets).isGreaterThan(0) &&
      new BigNumber(lottery.tickets_sold).isGreaterThanOrEqualTo(
        lottery.max_tickets
      );
    const isEnded = lottery.end_time > 0 && timeEnd <= 0;

    if (lottery.cancelled) {
      statusContent = t('lotteries:status_cancelled');
      statusClass = 'bg-red-100 text-red-800';
    } else if (lottery.winner_id > 0) {
      statusContent = `✅ ${t('lotteries:drawn_on')} ${blockToTime(
        lottery?.end_time
      )}`;
      statusClass = 'bg-green-100 text-green-800';
    } else if (lottery.deleted) {
      statusContent = t('lotteries:lottery_deleted');
      statusClass = 'bg-red-100 text-red-800';
    } else if (timeStart > 0) {
      statusContent = `🕒 ${t('lotteries:open_in', {
        time: formatTime(timeStart)
      })}`;
      statusClass = 'bg-blue-50 text-blue-700';
    } else if (isSoldOut || isEnded) {
      statusContent = t('lotteries:wait_owner');
      statusClass = 'bg-orange-100 text-orange-800';
    } else {
      // Open / In Progress
      if (lottery.end_time > 0) {
        statusContent = `🕒 ${t('lotteries:end_in', {
          time: formatTime(timeEnd)
        })}`;
        statusClass = 'bg-yellow-50 text-yellow-700';
      } else {
        statusContent = `🟢 ${t('lotteries:in_progress')}`;
        statusClass = 'bg-green-50 text-green-700';
      }
    }

    if (!statusContent) return null;

    return (
      <div
        className={`px-3 py-1 rounded-full font-medium text-xs sm:text-sm shadow-sm self-start sm:self-center ${statusClass}`}
      >
        {statusContent}
      </div>
    );
  })();

  return (
    <PageWrapper>
      <PageTemplate
        title={t('lotteries:lottery_number', {
          number: lottery?.id?.toFixed()
        })}
        breadcrumbItems={[
          { label: 'Home', path: '/' },
          { label: t('lotteries:lotteries'), path: '/lotteries' },
          {
            label: t('lotteries:lottery_number', {
              number: lottery?.id?.toFixed() || '...'
            })
          }
        ]}
      >
        <div className='flex flex-col w-full max-w-5xl mx-auto pb-10'>
          {/* Breadcrumbs separation */}
          <div className='px-6 pt-6 mb-4'></div>

          {/* Main Content Wrapper */}
          <div className='flex flex-col gap-6 w-full'>
            {lottery.id === 0 && (
              <div className='flex flex-col items-center justify-center py-20 text-gray-500'>
                <span className='text-4xl mb-4'>🦖</span>
                <h2 className='text-2xl font-bold'>
                  {t('lotteries:lottery_not_found')}
                </h2>
              </div>
            )}

            {/* 1. Header & Info Block */}
            {lottery.id > 0 && (
              <div className='bg-[#FDFBF7] border border-[#F1E4CF] rounded-[18px] p-4 sm:p-6 shadow-sm'>
                {/* Header with Title and Return Button */}
                <div className='flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
                  <h1 className='text-2xl sm:text-3xl font-bold text-gray-800 font-display'>
                    {t('lotteries:lottery_number', {
                      number: lottery?.id.toFixed()
                    })}
                  </h1>
                  {statusBadge}
                  <button
                    onClick={handleReturn}
                    className='text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors flex items-center gap-1'
                  >
                    ← {t('lotteries:return')}
                  </button>
                </div>

                {/* Info Grid: 2 Columns */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Left Column: Creator & Tickets */}
                  <div className='space-y-3'>
                    <div className='flex items-center gap-3 text-gray-700'>
                      <span className='text-xl'>📩</span>
                      <div className='flex flex-col'>
                        <span className='text-xs text-gray-400 uppercase font-bold tracking-wider'>
                          {t('lotteries:owner')}
                        </span>
                        <div className='font-medium'>
                          {lottery?.owner?.address && (
                            <ShortenedAddress
                              address={lottery?.owner?.address}
                              herotag={lottery?.owner?.herotag}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 text-gray-700'>
                      <span className='text-xl'>🎟</span>
                      <div className='flex flex-col'>
                        <span className='text-xs text-gray-400 uppercase font-bold tracking-wider'>
                          {t('lotteries:tickets')}
                        </span>
                        <span className='font-medium text-lg'>
                          <span className='text-dino-yellow font-bold'>
                            {lottery?.tickets_sold.toFixed()}
                          </span>
                          <span className='text-gray-400 text-sm'>
                            {' '}
                            / {lottery?.max_tickets.toFixed()}
                          </span>
                        </span>
                      </div>
                    </div>

                    {lottery.max_per_wallet > 0 && (
                      <div className='flex items-center gap-3 text-gray-700 ml-1'>
                        <span className='text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full'>
                          Max {lottery?.max_per_wallet.toFixed()} / wallet
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Date & Type */}
                  <div className='space-y-3 md:border-l md:border-[#F1E4CF] md:pl-6'>
                    <div className='flex items-center gap-3 text-gray-700'>
                      <span className='text-xl'>⏱</span>
                      <div className='flex flex-col'>
                        <span className='text-xs text-gray-400 uppercase font-bold tracking-wider'>
                          {t('lotteries:start')}
                        </span>
                        <span className='font-medium'>
                          {blockToTime(lottery?.start_time)}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 text-gray-700'>
                      <span className='text-xl'>
                        {lottery.auto_draw ? '🤖' : '🖐️'}
                      </span>
                      <div className='flex flex-col'>
                        <span className='text-xs text-gray-400 uppercase font-bold tracking-wider'>
                          {t('lotteries:mode')}
                        </span>
                        {lottery.auto_draw ? (
                          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 w-fit'>
                            {t('lotteries:auto_draw')}
                          </span>
                        ) : (
                          <span className='font-medium'>
                            {t('lotteries:manual_draw')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Winner Block */}
                {lottery.winner_id > 0 && (
                  <div className='mt-6 pt-6 border-t border-[#F1E4CF]'>
                    <LotteryWinner lottery={lottery} />
                  </div>
                )}

                {/* Description Helper (Owner only) */}
                {lottery?.owner?.address == address && (
                  <div className='mt-4 pt-4 border-t border-[#F1E4CF]'>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() =>
                          setEditingDescription(!editingDescription)
                        }
                        className='text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1'
                      >
                        ✏️ {t('lotteries:edit_description')}
                      </button>
                    </div>
                    <div className='w-full mt-2'>
                      {(editingDescription || lottery.description == '') && (
                        <EditDescription
                          lottery_id={lotteryID}
                          lottery_description={lottery.description}
                        />
                      )}
                    </div>
                  </div>
                )}

                {lottery?.description && (
                  <div className='mt-4 pt-4 border-t border-[#F1E4CF] text-sm text-gray-600'>
                    <SafeMarkdown
                      content={'---\n' + lottery?.description + '\n\n---'}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 4. Bandau de Statut (Status Banner) */}
            {/* 4. Bandau de Statut (Status Banner) - Moved to Header */}
            {/* <div className='flex justify-center'> ... </div> */}

            {/* 2. Winner Block (if exists) */}
            {/* 2. Winner Block (Moved to header) */}

            {/* 3. Ticket & Reward Cards Section */}
            {lottery.id > 0 && (
              <div className='space-y-4'>
                <h2 className='text-xl md:text-2xl font-bold text-center text-gray-800'>
                  {t('lotteries:entry_cost')} & {t('lotteries:prize')}
                </h2>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch'>
                  {/* Ticket Card */}
                  <div className='flex flex-col bg-[#FFFDF8] border border-[#F1E4CF] rounded-[20px] p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden'>
                    <div className='absolute top-4 right-4'>
                      <span className='px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider'>
                        {t('lotteries:ticket_price')}
                      </span>
                    </div>

                    <div className='flex-grow flex flex-col items-center justify-center py-6'>
                      {lottery.price_nonce > 0 ? (
                        <NftDisplay
                          nftInfo={price_nft_information}
                          amount={lottery.price_amount}
                          is_free={['FreeEgld', 'FreeSft', 'FreeEsdt'].includes(
                            lottery.price_type
                          )}
                          is_locked={[
                            'LockedEgld',
                            'LockedSft',
                            'LockedEsdt'
                          ].includes(lottery.price_type)}
                          showAmount={false} // Handle amount separately below
                          showLink={true} // Handle link separately below
                        />
                      ) : (
                        <EsdtDisplay
                          esdtInfo={price_esdt_information}
                          amount={lottery.price_amount}
                          is_free={['FreeEgld', 'FreeSft', 'FreeEsdt'].includes(
                            lottery.price_type
                          )}
                          is_locked={[
                            'LockedEgld',
                            'LockedSft',
                            'LockedEsdt'
                          ].includes(lottery.price_type)}
                        />
                      )}
                    </div>

                    <div className='text-center border-t border-[#F1E4CF] pt-4 mt-2 w-full'>
                      <div className='font-bold text-lg text-gray-800'>
                        <FormatAmount
                          amount={new BigNumber(lottery.price_amount)}
                          identifier={lottery.price_identifier}
                          nonce={lottery.price_nonce}
                        />{' '}
                      </div>
                      {address && (
                        <div className='text-sm text-gray-400 mt-1'>
                          {t('lotteries:your_balance')}:{' '}
                          <span className='font-medium text-gray-600'>
                            <FormatAmount
                              showIdentifier={false}
                              amount={
                                lottery.price_nonce > 0
                                  ? userSftBalance
                                  : lottery.price_identifier == 'EGLD-000000'
                                  ? balance
                                  : userEsdtBalance
                              }
                              identifier={lottery.price_identifier}
                              nonce={lottery.price_nonce}
                            />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prize Card */}
                  <div className='flex flex-col bg-[#FFFDF8] border border-[#F1E4CF] rounded-[20px] p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden'>
                    <div className='absolute top-4 right-4'>
                      <span className='px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold uppercase tracking-wider'>
                        {t('lotteries:prize')}
                      </span>
                    </div>

                    <div className='flex-grow flex flex-col items-center justify-center py-6'>
                      {lottery.prize_nonce > 0 ? (
                        <NftDisplay
                          nftInfo={prize_nft_information}
                          amount={lottery.prize_amount}
                          showAmount={false}
                          showLink={true}
                        />
                      ) : (
                        <EsdtDisplay
                          esdtInfo={prize_esdt_information}
                          amount={lottery.prize_amount}
                        />
                      )}
                    </div>

                    <div className='text-center border-t border-[#F1E4CF] pt-4 mt-2 w-full'>
                      <div className='font-bold text-lg text-gray-800'>
                        <FormatAmount
                          amount={new BigNumber(lottery.prize_amount)}
                          identifier={
                            lottery.prize_identifier
                              ? lottery.prize_identifier
                              : 'EGLD'
                          }
                          nonce={lottery.prize_nonce}
                        />
                      </div>
                      {address && (
                        <div className='text-sm text-gray-400 mt-1'>
                          {t('lotteries:your_balance')}:{' '}
                          <span className='font-medium text-gray-600'>
                            <FormatAmount
                              showIdentifier={false}
                              amount={
                                lottery.prize_nonce > 0
                                  ? userPrizeSftBalance
                                  : lottery.prize_identifier == 'EGLD-000000'
                                  ? balance
                                  : userPrizeEsdtBalance
                              }
                              identifier={
                                lottery.prize_identifier
                                  ? lottery.prize_identifier
                                  : 'EGLD'
                              }
                              nonce={lottery.prize_nonce}
                            />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Actions Zone */}
            <div className='flex flex-col items-center justify-center w-full max-w-2xl mx-auto'>
              {/* Buy Action */}
              {!lottery.cancelled &&
                !lottery.drawn &&
                !lottery.deleted &&
                lottery?.owner?.address != address &&
                lottery.max_tickets.isGreaterThan(lottery.tickets_sold) &&
                timeStart <= 0 && (
                  <div className='w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-4'>
                    <ActionBuy
                      lottery_id={lotteryID}
                      price_identifier={lottery?.price_identifier}
                      price_nonce={lottery.price_nonce}
                      price_amount={new BigNumber(lottery.price_amount)}
                      price_decimals={
                        new BigNumber(
                          lottery?.price_decimals ? lottery?.price_decimals : 0
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
                    {Number(buyed) > 0 && (
                      <p className='text-green-600 font-medium text-sm'>
                        {t('lotteries:you_have_tickets', {
                          number: buyed.toFixed(),
                          s: buyed > 1 ? 's' : ''
                        })}
                      </p>
                    )}
                    {Number(buyed) === 0 && (
                      <div className='bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start sm:items-center gap-3 text-left sm:text-center w-full'>
                        <span className='text-lg'>ℹ️</span>
                        <p className='text-sm text-blue-800 leading-snug'>
                          {t('lotteries:check_collection')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* Owner Actions Buttons Block */}
              {lottery.id > 0 &&
                (lottery?.owner?.address == address ||
                  address ==
                    'erd1x5zq82l0whpawgr53k6y63xh5jq2649k99q49s0508s82w25ytsq7f89my') &&
                !lottery?.deleted && (
                  <div className='w-full mt-6 bg-white/50 backdrop-blur-sm rounded-xl p-4 flex flex-col sm:flex-row items-center justify-center gap-4'>
                    {lottery?.winner_id == 0 && (
                      /* Draw Button (Main) */
                      <div className='flex-1 w-full sm:w-auto'>
                        <ActionDraw
                          lottery_id={lotteryID}
                          disabled={lottery.tickets_sold.isLessThan(1)}
                          tickets={lottery.tickets_sold}
                        />
                      </div>
                    )}

                    {lottery.winner_id != 0 && (
                      <div className='flex-1 w-full sm:w-auto text-center'>
                        <ActionDelete lottery_id={lotteryID} />
                      </div>
                    )}

                    {/* Cancel (Red Outline) - Wrapper div to style it if ActionCancel is a simple button */}
                    {lottery.winner_id == 0 && (
                      <div className='flex-1 w-full sm:w-auto'>
                        <ActionCancel
                          lottery_id={lotteryID}
                          disabled={lottery.tickets_sold.isGreaterThan(50)}
                        />
                        {/* Note: might need to pass style props to ActionCancel or wrap it */}
                      </div>
                    )}

                    {/* Share Ghost Button */}
                    <div className='flex items-center justify-center'>
                      <TwitterShareButton lottery_id={lotteryID} />
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </PageTemplate>
    </PageWrapper>
  );
};
