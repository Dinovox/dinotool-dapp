import React, { Fragment, useState } from 'react';
import { Dialog } from '@headlessui/react';
import BigNumber from 'bignumber.js';
import { ActionCreateSFT } from 'helpers/actions/ActionCreateSFT';
import { CollectionRole } from 'helpers/api/accounts/getRolesCollections';

export const CreateSft: React.FC<{
  isOpen: boolean;
  closeModal: () => void;
  selectedCollection: CollectionRole;
}> = ({ isOpen, closeModal, selectedCollection }) => {
  const [name, setName] = useState<string>('');
  const [quantity, setQuantity] = useState<BigNumber>(new BigNumber(1));
  const [royalties, setRoyalties] = useState<BigNumber>(new BigNumber(500));
  const [metadatas, setMetadatas] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [uris, setUris] = useState<string[]>([]);
  const [invalidUris, setInvalidUris] = useState<string[]>([]);
  const ipfsUrlPattern = /^https?:\/\/.+\/ipfs\/[a-zA-Z0-9]+(\/[^\s]*)?$/;
  // const ipfsGateway = 'https://ipfs.io/ipfs/';
  // const ipfsGateway = 'https://dinovox.mypinata.cloud/ipfs/';
  const ipfsGateway = 'https://gateway.pinata.cloud/ipfs/';
  const [ipfsData, setIpfsData] = useState<string | null>(null);

  const handleFetchMetadata = async (value: string) => {
    setIpfsData(null);
    setMetadatas(value);
    // if (!isValidCID(cid)) {
    //   setError('CID invalide');
    //   return;
    // }

    try {
      const url = `${ipfsGateway}${value}`;
      const response = await fetch(url);

      // const url =
      //   'https://gateway.pinata.cloud/ipfs/QmRxfHkLoZM3Pd9EayzQ9PWTGQLbWmswV8fgG3QckCoZCZ/902.json';
      // const response = await fetch(url);
      console.log('response', response);

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement du JSON');
      }

      const json = await response.json();

      // Valider les clés nécessaires
      // if (!json.name || !json.image) {
      //   setError(
      //     'Le JSON doit contenir au minimum les champs "name" et "image"'
      //   );
      //   return;
      // }

      setIpfsData(json);
    } catch (err: any) {
      setIpfsData('Erreur lors du téléchargement du JSON');
    }
  };

  const isValidIPFSUrl = (uri: string): boolean => {
    return ipfsUrlPattern.test(uri.trim());
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const valid = lines.filter(isValidIPFSUrl);
    const invalid = lines.filter((uri) => !isValidIPFSUrl(uri));

    setUris(valid);
    setInvalidUris(invalid);
  };

  return (
    <Dialog open={isOpen} onClose={closeModal} as={Fragment}>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
        <div className='bg-white rounded-lg max-h-[90vh] overflow-y-auto p-6 max-w-lg w-full shadow-lg'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>Create a new SFT</h2>
            <button
              onClick={closeModal}
              className='text-gray-500 hover:text-gray-700'
            >
              ✕
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Handle form submission logic here
            }}
          >
            <div className='mb-4'>
              <label
                htmlFor='name'
                className='block text-sm font-medium text-gray-700'
              >
                Name
              </label>
              <input
                type='text'
                id='name'
                value={name}
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                onChange={(e) => setName(e.target.value.trim())}
              />
            </div>

            <div className='mb-4'>
              <label
                htmlFor='quantity'
                className='block text-sm font-medium text-gray-700'
              >
                Quantity
              </label>
              <input
                onWheel={(e) => e.currentTarget.blur()}
                type='number'
                id='quantity'
                value={quantity.toString()}
                min='1'
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                onChange={(e) => setQuantity(new BigNumber(e.target.value))}
              />
            </div>

            <div className='mb-4'>
              <label
                htmlFor='royalties'
                className='block text-sm font-medium text-gray-700'
              >
                Royalties %
              </label>
              <input
                onWheel={(e) => e.currentTarget.blur()}
                type='number'
                id='royalties'
                value={royalties.dividedBy(100).toString()}
                min='0'
                max='100'
                step='0.01'
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                onChange={(e) =>
                  setRoyalties(new BigNumber(e.target.value).multipliedBy(100))
                }
              />
            </div>

            <div className='mb-4'>
              <label
                htmlFor='metadatas'
                className='block text-sm font-medium text-gray-700'
              >
                Metadatas (ipfsCID/name.json)
              </label>
              <textarea
                id='metadatas'
                value={metadatas}
                placeholder='ipfsCID/name.json'
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                onChange={(e) => handleFetchMetadata(e.target.value.trim())}
              />
              {ipfsData && (
                <div className='mt-2'>
                  <h3 className='text-lg font-semibold'>Metadatas:</h3>
                  <pre className='bg-gray-100 p-2 rounded'>
                    {JSON.stringify(ipfsData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className='mb-4'>
              <label
                htmlFor='tags'
                className='block text-sm font-medium text-gray-700'
              >
                Tags
              </label>
              <textarea
                id='tags'
                value={tags}
                placeholder='DinoVox,Graou'
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                onChange={(e) => setTags(e.target.value.trim())}
              />
            </div>

            <div className='mb-4'>
              <label
                htmlFor='attributes'
                className='block text-sm font-medium text-gray-700'
              >
                Attributes
              </label>
              <textarea
                id='attributes'
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                value={`metadatas:${metadatas};tags:${tags}`}
                disabled
              />
            </div>

            <div className='mb-4'>
              <label
                htmlFor='uris'
                className='block text-sm font-medium text-gray-700'
              >
                URIs (line-feeded)
              </label>
              <textarea
                id='uris'
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                placeholder='https://ipfs.io/ipfs/ipfsCID/1.mp4
https://ipfs.io/ipfs/ipfsCID/1.json'
                onChange={handleChange}
              />
              {invalidUris.length > 0 && (
                <div className='text-red-500 mt-2'>
                  Invalid URIs:
                  <ul>
                    {invalidUris.map((uri, index) => (
                      <li key={index}>{uri}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </form>
          <ActionCreateSFT
            collection={selectedCollection.collection}
            name={name}
            quantity={quantity}
            royalties={royalties}
            hash=''
            attributes={`metadatas:${metadatas};tags:${tags}`}
            uris={uris}
            disabled={invalidUris.length > 0}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default CreateSft;
