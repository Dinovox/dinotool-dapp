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
import { FormatAmount } from 'helpers/api/useGetEsdtInformations';
import { PageTemplate } from 'components/PageTemplate';
import DisplayNftByToken from 'helpers/DisplayNftByToken';
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
  const { hasBuyed, esdtAmount } = useGetUserHasBuyed(
    mintable?.token_identifier
  );

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
      <PageTemplate
        title='DINOGAZETTE'
        breadcrumbItems={[{ label: 'Home', path: '/' }, { label: 'Mint' }]}
        maxWidth='1400px'
      >
        {/* Main Content */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Left Column - NFT Image & Actions */}
          <div className='flex flex-col gap-6'>
            {/* NFT Image Card */}
            <div className='rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-8 shadow-2xl border border-purple-400/20'>
              {/* <div className='bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-4'>
                <h2 className='text-xl font-bold text-gray-900'>
                  {mintable.amount.isGreaterThan(0) ? 'Mint Now' : 'Sold Out'}
                </h2>
              </div> */}
              {mintable && mintable.token_identifier && timeStart <= 60 * 30 ? (
                <div className='mint-image'>
                  {mintable.amount.isGreaterThan(0) ? (
                    <>
                      <DisplayNftByToken
                        tokenIdentifier={mintable.token_identifier}
                        nonce={mintable.nonce}
                      />
                    </>
                  ) : (
                    <img
                      src={sold_graout}
                      className='w-full rounded-2xl shadow-2xl border-4 border-white/20'
                      alt='Sold Out'
                    />
                  )}

                  <div className='p-6'>
                    {mintable.amount.isGreaterThan(0) ? (
                      <>
                        {timeStart > 0 ? (
                          <div className='text-center text-lg text-white'>
                            Mint opens soon...
                          </div>
                        ) : (
                          <>
                            {timeEnd > 0 ? (
                              <ActionBuy
                                price={mintable?.payment_price}
                                balance={
                                  mintable.payment_token == 'EGLD'
                                    ? new BigNumber(balance ? balance : 0)
                                    : esdtAmount
                                }
                                hasBuyed={hasBuyed}
                                payment_token={mintable.payment_token}
                              />
                            ) : (
                              <div className='text-center text-xl font-bold text-white'>
                                Sale ended
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {mintable &&
                          mintable.token_identifier &&
                          new BigNumber(mintable.amount.isEqual).isZero() && (
                            <div className='text-center text-2xl font-bold text-white'>
                              SOLD OUT
                            </div>
                          )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className='text-white text-center py-12 text-lg font-medium animate-pulse'>
                  {displayText}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Info */}
          <div className='flex flex-col gap-6'>
            {/* Info Card */}
            <div className='rounded-3xl bg-white shadow-xl border border-gray-100 overflow-hidden'>
              <div className='bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4'>
                <h2 className='text-xl font-bold text-white'>Mint Details</h2>
              </div>

              {mintable && mintable.token_identifier && timeStart <= 60 * 30 ? (
                <div className='p-6 space-y-3'>
                  {/* Timer Section */}
                  {timeEnd > 0 && timeStart <= 0 && (
                    <div className='flex justify-between items-center p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100'>
                      <span className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                        Ends in
                      </span>
                      <span className='text-2xl font-bold text-red-600'>
                        {formatTime(timeEnd)}
                      </span>
                    </div>
                  )}

                  {timeStart > 0 && (
                    <div className='flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100'>
                      <span className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                        Opens in
                      </span>
                      <span className='text-2xl font-bold text-purple-600'>
                        {formatTime(timeStart)}
                      </span>
                    </div>
                  )}

                  {address && (
                    <div className='flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100'>
                      <span className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                        Your Balance
                      </span>
                      <span className='text-lg font-bold text-purple-700'>
                        {mintable && mintable.payment_token == 'EGLD' ? (
                          <>
                            {Number(
                              new BigNumber(balance).dividedBy(10 ** 18)
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2
                            })}{' '}
                            <span className='text-sm text-gray-600'>
                              {mintable.payment_token}
                            </span>
                          </>
                        ) : (
                          <FormatAmount
                            amount={esdtAmount}
                            identifier={mintable?.payment_token}
                          />
                        )}
                      </span>
                    </div>
                  )}

                  <div className='flex justify-between items-center p-4 bg-gray-50 rounded-xl'>
                    <span className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                      {t('mint:price')}
                    </span>
                    <span className='text-lg font-bold text-gray-900'>
                      <FormatAmount
                        amount={mintable?.payment_price}
                        identifier={mintable?.payment_token}
                      />
                    </span>
                  </div>

                  <div className='flex justify-between items-center p-4 bg-gray-50 rounded-xl'>
                    <span className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                      {t('mint:mint_left')}
                    </span>
                    <span className='text-lg font-bold text-gray-900'>
                      {Number(mintable?.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>

                  {nft_information.supply && (
                    <div className='flex justify-between items-center p-4 bg-gray-50 rounded-xl'>
                      <span className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                        {t('mint:supply')}
                      </span>
                      <span className='text-lg font-bold text-gray-900'>
                        {Number(
                          new BigNumber(nft_information.supply).toFixed()
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                  )}

                  <div className='flex justify-between items-center p-4 bg-gray-50 rounded-xl'>
                    <span className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                      SFT
                    </span>
                    <span className='text-sm font-mono text-gray-600 break-all'>
                      {mintable?.token_identifier}-
                      {toHex(mintable?.nonce.toFixed())}
                    </span>
                  </div>

                  <div className='flex justify-between items-center p-4 bg-gray-50 rounded-xl'>
                    <span className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                      {t('mint:start')}
                    </span>
                    <span className='text-sm text-gray-600'>
                      {blockToTime(mintable?.start_time)}
                    </span>
                  </div>

                  <div className='flex justify-between items-center p-4 bg-gray-50 rounded-xl'>
                    <span className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                      {t('mint:end')}
                    </span>
                    <span className='text-sm text-gray-600'>
                      {blockToTime(mintable?.end_time)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className='p-6 text-center text-gray-500'>
                  Loading mint information...
                </div>
              )}
            </div>
          </div>
        </div>
      </PageTemplate>
    </PageWrapper>
  );
};

const blockToTime = (timestamp: any) => {
  const date = new Date(timestamp * 1000); // Convertir en millisecondes
  return date.toLocaleString(); // Retourner l'heure en format UTC
};
