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
import NftDisplay from 'pages/Lottery/NftDisplay';

export const Vouchers = () => {
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
  function handleBurn(nft: any): void {
    throw new Error('Function not implemented.');
  }

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
              <h2 className='section-title'>Your Vouchers</h2>
              <div className='dinocard'>
                <div>Burn them to reavel final shop's codes</div>
                {filteredNftBalance &&
                  filteredNftBalance.map((nft: any) => (
                    <>
                      <div key={nft.identifier} className='sub-dinocard'>
                        <NftDisplay nftInfo={nft} amount={nft?.balance} />
                        <ActionBurn
                          identifier={nft?.collection}
                          nonce={nft?.nonce}
                          quantity={nft?.balance}
                        />
                      </div>
                    </>
                  ))}{' '}
              </div>
            </div>

            {/* Section des Vouchers */}
            <div className='section'>
              <h2 className='section-title'>Your codes</h2>
              <div className='dinocard'>
                <div>
                  Use them at{' '}
                  <a
                    href='https://shop.dinovox.com'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    shop.dinovox.com
                  </a>
                </div>

                {vouchers.length > 0 ? (
                  [...Array(5)].map((_, i) =>
                    vouchers.map((voucher: any) => (
                      <div key={voucher.tx_hash} className='voucher-card'>
                        <div className='voucher-title'>
                          <TextCopy text={voucher.code} />
                        </div>
                        <div className='voucher-value'>
                          Value: {voucher.value}€
                        </div>
                        <div className='voucher-status'>
                          Created:{' '}
                          {
                            new Date(voucher?.claimed_at)
                              .toISOString()
                              .split('T')[0]
                          }
                        </div>
                        <div className='voucher-status'>Expire: 2025-11-30</div>
                      </div>
                    ))
                  )
                ) : (
                  <p className='no-voucher'>
                    No vouchers yet. Burn an NFT to reveal one!
                  </p>
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
