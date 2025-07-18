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
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export const Drop = () => {
  const loading = useLoadTranslations('drop');
  const { t } = useTranslation();

  const dinobox_holders = useGetDinoHolders('DINOBOX-54d57b');
  const dinovox_holders = useGetDinoHolders('DINOVOX-cb2297');
  const dinovox_stakers = useGetDinoStakers();
  const [boxHolders, setBoxHolders] = useState(false);
  const [voxHolders, setVoxHolders] = useState(false);
  const [voxStakers, setVoxStakers] = useState(false);

  // 1. Type selection (SFT/ESDT)
  const [tokenType, setTokenType] = useState<'SFT' | 'ESDT' | ''>('');
  const { address } = useGetAccountInfo();

  // 2. Token selection
  const userNftBalance = useGetUserNFT(address);
  const userEsdtBalance = useGetUserESDT();
  const [selectedToken, setSelectedToken] = useState<any>(null);

  // 3. Quantity
  const [defaultQty, setDefaultQty] = useState<BigNumber>(new BigNumber(1));
  const [decimals, setDecimals] = useState<BigNumber>(new BigNumber(0));
  const [useDecimals, setUseDecimals] = useState(true);

  // 4. Addresses
  const [addresses, setAddresses] = useState('');
  const [validAddresses, setValidAddresses] = useState<any[]>([]);
  const [invalidAddresses, setInvalidAddresses] = useState<string[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState<BigNumber>(
    new BigNumber(0)
  );
  const [batches, setBatches] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // --- Handlers ---

  // Token type radio
  const handleTokenTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenType(e.target.value as 'SFT' | 'ESDT');
    setSelectedToken(null);
    setDecimals(new BigNumber(0));
    setDefaultQty(new BigNumber(1));
    setAddresses('');
    setValidAddresses([]);
    setInvalidAddresses([]);
    setValidCount(0);
    setInvalidCount(0);
    setTotalQuantity(new BigNumber(0));
    setBatches([]);
    setSubmitted(false);
  };

  // Token dropdown
  const handleTokenSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) {
      setSelectedToken(null);
      setDecimals(new BigNumber(0));
      return;
    }
    const [identifier, collection, nonce, balance, decimalsValue] =
      value.split('|');
    setSelectedToken({
      identifier,
      collection,
      nonce: new BigNumber(nonce),
      balance: new BigNumber(balance),
      decimals: new BigNumber(decimalsValue)
    });
    setDecimals(new BigNumber(decimalsValue));
    setSubmitted(false);
  };

  // Quantity
  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDefaultQty(new BigNumber(e.target.value));
    setSubmitted(false);
  };

  // Addresses textarea
  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (submitted) return;
    const input = e.target.value;
    setAddresses(input);

    const addressList = input
      .split(/\s*[;\n]+\s*/)
      .map((line: any) => line.trim());

    const newValidAddresses: any[] = [];
    const newInvalidAddresses: any[] = [];
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
    });

    // Découpe des adresses valides en chunks
    const chunkSize = 100;
    const chunks: any[] = [];
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

    setValidCount(validCountTemp);
    setInvalidCount(invalidCountTemp);
    setTotalQuantity(totalQuantityTemp);
    setValidAddresses(newValidAddresses);
    setInvalidAddresses(newInvalidAddresses);
  };

  // --- UI ---

  // Token options
  const tokenOptions =
    tokenType === 'SFT'
      ? userNftBalance?.filter((item: any) => item.type === 'SemiFungibleESDT')
      : tokenType === 'ESDT'
      ? userEsdtBalance
      : [];

  // Reset addresses if tokenType or selectedToken change
  useEffect(() => {
    setAddresses('');
    setValidAddresses([]);
    setInvalidAddresses([]);
    setValidCount(0);
    setInvalidCount(0);
    setTotalQuantity(new BigNumber(0));
    setBatches([]);
    setSubmitted(false);
  }, [tokenType, selectedToken]);

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
      handleAddressChange({
        target: { value: addresses } as EventTarget & HTMLTextAreaElement
      } as React.ChangeEvent<HTMLTextAreaElement>);
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
        <div className='w-full flex justify-center items-center py-8'>
          <div className='bg-white rounded-2xl shadow-xl p-8 max-w-xl w-full flex flex-col items-center gap-6 border border-yellow-100'>
            <div className='w-full text-center mb-2'>
              <div className='mintGazTitle dinoTitle'>DROP</div>
              <div className='mx-auto' style={{ margin: '10px' }}>
                <span>{t('drop:title')}</span>
              </div>
              {/* 1. Type selection */}
              <div className='w-full flex flex-col gap-2'>
                <label className='font-semibold text-gray-700 mb-1'>
                  {t('drop:what_to_send')}
                </label>
                <div className='flex gap-6 justify-center'>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='tokenType'
                      value='SFT'
                      checked={tokenType === 'SFT'}
                      onChange={handleTokenTypeChange}
                    />
                    <span className='font-bold text-gray-700'>SFT</span>
                  </label>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='tokenType'
                      value='ESDT'
                      checked={tokenType === 'ESDT'}
                      onChange={handleTokenTypeChange}
                    />
                    <span className='font-bold text-gray-700'>ESDT</span>
                  </label>
                </div>
              </div>
              {/* 2. Token selection */}
              {tokenType && (
                <div className='w-full flex flex-col gap-2'>
                  <select
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400'
                    value={
                      selectedToken
                        ? `${selectedToken.identifier}|${selectedToken.collection}|${selectedToken.nonce}|${selectedToken.balance}|${selectedToken.decimals}`
                        : ''
                    }
                    onChange={handleTokenSelect}
                  >
                    <option value=''>
                      {t('drop:choose_token_type', { tokenType: tokenType })} --
                    </option>
                    {tokenOptions.map((item: any, idx: number) => (
                      <option
                        key={`${item.identifier}|${item.nonce || 0}`}
                        value={`${item.identifier}|${
                          item.collection || item.identifier
                        }|${item.nonce || 0}|${item.balance}|${
                          item.decimals || 0
                        }`}
                      >
                        {item.identifier}
                        {item.nonce && ` (nonce: ${item.nonce})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* 3. Quantity */}
              {selectedToken && (
                <div className='w-full flex flex-col gap-2'>
                  <label className='font-semibold text-gray-700 mb-1'>
                    {t('drop:amount_title')}
                  </label>
                  <input
                    type='number'
                    min='1'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400'
                    value={defaultQty.toString()}
                    onChange={handleQtyChange}
                    disabled={submitted}
                  />
                  {decimals.gt(0) && (
                    <div className='flex items-center gap-4'>
                      <label className='text-gray-600'>
                        {t('drop:use_decimals')}
                      </label>
                      <input
                        type='checkbox'
                        checked={useDecimals}
                        onChange={() => setUseDecimals((v) => !v)}
                        disabled={submitted}
                      />
                    </div>
                  )}
                  <div className='flex flex-col gap-1 text-xs text-gray-400'>
                    <span>
                      Solde disponible :{' '}
                      <span className='font-mono text-yellow-600 font-bold'>
                        <FormatAmount
                          value={selectedToken.balance.toFixed()}
                          decimals={decimals.toNumber()}
                          showLabel={false}
                          showLastNonZeroDecimal={true}
                        />
                      </span>
                    </span>
                    {decimals.gt(0) && (
                      <span>Décimales : {decimals.toString()}</span>
                    )}
                  </div>
                </div>
              )}
              {/* 4. Addresses */}
              {selectedToken && (
                <div className='w-full flex flex-col gap-2'>
                  <label className='font-semibold text-gray-700 mb-1'>
                    {t('drop:list_of_addresses')}
                  </label>{' '}
                  <>
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
                  <textarea
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400'
                    value={addresses}
                    placeholder={t('drop:addresses_placeholder')}
                    onChange={handleAddressChange}
                    required
                    style={{
                      minHeight: '120px'
                    }}
                    disabled={submitted}
                  />
                  <div className='text-xs text-gray-400'>
                    <span>
                      Une adresse par ligne. Vous pouvez ajouter une quantité
                      après l'adresse (ex:{' '}
                      <span className='font-mono'>erd1... 10</span>)
                    </span>
                  </div>
                </div>
              )}
              {/* 5. Résumé & Action */}
              {(validCount > 0 || invalidCount > 0) && (
                <div className='w-full flex flex-col gap-2 mt-2'>
                  <div className='flex items-center gap-2'>
                    <FaCheckCircle className='text-green-500' />
                    <span className='font-semibold text-green-700'>
                      {validCount} adresses valides
                    </span>
                  </div>
                  {invalidCount > 0 && (
                    <div className='flex items-center gap-2'>
                      <FaExclamationCircle className='text-red-500' />
                      <span className='font-semibold text-red-700'>
                        {invalidCount} adresses invalides
                      </span>
                    </div>
                  )}
                  {invalidAddresses.length > 0 && (
                    <ul className='text-xs text-red-500 list-disc ml-6'>
                      {invalidAddresses.map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                  )}
                  <div
                    className='rounded-lg px-4 py-2 mt-2'
                    style={{
                      backgroundColor: selectedToken.balance.lt(totalQuantity)
                        ? '#ffcccc'
                        : '#e6ffe6'
                    }}
                  >
                    <span>
                      Total à envoyer :{' '}
                      <span className='font-mono text-yellow-600 font-bold'>
                        <FormatAmount
                          value={totalQuantity.toFixed()}
                          decimals={decimals.toNumber()}
                          showLabel={false}
                          showLastNonZeroDecimal={true}
                        />
                      </span>
                    </span>
                    <br />
                    <span>
                      Solde disponible :{' '}
                      <span className='font-mono text-yellow-600 font-bold'>
                        <FormatAmount
                          value={selectedToken.balance.toFixed()}
                          decimals={decimals.toNumber()}
                          showLabel={false}
                          showLastNonZeroDecimal={true}
                        />
                      </span>
                    </span>
                  </div>
                  {selectedToken &&
                    selectedToken.balance &&
                    validCount > 0 &&
                    invalidCount === 0 &&
                    selectedToken.balance.isGreaterThanOrEqualTo(
                      totalQuantity
                    ) && (
                      <div className='w-full flex justify-center mt-2'>
                        <ActionBuy
                          identifier={selectedToken?.collection}
                          nonce={selectedToken?.nonce}
                          batches={batches}
                          submitted={submitted}
                          onSubmit={() => setSubmitted(true)}
                          disabled={
                            selectedToken.balance.isLessThan(totalQuantity) ||
                            !selectedToken.identifier
                          }
                        />
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>{' '}
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
