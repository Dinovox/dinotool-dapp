import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { Transaction } from './Transaction';
import { useGetMintable } from 'pages/Dashboard/widgets/MintGazAbi/hooks';
import { ActionBurn } from './Transaction/ActionBurn';
import { useGetUserHasBuyed } from 'pages/Dashboard/widgets/MintGazAbi/hooks/useGetUserHasBuyed';
import { formatAmount } from 'utils/sdkDappUtils';
import toHex from 'helpers/toHex';
import './MintSFT.css';
import ShortenedAddress from 'helpers/shortenedAddress';
import { useGetAccount } from 'hooks';
import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import sold_graout from 'assets/img/sold_graout.jpg';
import { useGetVouchers } from './Transaction/helpers/useGetVouchers';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import TextCopy from 'helpers/textCopy';
import NftDisplay from 'pages/LotteryDetail/NftDisplay';
import { t } from 'i18next';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { Trans, Translation, useTranslation } from 'react-i18next';

export const Vouchers = () => {
  const loading = useLoadTranslations('vouchers');
  const { t } = useTranslation();

  const vouchers = useGetVouchers();
  console.log('vouchers', vouchers);
  const { balance, address } = useGetAccount();
  const userNftBalance = useGetUserNFT(address);
  const filteredNftBalance = userNftBalance.filter((nft: any) =>
    [
      'SFT-221ca7-06',
      'VOUCHERS-e6045e-04',
      'VOUCHERS-e6045e-05',
      'VOUCHERS-e6045e-06'
    ].includes(nft.identifier)
  );
  console.log('filteredNftBalance', filteredNftBalance);
  // VOUCHERS-e6045e-04
  // VOUCHERS-e6045e-05
  // VOUCHERS-e6045e-06
  //10 25 50

  let value: any = {
    'SFT-221ca7-06': 21,
    'VOUCHERS-e6045e-04': 10,
    'VOUCHERS-e6045e-05': 25,
    'VOUCHERS-e6045e-06': 50
  };

  console.log('userNftBalance', userNftBalance);

  return (
    <AuthRedirectWrapper requireAuth={true}>
      <PageWrapper>
        <div className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          <div className='mintGazTitle dinoTitle' style={{ width: '340px' }}>
            Vouchers
          </div>{' '}
          <div className='container'>
            {/* Section des NFTs */}
            <div className='section'>
              <h2 className='section-title'>{t('vouchers:your_vouchers')}</h2>
              <div className='dinocard'>
                <div>{t('vouchers:burn_them_to')}</div>
                {filteredNftBalance &&
                  filteredNftBalance.map((nft: any) =>
                    Array.from({ length: nft.balance }).map((_, i) => (
                      <div
                        key={`${nft.identifier}-${i}`}
                        className='sub-dinocard'
                      >
                        <NftDisplay
                          nftInfo={nft}
                          amount={1}
                          showLink={false}
                          showAmount={false}
                        />
                        <ActionBurn
                          identifier={nft?.collection}
                          nonce={nft?.nonce}
                          quantity={1}
                        />
                      </div>
                    ))
                  )}
              </div>
            </div>

            {/* Section des Vouchers */}
            <div className='section'>
              <h2 className='section-title'>{t('vouchers:your_codes')}</h2>
              <div className='dinocard'>
                <div>
                  <Trans
                    i18nKey='vouchers:use_them_at'
                    components={{
                      bold: <b />,
                      link1: (
                        <a
                          style={{ color: 'blue' }}
                          href='https://shop.dinovox.com'
                          target='_blank'
                          rel='noopener noreferrer'
                        />
                      )
                    }}
                  />
                </div>

                {vouchers.length > 0 ? (
                  // [...Array(5)].map((_, i) =>
                  vouchers.map((voucher: any) => (
                    <div key={voucher.tx_hash} className='voucher-card'>
                      <div className='voucher-title'>
                        <TextCopy text={voucher.code} />
                      </div>
                      <div className='voucher-value'>
                        {t('vouchers:value')} {voucher.value}€
                      </div>
                      <div className='voucher-value'>
                        {t('vouchers:created')}{' '}
                        {
                          new Date(voucher?.claimed_at)
                            .toISOString()
                            .split('T')[0]
                        }
                      </div>
                      <div className='voucher-value'>
                        {' '}
                        {t('vouchers:expire')} 2025-11-30
                      </div>
                    </div>
                  ))
                ) : (
                  // )
                  <p className='no-voucher'>{t('vouchers:no_voucher_yet')}</p>
                )}
              </div>
            </div>
          </div>
          <div
            style={{ width: '100%', justifyContent: 'center', display: 'grid' }}
          >
            <div className='text-label' style={{ margin: 'auto' }}>
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
