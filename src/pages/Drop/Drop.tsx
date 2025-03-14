import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { Transaction } from './Transaction';
import { useGetMintable } from 'pages/Dashboard/widgets/MintGazAbi/hooks';
import { ActionBuy } from './Transaction/ActionBuy';
import { useGetNftInformations } from './Transaction/helpers/useGetNftInformation';
import { formatAmount } from 'utils/sdkDappUtils';
import toHex from 'helpers/toHex';
import './MintSFT.css';
import ShortenedAddress from 'helpers/shortenedAddress';
import { useGetAccount, useGetAccountInfo } from 'hooks';
import { useEffect, useState } from 'react';
import { addressIsValid } from '@multiversx/sdk-dapp/utils/account';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import BigNumber from 'bignumber.js';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import { FormatAmount } from 'components';
import { useGetDinoHolders } from './Transaction/helpers/useGetDinoHolders';
import { useGetDinoStakers } from './Transaction/helpers/useGetDinoStakers';
import { cp } from 'fs';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { Trans, useTranslation } from 'react-i18next';

export const Drop = () => {
  const loading = useLoadTranslations('drop');
  const { t } = useTranslation();

  const dinobox_holders = useGetDinoHolders('DINOBOX-54d57b');
  const dinovox_holders = useGetDinoHolders('DINOVOX-cb2297');
  const dinovox_stakers = useGetDinoStakers();
  const [addresses, setAddresses] = useState('');
  const [validAddresses, setValidAddresses] = useState([]);
  const [invalidAddresses, setInvalidAddresses] = useState([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState<BigNumber>(
    new BigNumber(0)
  );
  const [batches, setBatches] = useState([]);
  const [submitted, setSubmitted] = useState(false); // Nouvel état pour gérer la soumission
  const { address } = useGetAccountInfo();
  const [selectedNFT, setSelectedNFT] = useState<any>({
    identifier: '',
    collection: '',
    nonce: new BigNumber(0),
    balance: new BigNumber(0),
    decimals: new BigNumber(0)
  });
  const [defaultQty, setDefaultQty] = useState<BigNumber>(new BigNumber(1));
  const [decimals, setDecimals] = useState<BigNumber>(new BigNumber(0));
  const [useDecimals, setUseDecimals] = useState(true);
  const [boxHolders, setBoxHolders] = useState(false);
  const [voxHolders, setVoxHolders] = useState(false);
  const [voxStakers, setVoxStakers] = useState(false);

  const userNftBalance = useGetUserNFT(address);
  const userEsdtBalance = useGetUserESDT();

  const handleSubmit = () => {
    setSubmitted(true);
  };
  const handleNFT = (event: any) => {
    const value = event.target.value;

    if (value) {
      const [identifier, collection, nonce, balance, decimals] =
        value.split('|');

      setSelectedNFT({
        identifier,
        collection,
        nonce: new BigNumber(nonce),
        balance: new BigNumber(balance),
        decimals: new BigNumber(decimals)
      });
      setDecimals(new BigNumber(decimals));
    }
    setSubmitted(false);
  };

  const handleAddressChange = (e: any) => {
    if (submitted) {
      return;
    }
    const input = e.target.value;
    setAddresses(input);

    // Divise l'entrée en lignes séparées par des retours à la ligne
    const addressList = input
      .split(/\s*[;\n]+\s*/)
      .map((line: any) => line.trim());

    const newValidAddresses: any = [];
    const newInvalidAddresses: any = [];
    const seenAddresses = new Set();

    let validCountTemp = 0;
    let invalidCountTemp = 0;
    let totalQuantityTemp = new BigNumber(0);

    addressList.forEach((line: any) => {
      if (!line) return;
      const [address, quantity] = line.split(/\s+/);

      if (addressIsValid(address)) {
        if (address.startsWith('erd1qqqqqqqqqqq')) {
          invalidCountTemp++;
          newInvalidAddresses.push(`${line} ${t('drop:invalid_sc')}`);
        } else if (seenAddresses.has(address)) {
          invalidCountTemp++;
          newInvalidAddresses.push(`${line} ${t('drop:invalid_duplicate')}`);
        } else {
          validCountTemp++;
          let qty = quantity
            ? new BigNumber(quantity.replace(',', '.'))
            : defaultQty;

          if (useDecimals && decimals.gt(0)) {
            qty = qty.multipliedBy(10 ** decimals.toNumber());
          }

          newValidAddresses.push({
            address,
            quantity: qty
          });
          totalQuantityTemp = totalQuantityTemp.plus(qty);
          seenAddresses.add(address);
        }
      } else {
        invalidCountTemp++;
        newInvalidAddresses.push(`${line} ${t('drop:invalid_format')}`);
      }

      // Découpe des adresses valides en chunks
      const chunkSize = 100;
      const chunks: any = [];
      for (let i = 0; i < newValidAddresses.length; i += chunkSize) {
        const chunk = newValidAddresses.slice(i, i + chunkSize);

        let batchQuantity = new BigNumber(
          chunk.reduce(
            (sum: BigNumber, entry: any) =>
              sum.plus(new BigNumber(entry.quantity)),
            new BigNumber(0)
          )
        );
        chunks.push({
          addresses: chunk,
          txHash: '',
          status: 'pending',
          totalQuantity: batchQuantity
        });
      }
      setBatches(chunks);
    });

    // Mettre à jour les états des adresses valides et invalides

    setValidCount(validCountTemp);
    setInvalidCount(invalidCountTemp);
    setTotalQuantity(totalQuantityTemp);
    setValidAddresses(newValidAddresses);
    setInvalidAddresses(newInvalidAddresses);
  };

  useEffect(() => {
    if (submitted) {
      return;
    }
    const uniqueAddressesSet = new Set<string>();

    // Ajouter les adresses de dinobox_holder si boxHolders est coché
    if (boxHolders && dinobox_holders && dinobox_holders.length > 0) {
      dinobox_holders
        .map((holder: any) => holder.address)
        .filter((address: string) => !address.startsWith('erd1qqqqqqqqqq')) // Filtrer les SC
        .forEach((address: any) => uniqueAddressesSet.add(address));
    }

    if (voxStakers && dinovox_stakers && dinovox_stakers.length > 0) {
      dinovox_stakers
        .map((staker: any) => staker.address)
        .filter((address: string) => !address.startsWith('erd1qqqqqqqqqq')) // Filtrer les SC
        .forEach((address: any) => uniqueAddressesSet.add(address));
    }

    // Ajouter les adresses de dinovox_holder si voxHolders est coché
    if (voxHolders && dinovox_holders && dinovox_holders.length > 0) {
      dinovox_holders
        .map((holder: any) => holder.address)
        .filter((address: string) => !address.startsWith('erd1qqqqqqqqqq')) // Filtrer les SC
        .forEach((address: any) => uniqueAddressesSet.add(address));
    }

    // Joindre les adresses uniques avec un retour à la ligne
    const addressesString = Array.from(uniqueAddressesSet).join('\n');
    if (addressesString) {
      setAddresses(addressesString);
    }
    const handler = setTimeout(() => {
      handleAddressChange({ target: { value: addresses } });
    }, 300); // Délai de 300ms

    return () => {
      clearTimeout(handler);
    };
  }, [
    addresses,
    useDecimals,
    decimals,
    defaultQty,
    voxStakers,
    boxHolders,
    voxHolders
  ]);

  return (
    <AuthRedirectWrapper requireAuth={true}>
      <PageWrapper>
        <div
          className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'
          style={{ textAlign: 'center' }}
        >
          {' '}
          <div className='mintGazTitle dinoTitle'>DROP</div>
          <div className='mx-auto' style={{ margin: '10px' }}>
            <span>{t('drop:title')}</span>
          </div>
          <div className=''>
            <div className=''>
              <div className='form-container'>
                {userNftBalance && (
                  <>
                    <div className='form-group'>
                      <label htmlFor='nftSelect'>
                        SFT/ESDT{' '}
                        <span className='tooltip-inline'>
                          (ℹ)
                          <span className='tooltiptext-inline'>
                            {t('drop:tooltip')}
                          </span>
                        </span>{' '}
                      </label>
                      <select
                        id='nftSelect'
                        value={`${selectedNFT?.identifier}|${
                          selectedNFT?.collection
                            ? selectedNFT?.collection
                            : selectedNFT?.identifier
                        }|${selectedNFT?.nonce}|${selectedNFT?.balance.toFixed()}|${
                          selectedNFT?.decimals ? selectedNFT?.decimals : 0
                        }`}
                        onChange={handleNFT}
                      >
                        <option key={0} value=''>
                          {t('drop:select')}
                        </option>
                        {[
                          ...userNftBalance?.filter(
                            (item: { type: string }) =>
                              item.type != 'NonFungibleESDT'
                          ),
                          ...userEsdtBalance
                        ].map(
                          (
                            item: {
                              identifier: string;
                              collection: string;
                              balance: BigNumber;
                              nonce: string;
                              decimals: BigNumber;
                            },
                            index: number
                          ) => (
                            <option
                              key={`${item?.identifier}|${
                                item?.collection
                                  ? item?.collection
                                  : item?.identifier
                              }|${item?.nonce}|${new BigNumber(
                                item?.balance
                              ).toFixed()}|${
                                item?.decimals ? item?.decimals : 0
                              }`}
                              value={`${item?.identifier}|${
                                item?.collection
                                  ? item?.collection
                                  : item?.identifier
                              }|${item?.nonce}|${new BigNumber(
                                item?.balance
                              ).toFixed()}|${
                                item?.decimals ? item?.decimals : 0
                              }`}
                            >
                              {item?.identifier}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    {selectedNFT.identifier && (
                      <>
                        <div className='form-group'>
                          <label htmlFor='defaultQty'>
                            {t('drop:default_qty')}{' '}
                            <span className='tooltip-inline'>
                              (ℹ)
                              <span className='tooltiptext-inline'>
                                {t('drop:default_qty_tooltip')}
                              </span>
                            </span>{' '}
                          </label>
                          <input
                            type='number'
                            id='defaultQty'
                            value={defaultQty.toString()}
                            onChange={(e) =>
                              setDefaultQty(new BigNumber(e.target.value))
                            }
                            disabled={submitted}
                            min='1'
                          />
                        </div>
                      </>
                    )}

                    {decimals.gt(0) && (
                      <div className='form-group'>
                        <label htmlFor='decimals'>
                          {t('drop:decimals')}{' '}
                          <span className='tooltip-inline'>
                            (ℹ)
                            <span className='tooltiptext-inline'>
                              {t('drop:decimals_tooltip')}
                            </span>
                          </span>{' '}
                        </label>
                        <input
                          type='number'
                          id='decimals'
                          value={decimals.toString()}
                          onChange={(e) =>
                            setDecimals(new BigNumber(e.target.value))
                          }
                          disabled
                        />
                      </div>
                    )}
                    {/* Convert Decimals (Yes/No), only shown if decimals > 0 */}
                    {decimals.gt(0) && (
                      <div className='form-group'>
                        <label>
                          {t('drop:decimals_yes_no')}{' '}
                          <span className='tooltip-inline'>
                            (ℹ)
                            <span className='tooltiptext-inline'>
                              {t('drop:decimals_yes_no_tooltip')}
                            </span>
                          </span>
                        </label>{' '}
                        <div className='radio-group'>
                          <label>
                            <input
                              type='radio'
                              name='useDecimals'
                              value='true'
                              checked={useDecimals}
                              onChange={() => setUseDecimals(true)}
                              disabled={submitted}
                            />
                            {t('drop:yes')}
                          </label>
                          <label>
                            <input
                              type='radio'
                              name='useDecimals'
                              value='false'
                              checked={!useDecimals}
                              onChange={() => setUseDecimals(false)}
                              disabled={submitted}
                            />
                            {t('drop:no')}
                          </label>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {selectedNFT.identifier && (
                  <>
                    <div className='form-group'>
                      <label htmlFor='addresses'>
                        {t('drop:list_of_addresses')}{' '}
                        <span className='tooltip-inline'>
                          (ℹ)
                          <span className='tooltiptext-inline'>
                            {t('drop:list_of_addresses_tooltip')}
                          </span>
                        </span>
                      </label>
                      <textarea
                        id='addresses'
                        value={addresses}
                        placeholder={t('drop:addresses_placeholder')}
                        onChange={(e) => setAddresses(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          height: '200px',
                          padding: '10px'
                        }}
                        disabled={submitted || voxHolders || boxHolders}
                      />
                    </div>

                    <div className='form-group'>
                      <div className='checkbox-wrapper'>
                        <input
                          type='checkbox'
                          id='voxStakers'
                          checked={voxStakers}
                          onChange={() => {
                            setAddresses('');
                            setVoxStakers(!voxStakers);
                          }}
                        />{' '}
                        <label htmlFor='voxStakers' className='checkbox-label'>
                          Dino Stakers{' '}
                          <span className='tooltip-inline'>
                            (ℹ)
                            <span className='tooltiptext-inline'>
                              {t('drop:dino_stakers_tooltip')}
                            </span>
                          </span>
                        </label>
                        <input
                          type='checkbox'
                          id='boxHolders'
                          checked={boxHolders}
                          onChange={() => {
                            setAddresses('');
                            setBoxHolders(!boxHolders);
                          }}
                        />{' '}
                        <label htmlFor='boxHolders' className='checkbox-label'>
                          Box Holders{' '}
                          <span className='tooltip-inline'>
                            (ℹ)
                            <span className='tooltiptext-inline'>
                              {t('drop:box_holders_tooltip')}
                            </span>
                          </span>
                        </label>
                        <input
                          type='checkbox'
                          id='voxHolders'
                          checked={voxHolders}
                          onChange={() => {
                            setAddresses('');
                            setVoxHolders(!voxHolders);
                          }}
                        />{' '}
                        <label htmlFor='voxHolders' className='checkbox-label'>
                          Vox Holders{' '}
                          <span className='tooltip-inline'>
                            (ℹ)
                            <span className='tooltiptext-inline'>
                              {t('drop:vox_holders_tooltip')}
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </>
                )}{' '}
              </div>
            </div>
            <br />
            {validCount || invalidCount ? (
              <>
                {' '}
                <div className='address-info'>
                  <h3>
                    <Trans
                      i18nKey='drop:valid_addresses'
                      values={{ count: validCount }}
                      components={{ span: <span className='highlight' /> }}
                    />
                  </h3>{' '}
                  {invalidCount > 0 && (
                    <div className='invalid-addresses-container'>
                      <h3>
                        <Trans
                          i18nKey='drop:invalid_addresses'
                          values={{ count: invalidCount }}
                          components={{
                            span: <span className='highlight-error' />
                          }}
                        />
                      </h3>
                      <ul className='invalid-addresses-list'>
                        {invalidAddresses.map((line, index) => (
                          <li key={index} className='invalid-address-item'>
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <br />
                  <div
                    style={{
                      backgroundColor: selectedNFT.balance.lt(totalQuantity)
                        ? '#ffcccc'
                        : 'rgb(155 227 150)',
                      padding: '10px',
                      borderRadius: '5px'
                    }}
                  >
                    <Trans
                      i18nKey='drop:amount_to_send'
                      components={{
                        FormatAmount: (
                          <FormatAmount
                            value={totalQuantity.toFixed()}
                            decimals={decimals.toNumber()}
                            showLabel={false}
                            showLastNonZeroDecimal={true}
                          />
                        )
                      }}
                    />
                    <br />
                    <Trans
                      i18nKey='drop:balance'
                      components={{
                        FormatAmount: (
                          <FormatAmount
                            value={selectedNFT.balance.toFixed()}
                            decimals={decimals.toNumber()}
                            showLabel={false}
                            showLastNonZeroDecimal={true}
                          />
                        )
                      }}
                    />
                    {selectedNFT &&
                      selectedNFT.balance &&
                      validCount > 0 &&
                      invalidCount === 0 &&
                      selectedNFT.balance.isGreaterThanOrEqualTo(
                        totalQuantity
                      ) && (
                        <div>
                          <div
                            className='text-label'
                            style={{ margin: 'auto' }}
                          >
                            <ActionBuy
                              identifier={selectedNFT?.collection}
                              nonce={selectedNFT?.nonce}
                              batches={batches}
                              submitted={submitted}
                              onSubmit={handleSubmit}
                              disabled={
                                selectedNFT.balance.isLessThan(totalQuantity) ||
                                !selectedNFT.identifier
                              }
                            />
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
