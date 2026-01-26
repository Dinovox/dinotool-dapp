import { PageWrapper } from 'wrappers';
import { useGetAccount, useGetNetworkConfig } from 'lib';
import toHex from 'helpers/toHex';
import './DinoGazette.css';
import { useEffect, useState, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';
import formatTime from 'helpers/formatTime';
import { Breadcrumb } from 'components/ui/Breadcrumb';
import { FormatAmount } from 'helpers/api/useGetEsdtInformations';
import { PageTemplate } from 'components/PageTemplate';
import DisplayNftByToken from 'helpers/DisplayNftByToken';
import { useGetFullAuctionData } from 'contracts/dinauction/helpers/useGetFullAuctionData';
import { useGetUserPurchasedAmount } from 'contracts/dinauction/helpers/useGetUserPurchasedAmount';
import { ActionBuySft } from 'contracts/dinauction/actions/ActionBuySft';
import { useGetNftInformations } from 'pages/Mint/Transaction/helpers/useGetNftInformation';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import { useGetEsdtInformations } from 'helpers/api/useGetEsdtInformations';

const sold_graout = '/assets/img/sold_graout.jpg';

export const DinoGazette = () => {
  const loading = useLoadTranslations('mint');
  useLoadTranslations('marketplace');
  const { t } = useTranslation();
  const { address, balance } = useGetAccount();

  // Constant Auction ID
  const AUCTION_ID = '0';

  const { auction: rawAuction } = useGetFullAuctionData(AUCTION_ID);

  const tokenIdentifier =
    rawAuction?.auctioned_tokens?.token_identifier?.toString();
  const tokenNonce =
    rawAuction?.auctioned_tokens?.token_nonce?.toString() || '0';

  const nft_information = useGetNftInformations(tokenIdentifier, tokenNonce);

  const [timeStart, setTimeStart] = useState(0);
  const [timeEnd, setTimeEnd] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const fullText = t('mint:printing_text');

  // Text writer effect
  useEffect(() => {
    const characters = Array.from(fullText);
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

  // Times effect
  useEffect(() => {
    if (!rawAuction) return;
    const interval = setInterval(() => {
      const currentTime = Date.now() / 1000;
      const start = Number(rawAuction.start_time || 0);
      const end = Number(rawAuction.deadline || 0);

      const newTimeStart = start - currentTime;
      setTimeStart(newTimeStart > 0 ? Math.floor(newTimeStart) : 0);
      const newTimeEnd = end - currentTime;
      setTimeEnd(newTimeEnd > 0 ? Math.floor(newTimeEnd) : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [rawAuction]);

  // Data Calculations
  const paymentToken = rawAuction?.payment_token?.toString() || 'EGLD';
  const minBid = rawAuction?.min_bid
    ? new BigNumber(rawAuction.min_bid)
    : new BigNumber(0);

  // Max per wallet & Purchased amount
  const { purchasedAmount } = useGetUserPurchasedAmount(AUCTION_ID, address);
  const maxPerWallet = rawAuction?.max_per_wallet
    ? new BigNumber(rawAuction.max_per_wallet)
    : null;

  const remainingAllowed = useMemo(() => {
    if (!maxPerWallet) return null;
    if (maxPerWallet.lte(0)) return null;
    const purchased = purchasedAmount || new BigNumber(0);
    return maxPerWallet.minus(purchased);
  }, [maxPerWallet, purchasedAmount]);

  const isLimitReached = remainingAllowed !== null && remainingAllowed.lte(0);

  // User Balance check
  const userEsdt = useGetUserESDT();
  const paymentTokenInfo = useGetEsdtInformations(paymentToken);

  const buyerBalance = useMemo(() => {
    if (!address) return new BigNumber(0);
    if (paymentToken === 'EGLD') {
      return new BigNumber(balance || 0);
    }
    const token = userEsdt.find(
      (item: any) => item.identifier === paymentToken
    );
    return new BigNumber(token?.balance || 0);
  }, [address, paymentToken, userEsdt, balance]);

  const hasEnoughFunds = minBid.lte(buyerBalance);

  // Supply logic
  const currentSupply = rawAuction?.auctioned_tokens?.amount
    ? new BigNumber(rawAuction.auctioned_tokens.amount)
    : new BigNumber(0);
  const isSoldOut = currentSupply.lte(0);

  return (
    <PageWrapper>
      <PageTemplate
        title='DINOGAZETTE'
        breadcrumbItems={[
          { label: 'Home', path: '/' },
          { label: 'DinoGazette' }
        ]}
        maxWidth='1400px'
      >
        <div className='gazette-wrapper'>
          <div className='gazette-card'>
            {/* Visual Column */}
            <div className='gazette-visual-col'>
              <div className='gazette-image-frame'>
                {tokenIdentifier ? (
                  timeStart > 0 ? (
                    <div className='gazette-prompter'>{displayText}</div>
                  ) : !isSoldOut ? (
                    <DisplayNftByToken
                      tokenIdentifier={tokenIdentifier}
                      nonce={tokenNonce}
                    />
                  ) : (
                    <div className='relative'>
                      <img src={sold_graout} alt='Sold Out' />
                      <div className='stamp-overlay'>{t('mint:sold_out')}</div>
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
                  tokenIdentifier={tokenIdentifier}
                  nonce={tokenNonce}
                  variant='name-only'
                />
              </div>
            </div>

            {/* Info Column */}
            <div className='gazette-info-col'>
              <div className='gazette-header'>
                <h2 className='gazette-headline'>
                  {timeStart > 0
                    ? t('mint:coming_soon')
                    : !isSoldOut
                    ? t('mint:minting_now')
                    : t('mint:edition_closed')}
                </h2>
                <div className='gazette-subhead'>
                  {t('mint:vol')} {tokenNonce} —{' '}
                  <DisplayNftByToken
                    tokenIdentifier={tokenIdentifier}
                    nonce={tokenNonce}
                    variant='name-only'
                  />
                </div>
              </div>

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
                      amount={minBid.toFixed()}
                      identifier={paymentToken}
                      withPrice
                    />
                  </div>
                </div>

                {/* Remaining Supply */}
                <div className='gazette-info-box'>
                  <div className='gazette-box-label'>
                    <span>📦</span> {t('mint:remaining')}
                  </div>
                  <div className='gazette-box-value'>
                    {currentSupply.toFormat()}
                  </div>
                </div>

                {/* Total Supply */}
                <div className='gazette-info-box'>
                  <div className='gazette-box-label'>
                    <span>📦</span> {t('mint:total_supply')}
                  </div>
                  <div className='gazette-box-value'>
                    {nft_information && nft_information.supply
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
                      <FormatAmount
                        amount={buyerBalance.toFixed()}
                        identifier={paymentToken}
                        withPrice
                      />
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
                    {blockToTime(rawAuction?.start_time)}
                  </div>
                </div>

                <div className='gazette-info-box'>
                  <div className='gazette-box-label'>
                    <span>🗓️</span> {t('mint:end_date')}
                  </div>
                  <div
                    className='gazette-box-value'
                    style={{ fontSize: '16px' }}
                  >
                    {blockToTime(rawAuction?.deadline)}
                  </div>
                </div>
              </div>

              {/* SFT Buy Action */}
              <div className='gazette-actions mt-6'>
                <div className='flex flex-col gap-4 w-full'>
                  {!isSoldOut && timeStart <= 0 && timeEnd > 0 && (
                    <div className='flex items-center gap-2 justify-center'>
                      {/* Quantity Input Hidden */}
                    </div>
                  )}

                  {isLimitReached ? (
                    <div className='w-full rounded-md bg-red-50 p-2 text-xs text-center text-red-600 border border-red-200'>
                      {t('marketplace:max_per_wallet_reached')}
                    </div>
                  ) : !isSoldOut && timeStart <= 0 && timeEnd > 0 ? (
                    <ActionBuySft
                      auctionId={new BigNumber(AUCTION_ID)}
                      nftType={tokenIdentifier || ''}
                      nftNonce={tokenNonce}
                      buyStepAmount={new BigNumber(1)}
                      paymentToken={paymentToken}
                      paymentAmount={minBid}
                      disabled={!hasEnoughFunds}
                    />
                  ) : (
                    <button
                      disabled
                      className='mint-button opacity-50 cursor-not-allowed'
                    >
                      {timeStart > 0
                        ? t('mint:please_wait')
                        : t('mint:sold_out')}
                    </button>
                  )}

                  {!hasEnoughFunds && (
                    <div className='text-xs text-red-500 text-center'>
                      {t('marketplace:insufficient_funds')}
                    </div>
                  )}
                </div>
              </div>
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
