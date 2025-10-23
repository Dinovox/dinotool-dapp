import { PageWrapper } from 'wrappers';
import { ActionBurn } from './Transaction/ActionBurn';
import './MintSFT.css';
import { useGetAccount } from 'lib';
import { useGetVouchers } from './Transaction/helpers/useGetVouchers';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import TextCopy from 'helpers/textCopy';
import NftDisplay from 'pages/LotteryDetail/NftDisplay';
import { Trans, useTranslation } from 'react-i18next';
import { t } from 'i18next';
import useLoadTranslations from 'hooks/useLoadTranslations';
export const Vouchers = () => {
  const loading = useLoadTranslations('vouchers');
  const { t } = useTranslation();

  const vouchers = useGetVouchers();
  console.log('vouchers', vouchers);
  const { address } = useGetAccount();
  const userNftBalance = useGetUserNFT(address, '', 'VOUCHERS-e6045e');

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
  // helpers au-dessus du composant
  // helpers
  const toInt = (v: unknown) => {
    if (typeof v === 'bigint') return Number(v);
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  };

  const aggregateByNft = (list: any[] = []) => {
    const map = new Map<string, any>();
    for (const it of list) {
      const key = `${it.collection}-${it.nonce ?? ''}`;
      const bal = toInt(it?.balance);
      if (!map.has(key)) map.set(key, { ...it, balance: bal });
      else map.get(key).balance += bal;
    }
    return Array.from(map.values());
  };

  return (
    <PageWrapper>
      <div className='dinocard-wrapper rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
        <div className='mintGazTitle dinoTitle w-[340px]'>Vouchers</div>

        <div className='container w-full'>
          {/* 2 colonnes équilibrées */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-10'>
            {/* COLONNE VOUCHERS */}
            <section className='section'>
              <h2 className='section-title'>{t('vouchers:your_vouchers')}</h2>
              <p className='text-sm opacity-70 mb-5'>
                {t('vouchers:burn_them_to')}
              </p>

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7'>
                {aggregateByNft(filteredNftBalance).map((nft: any) => (
                  <div
                    key={`${nft.collection}-${nft.nonce}`}
                    className='rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-4 flex flex-col'
                  >
                    {/* wrapper image avec ratio & badge */}
                    <div
                      className='relative rounded-xl overflow-hidden bg-gray-50'
                      style={{ aspectRatio: '3 / 4' }}
                    >
                      <NftDisplay
                        nftInfo={nft}
                        amount={1}
                        showLink={false}
                        showAmount={false}
                      />
                      {toInt(nft.balance) > 1 && (
                        <span className='absolute top-2 right-2 text-xs px-2 py-1 bg-black/75 text-white rounded-full'>
                          ×{toInt(nft.balance)}
                        </span>
                      )}
                    </div>

                    {/* action */}
                    <div className='mt-3'>
                      <ActionBurn
                        identifier={nft?.collection}
                        nonce={nft?.nonce}
                        quantity={1}
                        className='dinoButton--block'
                      />
                    </div>
                  </div>
                ))}

                {(!filteredNftBalance ||
                  aggregateByNft(filteredNftBalance).length === 0) && (
                  <div className='col-span-full text-sm text-center opacity-70 border rounded-xl py-10'>
                    {t('vouchers:no_voucher_yet')}
                  </div>
                )}
              </div>
            </section>

            {/* COLONNE CODES */}
            <section className='section'>
              <h2 className='section-title'>{t('vouchers:your_codes')}</h2>
              <div className='text-sm opacity-70 mb-4'>
                <Trans
                  i18nKey='vouchers:use_them_at'
                  components={{
                    bold: <b />,
                    link1: (
                      <a
                        className='underline'
                        href='https://shop.dinovox.com'
                        target='_blank'
                        rel='noopener noreferrer'
                      />
                    )
                  }}
                />
              </div>

              {vouchers.length > 0 ? (
                <ul className='space-y-4'>
                  {vouchers.slice(0, 5).map((voucher: any) => {
                    const created = voucher?.claimed_at
                      ? new Date(voucher.claimed_at).toLocaleDateString()
                      : '—';
                    const expires = '2025-11-30';
                    return (
                      <li
                        key={voucher.tx_hash}
                        className='rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition'
                      >
                        <div className='flex items-center justify-between gap-3'>
                          <div className='flex-1'>
                            <div className='font-medium'>
                              <TextCopy text={voucher.code} />
                            </div>
                            <div className='text-xs mt-1 opacity-70'>
                              {t('vouchers:created')} {created} ·{' '}
                              {t('vouchers:expire')} {expires}
                            </div>
                          </div>
                          <span className='shrink-0 text-sm px-2 py-1 rounded-full border'>
                            {t('vouchers:value')} {voucher.value}€
                          </span>
                        </div>
                        <a
                          href='https://shop.dinovox.com'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center text-sm underline mt-3'
                        >
                          {t('vouchers:use_on_shop')}
                        </a>
                      </li>
                    );
                  })}
                  {vouchers.length > 5 && (
                    <div className='text-xs opacity-70 text-center'>
                      + {vouchers.length - 5} {t('common:more')}
                    </div>
                  )}
                </ul>
              ) : (
                <p className='no-voucher text-sm opacity-70 border rounded-xl py-10 text-center'>
                  {t('vouchers:no_voucher_yet')}
                </p>
              )}
            </section>
          </div>
        </div>

        {/* footer/help */}
        <div className='w-full grid place-items-center'>
          <div className='text-label mx-auto text-xs opacity-60' />
        </div>
      </div>
    </PageWrapper>
  );
};
