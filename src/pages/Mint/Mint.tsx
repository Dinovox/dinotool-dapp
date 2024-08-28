import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { Transaction } from './Transaction';
import { useGetMintable } from 'pages/Dashboard/widgets/MintGazAbi/hooks';
import { ActionBuy } from './Transaction/ActionBuy';
import { useGetUserHasBuyed } from 'pages/Dashboard/widgets/MintGazAbi/hooks/useGetUserHasBuyed';
import { useGetNftInformations } from './Transaction/helpers/useGetNftInformation';
import { formatAmount } from 'utils/sdkDappUtils';
import toHex from 'helpers/toHex';
import './MintSFT.css';
import ShortenedAddress from 'helpers/shortenedAddress';
import { useGetAccount } from 'hooks';

export const Mint = () => {
  const mintable = useGetMintable();
  const { hasBuyed, esdtAmount } = useGetUserHasBuyed();

  const nft_information = useGetNftInformations(
    mintable?.token_identifier,
    mintable?.nonce?.toFixed()
  );

  console.log(mintable);
  console.log(hasBuyed, esdtAmount);
  console.log(nft_information);
  return (
    <AuthRedirectWrapper requireAuth={true}>
      <PageWrapper>
        <div className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          <div className='mintGazTitle'>
            <img src='/DinoGazTitle.png' alt='Dino Gaz Title' />
          </div>
          {/* <div className='flex items-start sm:items-center h-full sm:w-1/2 sm:bg-center'>
            <div className='flex flex-col gap-2 max-w-[70sch] text-center sm:text-left text-xl font-medium md:text-2xl lg:text-3xl'>
               */}
          <div className='dinocard'>
            <div className='sub-dinocard box-item'>
              <div className='info-item'>
                <span className='text-label'>Wallet:</span>{' '}
                {formatAmount({
                  input: esdtAmount.toFixed(),
                  decimals: 18,
                  digits: 2,
                  showLastNonZeroDecimal: false,
                  addCommas: true
                })}{' '}
                <span className='identifier'> Graou</span>
              </div>
              <div className='info-item'>
                <span className='text-label'>Price: </span>
                {formatAmount({
                  input: mintable?.payment_price?.toFixed(),
                  decimals: 18,
                  digits: 2,
                  showLastNonZeroDecimal: false,
                  addCommas: true
                })}{' '}
                <span className='identifier'> Graou</span>
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
                {mintable?.token_identifier}-{toHex(mintable?.nonce.toFixed())}
              </div>
            </div>
            <div className='sub-dinocard'>
              <div className='mint-image' style={{ margin: 'auto' }}>
                {nft_information?.media?.length > 0 &&
                  nft_information?.media[0]?.url && (
                    <img
                      src={nft_information?.media[0]?.url}
                      // src='https://via.placeholder.com/200' // Remplace cette URL par l'image réelle du SFT
                      alt='SFT'
                    />
                  )}
              </div>
            </div>
            <div>
              {/* <div>
                {' '}
                <h1>Mint DINOGAZETTE</h1>
                
                <p>
                  price :{' '}
                  {formatAmount({
                    input: mintable?.payment_price?.toFixed(),
                    decimals: 18,
                    digits: 2,
                    showLastNonZeroDecimal: false,
                    addCommas: true
                  })}
                </p>
                <p>
                  Mint left :{' '}
                  {formatAmount({
                    input: mintable.amount.toFixed(),
                    decimals: 0,
                    digits: 0,
                    showLastNonZeroDecimal: false,
                    addCommas: true
                  })}
                </p>
                <p>
                  Sft:
                  {mintable?.token_identifier}-
                  {toHex(mintable?.nonce.toFixed())}
                </p>
              </div> */}
              {/* <div className='mint-container'>
                <h1 className='mint-title'>Mint DINOGAZETTE</h1>
                <div className='mint-info'>
                  <button className='mint-button'>Mint with Graou</button> 
                  <div className='text-label' style={{ margin: 'auto' }}>
                    {mintable.amount.isGreaterThan(0) ? (
                      <>LOGIN TO MINT</>
                    ) : (
                      <> SOLD GRAOUT</>
                    )}
                  </div>
                </div>
              </div> */}
            </div>
          </div>
          {/* <div className='h-4/6 bg-mvx-white bg-contain bg-no-repeat w-1/2 bg-center' /> */}
          <div
            style={{ width: '100%', justifyContent: 'center', display: 'grid' }}
          >
            <div className='text-label' style={{ margin: 'auto' }}>
              {mintable.amount.isGreaterThan(0) ? (
                <ActionBuy
                  price={mintable?.payment_price}
                  hasBuyed={hasBuyed}
                />
              ) : (
                <> SOLD GRAOUT</>
              )}
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
