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

export const Drop = () => {
  const [addresses, setAddresses] = useState('');
  const [validAddresses, setValidAddresses] = useState([]);
  const [invalidAddresses, setInvalidAddresses] = useState([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [batches, setBatches] = useState([]);
  const [submitted, setSubmitted] = useState(false); // Nouvel état pour gérer la soumission
  const { address } = useGetAccountInfo();
  const [selectedNFT, setSelectedNFT] = useState<any>({
    identifier: '',
    collection: '',
    nonce: 0,
    balance: 0
  });

  const userNftBalance = useGetUserNFT(address);
  console.log('nft?3', userNftBalance);
  const handleSubmit = () => {
    setSubmitted(true);
    console.log('sub');
  };
  const handleNFT = (event: any) => {
    const value = event.target.value;

    if (value) {
      const [identifier, collection, nonce, balance] = value.split('|');

      // Maintenant tu peux utiliser ces valeurs séparément
      console.log('identifier:', identifier);
      console.log('collection:', collection);
      console.log('Nonce:', nonce);
      console.log('balance:', balance);

      // Par exemple, tu peux les stocker dans l'état ou les utiliser autrement
      setSelectedNFT({ identifier, collection, nonce, balance });
    }
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
    let totalQuantityTemp = 0;

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
          const qty = quantity ? parseInt(quantity, 10) : 1;
          newValidAddresses.push({
            address,
            quantity: qty
          });
          totalQuantityTemp += qty;
          seenAddresses.add(address);
        }
      } else {
        invalidCountTemp++;
        newInvalidAddresses.push(`${line} (Format - Invalide)`);
      }

      setValidCount(validCountTemp);
      setInvalidCount(invalidCountTemp);
      setTotalQuantity(totalQuantityTemp);

      // Découpe des adresses valides en chunks
      const chunkSize = 100;
      const chunks: any = [];
      for (let i = 0; i < newValidAddresses.length; i += chunkSize) {
        const chunk = newValidAddresses.slice(i, i + chunkSize);
        const batchQuantity = chunk.reduce(
          (sum: any, entry: any) => sum + entry.quantity,
          0
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
    setValidAddresses(newValidAddresses);
    setInvalidAddresses(newInvalidAddresses);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      handleAddressChange({ target: { value: addresses } });
    }, 2000); // Délai de 300ms

    return () => {
      clearTimeout(handler);
    };
  }, [addresses]);

  console.log(batches);
  return (
    <AuthRedirectWrapper requireAuth={true}>
      <PageWrapper>
        <div className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          <div className='mintGazTitle dinoTitle'>
            DROP
            {/* <img src='/DinoGazTitle.png' alt='Dino Gaz Title' /> */}
          </div>
          <div className=''>
            <div className=''>
              <div className='info-item'>
                {userNftBalance && (
                  <>
                    <h1>Select SFT :</h1>
                    <div>
                      <select
                        value={`${selectedNFT?.identifier}|${selectedNFT?.collection}|${selectedNFT?.nonce}|${selectedNFT?.balance}`}
                        onChange={handleNFT}
                      >
                        <option key={0} value={''}>
                          Select
                        </option>
                        {userNftBalance?.map(
                          (item: {
                            identifier: string;
                            collection: string;
                            balance: string;
                            nonce: string;
                          }) => (
                            <option
                              key={`${item?.identifier}|${item?.collection}|${item?.nonce}|${item?.balance}`}
                              value={`${item?.identifier}|${item?.collection}|${item?.nonce}|${item?.balance}`}
                            >
                              {item?.identifier} max :{' '}
                              {item?.balance ? item?.balance : 1}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
            <span>Adresses à drop :</span>
            <div>
              <textarea
                id='addresses'
                value={addresses}
                placeholder={
                  'Enter addresses separated by commas, semicolons, or newlines :\n' +
                  'erd17gzypuhxvwa68dhwp3uzlrxxvja0gje9njmh92plh75slskyy74q036l6h \n' +
                  'You may set qty for each address :\n' +
                  'erd17gzypuhxvwa68dhwp3uzlrxxvja0gje9njmh92plh75slskyy74q036l6h 10'
                }
                // onChange={handleAddressChange}
                onChange={(e) => setAddresses(e.target.value)}
                required
                disabled={submitted}
                style={{ width: '100%', height: '200px', padding: '10px' }}
              />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h3>Adresses Invalides : {invalidCount} </h3>
              <ul>
                {invalidAddresses.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>
                Adresses Valides : {validCount} qty: {totalQuantity}
              </h3>
              {/* <ul>
                {validAddresses.map((entry: any, index) => (
                  <li key={index}>
                    {entry.address} (Quantité: {entry.quantity})
                  </li>
                ))}
              </ul> */}
            </div>
          </div>
          <div>
            <div className='text-label' style={{ margin: 'auto' }}>
              <ActionBuy
                identifier={selectedNFT?.collection}
                nonce={selectedNFT?.nonce}
                batches={batches}
                submitted={submitted}
                onSubmit={handleSubmit}
                disabled={
                  BigInt(selectedNFT.balance) < BigInt(totalQuantity) ||
                  !selectedNFT.identifier
                }
              />
            </div>
          </div>
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
