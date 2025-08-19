import React, { useEffect, useState } from 'react';
import './LotteryList.css';
import FileDisplay from './FileDisplay';
import { useNavigate } from 'react-router-dom';
import { useGetLottery } from 'pages/Dashboard/widgets/LotteryAbi/hooks';
import { useGetNftInformations } from './Transaction/helpers/useGetNftInformation';
import { useGetEsdtInformations } from './Transaction/helpers/useGetEsdtInformation';
import notFound from './esdtnotfound.svg';
import dayjs from 'dayjs';
import BigNumber from 'bignumber.js';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';
import formatTime from 'helpers/formatTime';
import { useGetAccountInfo } from 'lib';

const LotteryCard: React.FC<{ lottery_id: string }> = ({ lottery_id }) => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();
  const { address, account } = useGetAccountInfo();

  const [timeStart, setTimeStart] = useState(0);
  const [timeEnd, setTimeEnd] = useState(0);

  const navigate = useNavigate();
  const lottery = useGetLottery(lottery_id);
  const prize_nft_information = useGetNftInformations(
    lottery?.prize_nonce > 0 ? lottery?.prize_identifier : '',
    lottery?.prize_nonce > 0 ? lottery?.prize_nonce : ''
  );
  const prize_esdt_information = useGetEsdtInformations(
    lottery?.prize_nonce == 0 ? lottery?.prize_identifier : ''
  );

  const status =
    lottery.winner_id > 0
      ? 'ended'
      : lottery?.tickets_sold?.isGreaterThanOrEqualTo(lottery.max_tickets) ||
        (lottery?.end_time.isLessThan(Date.now() / 1000) &&
          lottery.end_time > 0)
      ? 'draw'
      : 'ongoing';

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now() / 1000;
      const newTimeStart = lottery?.start_time - currentTime;
      setTimeStart(newTimeStart > 0 ? Math.floor(newTimeStart) : 0);
      // Empêche le temps restant d'aller en dessous de 0
      const newTimeEnd = lottery?.end_time - currentTime;
      setTimeEnd(newTimeEnd > 0 ? Math.floor(newTimeEnd) : 0);
    }, 1000);

    return () => clearInterval(interval); // Nettoyage de l'intervalle
  }, [lottery]);
  return (
    <>
      {lottery.id > 0 && (
        <div
          className='cardMesNFT relative bg-white border-gray-200 d-nav-card '
          style={{ cursor: 'pointer' }}
          onClick={() => {
            navigate(`/lotteries/${lottery.id}`, { replace: false });
          }}
        >
          <span
            className={`buttonStatus ${
              lottery.status === 'ongoing' ? 'bg-yellow-400' : 'bg-orange-500'
            }`}
          >
            {t('lotteries:status_' + status.toLowerCase())}
          </span>
          {lottery.prize_nonce > 0 ? (
            <FileDisplay
              source={
                prize_nft_information?.media?.length
                  ? prize_nft_information?.media[0]?.url
                  : notFound
              }
              fileType={
                prize_nft_information?.media?.length
                  ? prize_nft_information?.media[0]?.fileType
                  : ''
              }
              width='168px'
              height='168px'
            />
          ) : (
            <FileDisplay
              source={
                prize_esdt_information?.assets?.svgUrl
                  ? prize_esdt_information?.assets?.svgUrl
                  : prize_esdt_information?.media?.length
                  ? prize_esdt_information?.media[0]?.svgUrl
                  : notFound
              }
              fileType={
                prize_esdt_information?.media?.length
                  ? prize_esdt_information?.media[0]?.fileType
                  : ''
              }
              width='168px'
              height='168px'
            />
          )}

          <div className='subCard'>
            <h2 className='text-lg font-bold'>
              {' '}
              {t('lotteries:lottery_number', { number: lottery?.id.toFixed() })}
            </h2>

            <p className='text-sm text-gray-600'>
              {t('lotteries:tickets')}:{' '}
              <strong>
                {lottery?.tickets_sold.toFixed()} /{' '}
                {lottery?.max_tickets.toFixed()}{' '}
              </strong>
            </p>
            {timeStart > 0 && (
              <div>
                {t('lotteries:open_in', {
                  time: formatTime(timeStart)
                })}
              </div>
            )}
            {timeStart == 0 && (
              <div>
                {lottery.end_time > 0 ? (
                  <>
                    {' '}
                    {t('lotteries:end_in', {
                      time: formatTime(timeEnd)
                    })}
                  </>
                ) : (
                  <>
                    {' '}
                    {t('lotteries:end_in', {
                      time: '∞'
                    })}
                  </>
                )}
              </div>
            )}
            {timeStart == 0 &&
              lottery.end_time.isGreaterThan(0) &&
              timeEnd == 0 && <div>{t('lotteries:expired')}</div>}

            <button
              className='smallDinoButton '
              onClick={() => {
                navigate(`/lotteries/${lottery.id}`, { replace: false });
              }}
            >
              {lottery?.vm_owner == address || lottery.winner_id > 0
                ? t('lotteries:view_details')
                : t('lotteries:open_details')}{' '}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const LotteryList = ({ runningLottery }: any) => {
  // runningLottery = runningLottery.slice(-4).reverse();
  // endedLottery = endedLottery.slice(-4).reverse();
  return (
    <div className='bg-[#fefaf5] pt-6 flex justify-center pb-6 mb-6 '>
      <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2'>
        {runningLottery.map((lottery_id: any) => (
          <LotteryCard key={lottery_id} lottery_id={lottery_id} />
        ))}{' '}
      </div>
    </div>
  );
};

export default LotteryList;

const blockToTime = (timestamp: any) => {
  const date = new Date(timestamp * 1000); // Convertir en millisecondes
  return date.toLocaleDateString(); // Retourner la date sans les heures, minutes et secondes
};
