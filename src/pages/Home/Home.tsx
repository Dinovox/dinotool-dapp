import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { Transaction } from './Transaction';
import { useGetMintable } from 'pages/Dashboard/widgets/MintGazAbi/hooks';
import { ActionBuy } from './../Mint/Transaction/ActionBuy';
import { useGetNftInformations } from './../Mint/Transaction/helpers/useGetNftInformation';
import { formatAmount } from 'utils/sdkDappUtils';
import toHex from 'helpers/toHex';
import './../Mint/MintSFT.css';
import { useGetIsLoggedIn } from 'hooks';
import { MxLink } from 'components';
import { RouteNamesEnum } from 'localConstants';
import { useEffect, useState } from 'react';
import sold_graout from 'assets/img/sold_graout.jpg';

export const Home = () => {
  const [displayText, setDisplayText] = useState('');
  const fullText = 'Impression... 🦖... GRAOU!🦖';
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

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

  const mintable = useGetMintable();
  const nft_information = useGetNftInformations(
    mintable?.token_identifier,
    mintable?.nonce?.toFixed()
  );
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now() / 1000;
      const newTimeLeft = mintable?.start_time - currentTime;
      setTimeLeft(newTimeLeft > 0 ? Math.floor(newTimeLeft) : 0); // Empêche le temps restant d'aller en dessous de 0
    }, 1000);

    return () => clearInterval(interval); // Nettoyage de l'intervalle
  }, [mintable]);
  return (
    <AuthRedirectWrapper requireAuth={false}>
      <PageWrapper>
        <div className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          <div className='mintGazTitle dinoTitle' style={{ width: '340px' }}>
            Mint DINOGAZETTE
          </div>
          <div className='dinocard'>
            {mintable && mintable.token_identifier && timeLeft <= 60 * 30 ? (
              <>
                <div className='sub-dinocard box-item'>
                  <div className='info-item'>
                    <span className='text-label'>Price: </span>
                    {formatAmount({
                      input: mintable?.payment_price?.toFixed(),
                      decimals: 18,
                      digits: 2,
                      showLastNonZeroDecimal: false,
                      addCommas: true
                    })}{' '}
                    <span className='identifier'>
                      {' '}
                      {mintable.payment_token}
                    </span>
                  </div>
                  <div className='info-item'>
                    <span className='text-label'>Mint left: </span>{' '}
                    {formatAmount({
                      input: mintable.amount.toFixed(),
                      decimals: 0,
                      digits: 0,
                      showLastNonZeroDecimal: false,
                      addCommas: true
                    })}
                  </div>
                  {nft_information.supply && (
                    <div className='info-item'>
                      <span className='text-label'>Supply: </span>{' '}
                      {formatAmount({
                        input: nft_information.supply,
                        digits: 0,
                        decimals: 0,
                        showLastNonZeroDecimal: false,
                        addCommas: true
                      })}
                    </div>
                  )}

                  <div className='info-item'>
                    <span className='text-label'>SFT: </span>{' '}
                    {mintable?.token_identifier}-
                    {toHex(mintable?.nonce.toFixed())}
                  </div>

                  <div className='info-item'>
                    <span className='text-label'>Start: </span>{' '}
                    {blockToTime(mintable?.start_time)}{' '}
                  </div>

                  <div className='info-item'>
                    <span className='text-label'>End: </span>{' '}
                    {blockToTime(mintable?.end_time)}{' '}
                  </div>
                </div>
                <div className='sub-dinocard'>
                  <div className='mint-image' style={{ margin: 'auto' }}>
                    {mintable.amount.isGreaterThan(0) ? (
                      <>
                        {nft_information?.media?.length > 0 &&
                          nft_information?.media[0]?.url && (
                            <img
                              src={nft_information?.media[0]?.url}
                              alt='SFT'
                            />
                          )}
                      </>
                    ) : (
                      <img src={sold_graout} className='mint-image' />
                    )}
                  </div>
                </div>{' '}
              </>
            ) : (
              <div className='sub-dinocard'>{displayText}</div>
            )}
          </div>
          <div
            style={{ width: '100%', justifyContent: 'center', display: 'grid' }}
          >
            {timeLeft > 0 && <div>Ouverture dans : {formatTime(timeLeft)}</div>}
            <MxLink
              className='dinoButton  rounded-lg px-3 py-2 text-center hover:no-underline my-0 bg-blue-600 '
              to={RouteNamesEnum.unlock}
            >
              Connect
            </MxLink>
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
