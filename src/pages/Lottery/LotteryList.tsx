import React from 'react';
import './LotteryList.css';
import FileDisplay from './FileDisplay';
import { useNavigate } from 'react-router-dom';
import { useGetLottery } from 'pages/Dashboard/widgets/LotteryAbi/hooks';
import { useGetNftInformations } from './Transaction/helpers/useGetNftInformation';
import { useGetEsdtInformations } from './Transaction/helpers/useGetEsdtInformation';
import notFound from './esdtnotfound.svg';

const LotteryCard: React.FC<{ lottery_id: string }> = ({ lottery_id }) => {
  const navigate = useNavigate();
  const lottery = useGetLottery(lottery_id);
  const prize_nft_information = useGetNftInformations(
    lottery?.prize_nonce > 0 ? lottery?.prize_identifier : '',
    lottery?.prize_nonce > 0 ? lottery?.prize_nonce : ''
  );
  const prize_esdt_information = useGetEsdtInformations(
    lottery?.prize_nonce == 0 ? lottery?.prize_identifier : ''
  );

  //   console.log('prize_nft_information', prize_nft_information);
  //   console.log('prize_esdt_information', prize_esdt_information);

  const status =
    lottery.winner !=
    'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu'
      ? 'Ended'
      : lottery.tickets_sold >= lottery.max_tickets ||
        (lottery.end < Date.now() / 1000 && lottery.end > 0)
      ? 'Draw'
      : 'Ongoing';

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
            {status}
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
              width='180px'
              height='184px'
            />
          ) : (
            <FileDisplay
              source={
                prize_esdt_information?.media?.length
                  ? prize_esdt_information?.media[0]?.svgUrl
                  : notFound
              }
              fileType={
                prize_esdt_information?.media?.length
                  ? prize_esdt_information?.media[0]?.fileType
                  : ''
              }
              width='180px'
              height='184px'
            />
          )}

          <div className='p-3 subCard'>
            <h2 className='text-lg font-bold'>
              {' '}
              Lottery #{lottery?.id.toFixed()}
            </h2>
            <p className='text-sm text-gray-600'>
              Tickets:{' '}
              <strong>
                {lottery?.tickets_sold.toFixed()} /{' '}
                {lottery?.max_tickets.toFixed()}{' '}
              </strong>
            </p>

            <p className='text-sm text-gray-600'>
              {lottery.end > 0 && <>End: {blockToTime(lottery?.end)} </>}
            </p>

            <button
              className='smallDinoButton '
              onClick={() => {
                navigate(`/lotteries/${lottery.id}`, { replace: false });
              }}
            >
              Open details
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
      <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
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
