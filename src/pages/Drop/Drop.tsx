import { PageWrapper } from 'wrappers';
// Removed unused imports to limit dependencies
import { ActionBuy } from './Transaction/ActionBuy';
import './MintSFT.css';
import { useGetAccountInfo, FormatAmount } from 'lib';
import { useEffect, useMemo, useState } from 'react';
import { addressIsValid } from '@multiversx/sdk-dapp/out/utils/validation/addressIsValid';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import BigNumber from 'bignumber.js';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import { useGetDinoHolders } from './Transaction/helpers/useGetDinoHolders';
import { useGetDinoStakers } from './Transaction/helpers/useGetDinoStakers';
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { PageTemplate } from 'components/PageTemplate';

// --- Helper: normalizeAmountInput ---
function normalizeAmountInput(input: string | number): string {
  if (typeof input === 'number') return input.toString();
  // Replace comma with dot, trim spaces
  return input.replace(',', '.').trim();
}

// --- Helper: countFractionDigits ---
function countFractionDigits(value: string | number): number {
  const str = typeof value === 'number' ? value.toString() : value;
  const parts = str.split('.');
  return parts.length > 1 ? parts[1].length : 0;
}

// --- Helper: hasDecimalSeparator ---
function hasDecimalSeparator(value: string | number): boolean {
  const str = typeof value === 'number' ? value.toString() : value;
  return str.includes('.') || str.includes(',');
}

// --- Types ---
type TokenType = 'SFT' | 'ESDT' | '';

type BaseToken = {
  identifier: string;
  name?: string;
  decimals?: number; // number or string in sources; we'll handle defensively
  balance?: string | number; // same
  collection?: string; // SFT/NFT
  nonce?: number; // SFT/NFT
  type?: string; // "FungibleESDT" | "SemiFungibleESDT" | etc.
};

