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
  const fullText = t('mint:printing_text');
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
  }, [fullText]);

  const mintable = useGetMintable();
  const { hasBuyed, esdtAmount } = useGetUserHasBuyed(mintable?.payment_token);

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
        {/* Main Content: Vintage Gazette Layout */}
        <div className='gazette-wrapper'>
          <div className='gazette-card'>
            {hasBuyed ? (
              <div className='gazette-visual-col full-width'>
                <div className='gazette-image-frame full-width'>
                  <DisplayNftByToken
                    tokenIdentifier={mintable?.token_identifier}
                    nonce={mintable?.nonce}
                    className='w-full h-full'
                  />
                </div>
              </div>
            ) : (
              <>
                {' '}
                {/* LEFT PANEL: Visual / Artwork */}
                <div className='gazette-visual-col'>
                  <div className='gazette-image-frame'>
                    {mintable && mintable.token_identifier ? (
                      timeStart > 0 ? (
                        <div className='gazette-prompter'>{displayText}</div>
                      ) : mintable.amount.isGreaterThan(0) ? (
                        <DisplayNftByToken
                          tokenIdentifier={mintable.token_identifier}
                          nonce={mintable.nonce}
                        />
                      ) : (
                        <div className='relative'>
                          <img src={sold_graout} alt='Sold Out' />
                          <div className='stamp-overlay'>
                            {t('mint:sold_out')}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className='p-12 text-center text-gray-400'>
                        {t('mint:loading_plate')}
                      </div>
                    )}
                  </div>
                  <div className='gazette-caption'>
                    <DisplayNftByToken
                      tokenIdentifier={mintable?.token_identifier}
                      nonce={mintable?.nonce}
                      variant='name-only'
                    />{' '}
                  </div>
                </div>
                {/* RIGHT PANEL: The Article / Info */}
                <div className='gazette-info-col'>
                  <div className='gazette-header'>
                    <h2 className='gazette-headline'>
                      {timeStart > 0
                        ? t('mint:coming_soon')
                        : timeEnd > 0
                        ? t('mint:minting_now')
                        : t('mint:edition_closed')}
                    </h2>
                    <div className='gazette-subhead'>
                      {t('mint:vol')} {mintable?.nonce?.toFixed() || '1'} —{' '}
                      <DisplayNftByToken
                        tokenIdentifier={mintable?.token_identifier}
                        nonce={mintable?.nonce}
                        variant='name-only'
                      />
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className='gazette-info-grid'>
                    {/* Timer */}
                    <div className='gazette-info-box'>
                      <div className='gazette-box-label'>
                        <span>⏳</span>{' '}
                        {timeStart > 0 ? t('mint:opens_in') : t('mint:ends_in')}
                      </div>
                      <div className='gazette-box-value large'>
                        {timeStart > 0
                          ? formatTime(timeStart)
                          : timeEnd > 0
                          ? formatTime(timeEnd)
                          : t('mint:closed')}
                      </div>
                    </div>

                    {/* Price */}
                    <div className='gazette-info-box'>
                      <div className='gazette-box-label'>
                        <span>🏷️</span> {t('mint:price')}
                      </div>
                      <div className='gazette-box-value'>
                        <FormatAmount
                          amount={mintable?.payment_price}
                          identifier={mintable?.payment_token}
                          withPrice
                        />
                      </div>
                    </div>

                    {/* Supply */}
                    <div className='gazette-info-box'>
                      <div className='gazette-box-label'>
                        <span>📦</span> {t('mint:remaining')}
                      </div>
                      <div className='gazette-box-value'>
                        {Number(mintable?.amount).toLocaleString()}
                      </div>
                    </div>

                    {/* Total */}
                    <div className='gazette-info-box'>
                      <div className='gazette-box-label'>
                        <span>📦</span> {t('mint:total_supply')}
                      </div>
                      <div className='gazette-box-value'>
                        {nft_information.supply
                          ? Number(
                              new BigNumber(nft_information.supply).toFixed()
                            ).toLocaleString()
                          : '-'}
                      </div>
                    </div>

                    {/* Balance */}
                    {address && (
                      <div className='gazette-info-box'>
                        <div className='gazette-box-label'>
                          <span>💰</span> {t('mint:your_balance')}
                        </div>
                        <div className='gazette-box-value'>
                          {mintable && mintable.payment_token == 'EGLD' ? (
                            <>
                              {Number(
                                new BigNumber(balance).dividedBy(10 ** 18)
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2
                              })}{' '}
                              <span className='text-sm'>
                                {mintable.payment_token}
                              </span>
                            </>
                          ) : (
                            <FormatAmount
                              amount={esdtAmount}
                              identifier={mintable?.payment_token}
                              withPrice
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className='gazette-info-box'>
                      <div className='gazette-box-label'>
                        <span>🗓️</span> {t('mint:start_date')}
                      </div>
                      <div
                        className='gazette-box-value'
                        style={{ fontSize: '16px' }}
                      >
                        {blockToTime(mintable?.start_time)}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className='gazette-info-box'>
                      <div className='gazette-box-label'>
                        <span>🗓️</span> {t('mint:end_date')}
                      </div>
                      <div
                        className='gazette-box-value'
                        style={{ fontSize: '16px' }}
                      >
                        {blockToTime(mintable?.end_time)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='gazette-actions'>
                    {mintable &&
                    mintable.amount.isGreaterThan(0) &&
                    timeStart <= 0 &&
                    timeEnd > 0 ? (
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
                      <button disabled className='mint-button'>
                        {timeStart > 0
                          ? t('mint:please_wait')
                          : t('mint:sold_out')}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
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
