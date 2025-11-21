import { PageWrapper } from 'wrappers';
import { Transaction } from './Transaction';
import { useGetMintable } from 'pages/Dashboard/widgets/MintGazAbi/hooks';
import { ActionBuy } from './Transaction/ActionBuy';
import { useGetUserHasBuyed } from 'pages/Dashboard/widgets/MintGazAbi/hooks/useGetUserHasBuyed';
import { useGetNftInformations } from './Transaction/helpers/useGetNftInformation';
import { useGetAccount } from 'lib';
import toHex from 'helpers/toHex';
import './MintSFT.css';
import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';
import formatTime from 'helpers/formatTime';
import { Breadcrumb } from 'components/ui/Breadcrumb';
const sold_graout = '/assets/img/sold_graout.jpg';

export const Mint = () => {
  const loading = useLoadTranslations('mint');
  const { t } = useTranslation();

  const [timeStart, setTimeStart] = useState(60 * 60);
  const [timeEnd, setTimeEnd] = useState(60 * 60);
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

  const mintable = useGetMintable();
  const { hasBuyed, esdtAmount } = useGetUserHasBuyed();

  const { balance, address } = useGetAccount();

  // console.log('egld:', balance);

  const nft_information = useGetNftInformations(
    mintable?.token_identifier,
    mintable?.nonce?.toFixed()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now() / 1000;
      const newTimeStart = mintable?.start_time - currentTime;
      setTimeStart(newTimeStart > 0 ? Math.floor(newTimeStart) : 0);
      const newTimeEnd = mintable?.end_time - currentTime;
      setTimeEnd(newTimeEnd > 0 ? Math.floor(newTimeEnd) : 0);

      // Empêche le temps restant d'aller en dessous de 0
    }, 1000);

    return () => clearInterval(interval); // Nettoyage de l'intervalle
  }, [mintable]);
  // console.log(mintable);
  // console.log(hasBuyed, esdtAmount);
  // console.log(nft_information);
  return (
    <PageWrapper>
      <div className='flex flex-col w-full max-w-7xl mx-auto'>
        <div className='px-6 pt-6'>
          <Breadcrumb
            items={[{ label: 'Home', path: '/' }, { label: 'Mint' }]}
          />
        </div>
        <div className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full mt-4'>
          <div className='mintGazTitle dinoTitle' style={{ width: '340px' }}>
            DINOGAZETTE
          </div>{' '}
          <div className='dinocard'>
            {mintable && mintable.token_identifier && timeStart <= 60 * 30 ? (
              <>
                <div className='sub-dinocard box-item'>
                  {address && (
                    <div className='info-item'>
                      <span className='text-label'>Wallet:</span>{' '}
                      {mintable && mintable.payment_token == 'EGLD' ? (
                        <>
                          {Number(
                            new BigNumber(balance).dividedBy(10 ** 18)
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2
                          })}
                          {'  '}
                        </>
                      ) : (
                        <>
                          {Number(
                            new BigNumber(esdtAmount).dividedBy(10 ** 18)
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2
                          })}
                          {'  '}
                        </>
                      )}{' '}
                      <span className='identifier'>
                        {' '}
                        {mintable.payment_token}
                      </span>
                    </div>
                  )}
                  <div className='info-item'>
                    <span className='text-label'>{t('mint:price')}: </span>
                    {Number(
                      new BigNumber(mintable?.payment_price).dividedBy(10 ** 18)
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 8
                    })}{' '}
                    <span className='identifier'>
                      {' '}
                      {mintable.payment_token}
                    </span>
                  </div>
                  <div className='info-item'>
                    <span className='text-label'>{t('mint:mint_left')}: </span>{' '}
                    {Number(mintable?.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}{' '}
                  </div>
                  {nft_information.supply && (
                    <div className='info-item'>
                      <span className='text-label'>{t('mint:supply')}: </span>{' '}
                      {Number(
                        new BigNumber(nft_information.supply).toFixed()
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </div>
                  )}

                  <div className='info-item'>
                    <span className='text-label'>SFT: </span>{' '}
                    {mintable?.token_identifier}-
                    {toHex(mintable?.nonce.toFixed())}
                  </div>

                  <div className='info-item'>
                    <span className='text-label'>{t('mint:start')}: </span>{' '}
                    {blockToTime(mintable?.start_time)}{' '}
                  </div>

                  <div className='info-item'>
                    <span className='text-label'>{t('mint:end')}: </span>{' '}
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
                </div>
              </>
            ) : (
              <div className='sub-dinocard'>{displayText}</div>
            )}
          </div>
          <div
            style={{ width: '100%', justifyContent: 'center', display: 'grid' }}
          >
            <div className='text-label' style={{ margin: 'auto' }}>
              {mintable.amount.isGreaterThan(0) ? (
                <>
                  {timeStart > 0 ? (
                    <div>Open in : {formatTime(timeStart)}</div>
                  ) : (
                    <>
                      {timeEnd > 0 ? (
                        <>
                          <ActionBuy
                            price={mintable?.payment_price}
                            balance={new BigNumber(balance ? balance : 0)}
                            hasBuyed={hasBuyed}
                            payment_token={mintable.payment_token}
                          />
                          <div>End in : {formatTime(timeEnd)}</div>
                        </>
                      ) : (
                        <>Sale ended</>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {mintable &&
                    mintable.token_identifier &&
                    new BigNumber(mintable.amount.isEqual).isZero() && (
                      <> SOLD GRAOUT</>
                    )}
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
      </div>
    </PageWrapper>
  );
};

const blockToTime = (timestamp: any) => {
  const date = new Date(timestamp * 1000); // Convertir en millisecondes
  return date.toLocaleString(); // Retourner l'heure en format UTC
};