export const Drop = () => {
  const loading = useLoadTranslations('drop');
  const { t } = useTranslation();

  // External datasets (checkbox sources)
  const dinobox_holders = useGetDinoHolders('DINOBOX-54d57b');
  const dinovox_holders = useGetDinoHolders('DINOVOX-cb2297');
  const dinovox_stakers = useGetDinoStakers();

  const [boxHolders, setBoxHolders] = useState(false);
  const [voxHolders, setVoxHolders] = useState(false);
  const [voxStakers, setVoxStakers] = useState(false);

  // 1. Type selection (SFT/ESDT)
  const [tokenType, setTokenType] = useState<TokenType>('');
  const { address } = useGetAccountInfo();

  // 2. Token data sources
  const userNftBalance = useGetUserNFT(address);
  const userEsdtBalance = useGetUserESDT();

  // 2b. Stable key + derived selected token
  const [selectedKey, setSelectedKey] = useState<string>('');

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

  // --- Helpers: token list & keys ---
  const tokenOptions: BaseToken[] = useMemo(() => {
    if (tokenType === 'SFT') {
      return (userNftBalance ?? []).filter(
        (item: any) => item.type === 'SemiFungibleESDT'
      );
    }
    if (tokenType === 'ESDT') {
      return userEsdtBalance ?? [];
    }
    return [];
  }, [tokenType, userNftBalance, userEsdtBalance]);

  const getTokenKey = (t: BaseToken, tt: TokenType) => {
    if (tt === 'ESDT') return t.identifier;
    const col = t.collection || t.identifier;
    const nonce = t.nonce ?? 0;
    return `${col}|${String(nonce)}`;
  };

  const tokenByKey = useMemo(() => {
    const m = new Map<string, BaseToken>();
    for (const t of tokenOptions) m.set(getTokenKey(t, tokenType), t);
    return m;
  }, [tokenOptions, tokenType]);

  const selectedToken: BaseToken | undefined = useMemo(() => {
    return tokenByKey.get(selectedKey);
  }, [tokenByKey, selectedKey]);

  const selectedBalance = useMemo(
    () => new BigNumber(selectedToken?.balance ?? 0),
    [selectedToken]
  );

  // --- Handlers ---
  const handleTokenTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tt = e.target.value as TokenType;
    setTokenType(tt);
    setSelectedKey('');
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

  const handleTokenSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedKey(key);
    setSubmitted(false);
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDefaultQty(new BigNumber(e.target.value || 0));
    setSubmitted(false);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (submitted) return;
    const input = e.target.value;
    setAddresses(input);

    const addressList = input
      .split(/\s*[;\n]+\s*/)
      .map((line: any) => line.trim());

    const newValidAddresses: any[] = [];
    const newInvalidAddresses: any[] = [];
    const seenAddresses = new Set<string>();

    let validCountTemp = 0;
    let invalidCountTemp = 0;
    let totalQuantityTemp = new BigNumber(0);

    addressList.forEach((line: any) => {
      if (!line) return;
      const [addr, rawQtyMaybe] = line.split(/\s+/);

      if (!addressIsValid(addr)) {
        invalidCountTemp++;
        newInvalidAddresses.push(`${line} ${t('drop:invalid_format')}`);
        return;
      }
      if (addr.startsWith('erd1qqqqqqqqqqq')) {
        invalidCountTemp++;
        newInvalidAddresses.push(`${line} ${t('drop:invalid_sc')}`);
        return;
      }
      if (seenAddresses.has(addr)) {
        invalidCountTemp++;
        newInvalidAddresses.push(`${line} ${t('drop:invalid_duplicate')}`);
        return;
      }

      const rawQty = rawQtyMaybe ?? defaultQty.toString();
      const nrm = normalizeAmountInput(rawQty);

      if (!nrm || new BigNumber(nrm).isNaN() || new BigNumber(nrm).lte(0)) {
        invalidCountTemp++;
        newInvalidAddresses.push(`${line} ${t('drop:invalid_amount')}`);
        return;
      }

      if (useDecimals) {
        const frac = countFractionDigits(nrm);
        if (decimals.gt(0)) {
          if (frac > decimals.toNumber()) {
            invalidCountTemp++;
            newInvalidAddresses.push(
              `${line} ${t('drop:invalid_precision', {
                maxDecimals: decimals.toNumber()
              })}`
            );
            return;
          }
        } else {
          if (frac > 0) {
            invalidCountTemp++;
            newInvalidAddresses.push(
              `${line} ${t('drop:invalid_precision_zero')}`
            );
            return;
          }
        }
      } else {
        if (hasDecimalSeparator(nrm)) {
          invalidCountTemp++;
          newInvalidAddresses.push(`${line} ${t('drop:invalid_base_units')}`);
          return;
        }
      }

      let qty = new BigNumber(nrm);
      if (useDecimals && decimals.gt(0)) {
        qty = qty.multipliedBy(new BigNumber(10).pow(decimals));
      }
      if (!qty.isFinite() || qty.lte(0)) {
        invalidCountTemp++;
        newInvalidAddresses.push(`${line} ${t('drop:invalid_amount')}`);
        return;
      }

      newValidAddresses.push({ address: addr, quantity: qty });
      totalQuantityTemp = totalQuantityTemp.plus(qty);
      seenAddresses.add(addr);
      validCountTemp++;

      // if (addressIsValid(addr)) {
      //   if (addr.startsWith('erd1qqqqqqqqqqq')) {
      //     invalidCountTemp++;
      //     newInvalidAddresses.push(`${line} ${t('drop:invalid_sc')}`);
      //   } else if (seenAddresses.has(addr)) {
      //     invalidCountTemp++;
      //     newInvalidAddresses.push(`${line} ${t('drop:invalid_duplicate')}`);
      //   } else {
      //     validCountTemp++;
      //     let qty = quantity
      //       ? new BigNumber(String(quantity).replace(',', '.'))
      //       : defaultQty;

      //     if (useDecimals && decimals.gt(0)) {
      //       qty = qty.multipliedBy(new BigNumber(10).pow(decimals));
      //     }

      //     newValidAddresses.push({ address: addr, quantity: qty });
      //     totalQuantityTemp = totalQuantityTemp.plus(qty);
      //     seenAddresses.add(addr);
      //   }
      // } else {
      //   invalidCountTemp++;
      //   newInvalidAddresses.push(`${line} ${t('drop:invalid_format')}`);
      // }
    });

    // Découpe en lots de 100
    const chunkSize = 100;
    const chunks: any[] = [];
    for (let i = 0; i < newValidAddresses.length; i += chunkSize) {
      const chunk = newValidAddresses.slice(i, i + chunkSize);
      const batchQuantity = chunk.reduce(
        (sum: BigNumber, entry: any) => sum.plus(new BigNumber(entry.quantity)),
        new BigNumber(0)
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

  // Reset addresses/etc when tokenType OR selectedKey changes
  useEffect(() => {
    setAddresses('');
    setValidAddresses([]);
    setInvalidAddresses([]);
    setValidCount(0);
    setInvalidCount(0);
    setTotalQuantity(new BigNumber(0));
    setBatches([]);
    setSubmitted(false);
  }, [tokenType, selectedKey]);

  // Keep decimals aligned with selected token
  useEffect(() => {
    const d = new BigNumber((selectedToken?.decimals ?? 0) as any);
    setDecimals(d.isNaN() ? new BigNumber(0) : d);
  }, [selectedToken]);

  // Auto-fill addresses from holders/stakers selections
  useEffect(() => {
    if (submitted) return;

    const uniqueAddressesSet = new Set<string>();

    if (boxHolders && dinobox_holders && dinobox_holders.length > 0) {
      dinobox_holders
        .map((h: any) => h.address)
        .filter((a: string) => !a.startsWith('erd1qqqqqqqqqq'))
        .forEach((a: string) => uniqueAddressesSet.add(a));
    }

    if (voxStakers && dinovox_stakers && dinovox_stakers.length > 0) {
      dinovox_stakers
        .map((s: any) => s.address)
        .filter((a: string) => !a.startsWith('erd1qqqqqqqqqq'))
        .forEach((a: string) => uniqueAddressesSet.add(a));
    }

    if (voxHolders && dinovox_holders && dinovox_holders.length > 0) {
      dinovox_holders
        .map((h: any) => h.address)
        .filter((a: string) => !a.startsWith('erd1qqqqqqqqqq'))
        .forEach((a: string) => uniqueAddressesSet.add(a));
    }

    const addressesString = Array.from(uniqueAddressesSet).join('\n');
    if (addressesString) setAddresses(addressesString);

    const handler = setTimeout(() => {
      handleAddressChange({
        target: { value: addresses } as EventTarget & HTMLTextAreaElement
      } as React.ChangeEvent<HTMLTextAreaElement>);
    }, 300);

    return () => clearTimeout(handler);
  }, [
    addresses,
    useDecimals,
    decimals,
    defaultQty,
    voxStakers,
    boxHolders,
    voxHolders,
    submitted,
    dinobox_holders,
    dinovox_holders,
    dinovox_stakers
  ]);

  // --- Render ---
  return (
    <PageWrapper>
      <PageTemplate
        title='DROP'
        breadcrumbItems={[{ label: 'Home', path: '/' }, { label: 'Drop' }]}
        maxWidth='1400px'
      >
        <div className='w-full flex justify-center items-center py-8'>
          <div className='bg-white rounded-2xl shadow-xl p-8 max-w-xl w-full flex flex-col items-center gap-6 border border-yellow-100'>
            <div className='w-full text-center mb-2'>
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
                    value={selectedKey}
                    onChange={handleTokenSelect}
                  >
                    <option value=''>
                      {t('drop:choose_token_type', { tokenType })} --
                    </option>
                    {tokenOptions.map((item: BaseToken) => {
                      const key = getTokenKey(item, tokenType);
                      return (
                        <option key={key} value={key}>
                          {item.identifier}
                          {tokenType === 'SFT' &&
                            item.nonce != null &&
                            ` (nonce: ${item.nonce})`}
                        </option>
                      );
                    })}
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
                      Solde disponible:{' '}
                      <span className='font-mono text-yellow-600 font-bold'>
                        {Number(
                          selectedBalance
                            .dividedBy(new BigNumber(10).pow(decimals))
                            .toFixed()
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: decimals.gt(0) ? 6 : 0
                        })}
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
                  </label>

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
                      />
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
                      />
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
                      />
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

                  <textarea
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400'
                    value={addresses}
                    placeholder={t('drop:addresses_placeholder')}
                    onChange={handleAddressChange}
                    required
                    style={{ minHeight: '120px' }}
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
                      backgroundColor: selectedBalance.lt(totalQuantity)
                        ? '#ffcccc'
                        : '#e6ffe6'
                    }}
                  >
                    <span>
                      Total à envoyer:{' '}
                      <span className='font-mono text-yellow-600 font-bold'>
                        {Number(
                          new BigNumber(totalQuantity)
                            .dividedBy(new BigNumber(10).pow(decimals))
                            .toFixed()
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: decimals.toNumber()
                        })}
                        {/* <FormatAmount
                        value={totalQuantity.toFixed()}
                        showLabel={false}
                      /> */}
                      </span>
                    </span>
                    <br />
                    <span>
                      Solde disponible:{' '}
                      <span className='font-mono text-yellow-600 font-bold'>
                        {Number(
                          selectedBalance
                            .dividedBy(new BigNumber(10).pow(decimals))
                            .toFixed()
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: decimals.gt(0) ? 6 : 0
                        })}
                        {/* <FormatAmount
                        value={selectedBalance.toFixed()}
                        showLabel={false}
                      /> */}
                      </span>
                    </span>
                  </div>
                  {selectedToken &&
                    validCount > 0 &&
                    invalidCount === 0 &&
                    selectedBalance.isGreaterThanOrEqualTo(totalQuantity) && (
                      <div className='w-full flex justify-center mt-2'>
                        <ActionBuy
                          identifier={
                            (selectedToken.collection ||
                              selectedToken.identifier) as string
                          }
                          nonce={selectedToken.nonce as any}
                          batches={batches}
                          submitted={submitted}
                          onSubmit={() => setSubmitted(true)}
                          disabled={
                            selectedBalance.isLessThan(totalQuantity) ||
                            !selectedToken.identifier
                          }
                        />
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageTemplate>
    </PageWrapper>
  );
};

export default Drop;
