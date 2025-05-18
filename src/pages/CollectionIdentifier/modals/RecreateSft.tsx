import React, { Fragment, useState } from 'react';
import { Dialog } from '@headlessui/react';
import BigNumber from 'bignumber.js';
import { ActionRecreateSFT } from 'helpers/actions/ActionRecreateSFT';
import { RolesCollections } from 'helpers/api/accounts/getRolesCollections';
import { useGetLoginInfo } from 'hooks';
import { m } from 'framer-motion';
import { Collection } from 'helpers/api/accounts/getCollections';
import { Nfts } from 'helpers/api/accounts/getNfts';
import { internal_api_v2 } from 'config';

export const RecreateSft: React.FC<{
  isOpen: boolean;
  closeModal: () => void;
  nfts: Nfts;
}> = ({ isOpen, closeModal, nfts }) => {
  const [name, setName] = useState<string>('');
  const [royalties, setRoyalties] = useState<BigNumber>(new BigNumber(500));
  const [metadatas, setMetadatas] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [uris, setUris] = useState<string[]>([]);
  const [metaUri, setMetaUri] = useState<string>('');
  const [invalidUris, setInvalidUris] = useState<string[]>([]);
  const ipfsUrlPattern = /^https?:\/\/.+\/ipfs\/[a-zA-Z0-9]+(\/[^\s]*)?$/;
  // const ipfsGateway = 'https://ipfs.io/ipfs/';
  // const ipfsGateway = 'https://dinovox.mypinata.cloud/ipfs/';
  const ipfsGateway = 'https://gateway.pinata.cloud/ipfs/';
  const [ipfsData, setIpfsData] = useState<string | null>(null);

  console.log('nfts-rec', nfts);
  const { tokenLogin } = useGetLoginInfo();

  const handleFetchMetadata = async (value: string) => {
    setIpfsData(null);
    setMetadatas(value);
    setMetaUri('https://ipfs.io/ipfs/' + value);
    const isPotentialCID = (v: string) =>
      v.length >= 46 && /^[a-zA-Z0-9]+$/.test(v);
    if (!isPotentialCID(value)) {
      setIpfsData('Invalid IPFS CID');
      return;
    }

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

  // Handle change in the textarea
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

  //for direct upload to pinata
  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
  const handleUploadToPinata = async (files: FileList) => {
    const validFiles = Array.from(files).filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(
          `Le fichier ${file.name} dépasse la limite de ${MAX_FILE_SIZE_MB} Mo.`
        );
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const formData = new FormData();
    formData.append('collection', nfts.collection);
    console.log('formData', formData);
    for (const file of Array.from(files)) {
      formData.append('files', file);
    }
    console.log('formData2', formData);
    if (!tokenLogin) {
      return;
    }
    // const res = await fetch('http://localhost:3000/pinata/upload', {
    const res = await fetch(`${internal_api_v2}/pinata/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
      }
    });
    //   {
    //     "uploaded": [
    //         {
    //             "name": "42.png",
    //             "cid": "QmcSxY2nd2usSLFEsFYEKykbN973Vo9GV3PNdtCaQtwAqn",
    //             "url": "https://gateway.pinata.cloud/ipfs/QmcSxY2nd2usSLFEsFYEKykbN973Vo9GV3PNdtCaQtwAqn"
    //         }
    //     ]
    // }
    const data = await res.json();
    console.log('data', data);
    for (const f of data.uploaded) {
      const uri = `https://ipfs.io/ipfs/${f.cid}`;
      if (f.name.endsWith('.json')) {
        console.log('json', f);
        setMetaUri(uri);
        handleFetchMetadata(f.cid);
      } else {
        setUris((prev) => [...prev, ...uri.split('\n')]);
      }
    }
  };
  return (
    <Dialog open={isOpen} onClose={closeModal} as={Fragment}>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
        <div className='bg-white rounded-lg max-h-[90vh] overflow-y-auto p-6 max-w-lg w-full shadow-lg'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>
              Recreate {nfts.type == 'NonFungibleESDT' ? 'NFT' : 'SFT'}
            </h2>
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
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className='mb-4'>
              <label
                htmlFor='quantity'
                className='block text-sm font-medium text-gray-700'
              >
                Nonce
              </label>
              <input
                type='number'
                id='quantity'
                value={nfts?.nonce?.toFixed()}
                min='1'
                disabled={true}
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
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
                  setRoyalties(
                    new BigNumber(e.target.value).isLessThanOrEqualTo(100)
                      ? new BigNumber(e.target.value).multipliedBy(100)
                      : new BigNumber(100).multipliedBy(100)
                  )
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
              />{' '}
              <input
                type='file'
                // multiple
                onChange={(e) => {
                  if (e.target.files) {
                    handleUploadToPinata(e.target.files);
                  }
                }}
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
                onChange={(e) => setTags(e.target.value.trim().toLowerCase())}
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
                value={`metadata:${metadatas};tags:${tags}`}
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
                value={uris.join('\n')}
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                placeholder='https://ipfs.io/ipfs/ipfsCID/1.mp4
https://ipfs.io/ipfs/ipfsCID/1.json'
                onChange={handleChange}
              />
              <input
                type='file'
                // multiple
                onChange={(e) => {
                  if (e.target.files) {
                    handleUploadToPinata(e.target.files);
                  }
                }}
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
          <ActionRecreateSFT
            collection={nfts.collection}
            name={name.trim()}
            nonce={nfts.nonce}
            royalties={royalties}
            hash=''
            attributes={`metadata:${metadatas};tags:${tags}`}
            uris={[...uris, ...(metaUri ? [metaUri] : [])]}
            disabled={invalidUris.length > 0 || uris.length === 0}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default RecreateSft;
