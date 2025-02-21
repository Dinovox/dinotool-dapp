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

export const Drop = () => {
  const dinobox_holders = useGetDinoHolders('DINOBOX-54d57b');
  const dinovox_holders = useGetDinoHolders('DINOVOX-cb2297');
  const dinovox_stakers = useGetDinoStakers();
  // console.log('dinovox_stakers', dinovox_stakers);
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
          newInvalidAddresses.push(`${line} (SC - Invalide)`);
        } else if (seenAddresses.has(address)) {
          invalidCountTemp++;
          newInvalidAddresses.push(`${line} (Doublon)`);
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
        newInvalidAddresses.push(`${line} (Format - Invalide)`);
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
      // console.log(chunks);
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

  // console.log('userNftBalance', userNftBalance);
  return (
    <AuthRedirectWrapper requireAuth={true}>
      <PageWrapper>
        <div
          className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'
          style={{ textAlign: 'center' }}
        >
          {' '}
          <div className='mintGazTitle dinoTitle'>DROP (alpha)</div>
          <div className='mx-auto' style={{ margin: '10px' }}>
            <span>Send tokens or SFTs to multiple addresses</span>
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
                            Select the SFT or ESDT to send.
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
                          Select
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
                            Default quantity{' '}
                            <span className='tooltip-inline'>
                              (ℹ)
                              <span className='tooltiptext-inline'>
                                The default quantity for each address. (Unless
                                specified in the address list.)
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
                          Decimals{' '}
                          <span className='tooltip-inline'>
                            (ℹ)
                            <span className='tooltiptext-inline'>
                              ESDTs are divisible up to 18 decimal places. This
                              value is defined by the creator of the ESDT.
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
                          Decimals (Yes/No)
                          <span className='tooltip-inline'>
                            (ℹ)
                            <span className='tooltiptext-inline'>
                              Quantities will be automatically adjusted based on
                              the ESDT’s decimal precision. Uncheck this box to
                              manually enter amounts with decimal values.
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
                            Yes
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
                            No
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
                        List of addresses and amounts{' '}
                        <span className='tooltip-inline'>
                          (ℹ)
                          <span className='tooltiptext-inline'>
                            Paste the list of addresses to send the ESDT or SFT
                            to. Separate each address with a newline or
                            semicolon. You can set a specific amount for each
                            address by adding an amount after the address.
                          </span>
                        </span>
                      </label>
                      <textarea
                        id='addresses'
                        value={addresses}
                        placeholder={
                          'Collez les adresses ici :\n' +
                          'erd17gzyp....lskyy74q036l6h \n' +
                          'Vous pouvez définir une quantité pour chaque adresse :\n' +
                          'erd1.... 10 \n' +
                          'erd1.... 5'
                        }
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
                              Check this box to include dino stakers. (SC only)
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
                              Check this box to include holders of the box.
                              (wallet only)
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
                              Check this box to include dinovox holders. (wallet
                              only)
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
                    Valid Addresses :{' '}
                    <span className='highlight'>{validCount}</span>
                  </h3>{' '}
                  {invalidCount > 0 && (
                    <div className='invalid-addresses-container'>
                      <h3>
                        Invalid Addresses :{' '}
                        <span className='highlight-error'>{invalidCount}</span>
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
                    Amount to send:{' '}
                    <FormatAmount
                      value={totalQuantity.toFixed()}
                      decimals={decimals.toNumber()}
                      showLabel={false}
                      showLastNonZeroDecimal={true}
                    />{' '}
                    <br />
                    Balance:{' '}
                    <FormatAmount
                      value={selectedNFT.balance.toFixed()}
                      decimals={decimals.toNumber()}
                      showLabel={false}
                      showLastNonZeroDecimal={true}
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
