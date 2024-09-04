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
import { useGetAccount, useGetAccountInfo } from 'hooks';
import { useEffect, useState } from 'react';
import { addressIsValid } from '@multiversx/sdk-dapp/utils/account';
import { useGetUserNFT } from 'helpers/useGetUserNft';
import BigNumber from 'bignumber.js';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import { FormatAmount } from 'components';

export const Drop = () => {
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
    nonce: 0,
    balance: new BigNumber(0),
    decimals: new BigNumber(0)
  });
  const [defaultQty, setDefaultQty] = useState<BigNumber>(new BigNumber(1));
  const [decimals, setDecimals] = useState<BigNumber>(new BigNumber(0));
  const [useDecimals, setUseDecimals] = useState(true);

  const userNftBalance = useGetUserNFT(address);
  const userEsdtBalance = useGetUserESDT();

  const handleSubmit = () => {
    setSubmitted(true);
  };
  const handleNFT = (event: any) => {
    const value = event.target.value;

    if (value) {
      const [index, identifier, collection, nonce, balance, decimals] =
        value.split('|');

      setSelectedNFT({
        index,
        identifier,
        collection,
        nonce,
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
      .split(/\s*[,;\n]+\s*/)
      .map((line: any) => line.trim());

    const newValidAddresses: any = [];
    const newInvalidAddresses: any = [];
    const seenAddresses = new Set(); // Pour vérifier les doublons

    let validCountTemp = 0;
    let invalidCountTemp = 0;
    let totalQuantityTemp = new BigNumber(0);

    addressList.forEach((line: any) => {
      //igngorer la ligne vide
      if (!line) return;
      // Séparer l'adresse et la quantité
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
          let qty = quantity ? new BigNumber(quantity) : defaultQty;

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

        let batchQuantity = chunk.reduce(
          (sum: BigNumber, entry: any) =>
            sum.plus(new BigNumber(entry.quantity)),
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
    });

    // Mettre à jour les états des adresses valides et invalides

    setValidCount(validCountTemp);
    setInvalidCount(invalidCountTemp);
    setTotalQuantity(totalQuantityTemp);
    setValidAddresses(newValidAddresses);
    setInvalidAddresses(newInvalidAddresses);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      handleAddressChange({ target: { value: addresses } });
    }, 300); // Délai de 300ms

    return () => {
      clearTimeout(handler);
    };
  }, [addresses, useDecimals, decimals, defaultQty]);

  return (
    <AuthRedirectWrapper requireAuth={true}>
      <PageWrapper>
        <div
          className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'
          style={{ textAlign: 'center' }}
        >
          {' '}
          <div className='mintGazTitle dinoTitle'>DROP (beta)</div>
          <div className='mx-auto' style={{ margin: '10px' }}>
            <span>Envoyer des tokens ou des sft à plusieurs adresses</span>
          </div>
          <div className=''>
            <div className=''>
              <div className='form-container'>
                {userNftBalance && (
                  <>
                    {/* Section pour le select de NFT/ESDT */}
                    <div className='form-group'>
                      <label htmlFor='nftSelect'>
                        Sélectionner SFT/ESDT{' '}
                        <span className='tooltip-inline'>
                          (ℹ)
                          <span className='tooltiptext-inline'>
                            Sélectionner le SFT ou l'ESDT à envoyer.
                          </span>
                        </span>{' '}
                      </label>
                      <select
                        id='nftSelect'
                        value={`${
                          selectedNFT.index
                        }|${selectedNFT?.identifier}|${
                          selectedNFT?.collection
                            ? selectedNFT?.collection
                            : selectedNFT?.identifier
                        }|${selectedNFT?.nonce}|${selectedNFT?.balance}|${
                          selectedNFT?.decimals ? selectedNFT?.decimals : 0
                        }`}
                        onChange={handleNFT}
                      >
                        <option key={0} value=''>
                          Select
                        </option>

                        {/* Options from userNftBalance */}
                        {userNftBalance?.map(
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
                              key={`1${index}`}
                              value={`1${index}|${item?.identifier}|${
                                item?.collection
                                  ? item?.collection
                                  : item?.identifier
                              }|${item?.nonce}|${item?.balance}|${
                                item?.decimals ? item?.decimals : 0
                              }`}
                            >
                              {item?.identifier}
                            </option>
                          )
                        )}

                        {/* Options from userEsdtBalance */}
                        {userEsdtBalance?.map(
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
                              key={`2${index}`}
                              value={`2${index}|${item?.identifier}|${
                                item?.collection
                                  ? item?.collection
                                  : item?.identifier
                              }|${
                                item?.nonce ? item?.nonce : 0
                              }|${item?.balance}|${
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
                            Quantité par défaut{' '}
                            <span className='tooltip-inline'>
                              (ℹ)
                              <span className='tooltiptext-inline'>
                                La quantité par défaut pour chaque adresse.
                                (Sauf si précisé dans la liste des adresses.)
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
                          Decimales{' '}
                          <span className='tooltip-inline'>
                            (ℹ)
                            <span className='tooltiptext-inline'>
                              Les ESDT sont divisibles jusqu'à 18 décimales.
                              Cette valeur est définie par le créateur de
                              l'ESDT.
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
                          Decimales (Oui/Non)
                          <span className='tooltip-inline'>
                            (ℹ)
                            <span className='tooltiptext-inline'>
                              Les quantités seront multipliées par le nombre de
                              décimales de l'ESDT. Décochez cette case pour
                              gérer les valeurs natives de l'ESDT.
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
                        Liste des adresses et montants{' '}
                        <span className='tooltip-inline'>
                          (ℹ)
                          <span className='tooltiptext-inline'>
                            Coller la liste d'adresses auxquelles envoyer l'ESDT
                            ou le SFT. Séparez chaque adresse par un retour à la
                            ligne, une virgule ou un point-virgule. Vous pouvez
                            définir montant spécfique pour chaque adresse en
                            ajoutant un montant après l'adresse.
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
                        disabled={submitted}
                      />
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
                    Adresses Valides :{' '}
                    <span className='highlight'>{validCount}</span>
                  </h3>{' '}
                  {invalidCount > 0 && (
                    <div className='invalid-addresses-container'>
                      <h3>
                        Adresses Invalides :{' '}
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
                    Montant à envoyer:{' '}
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
