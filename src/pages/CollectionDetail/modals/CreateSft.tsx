import React, { Fragment, useState } from 'react';
import { Dialog } from '@headlessui/react';
import BigNumber from 'bignumber.js';
import { ActionCreateSFT } from 'helpers/actions/ActionCreateSFT';
import { RolesCollections } from 'helpers/api/accounts/getRolesCollections';
import { useGetAccount, useGetLoginInfo } from 'lib';
import { m } from 'framer-motion';
import { Collection } from 'helpers/api/accounts/getCollections';
import { dinoclaim_api } from 'config';
import { t } from 'i18next';

export const CreateSft: React.FC<{
  isOpen: boolean;
  closeModal: () => void;
  collection: Collection;
}> = ({ isOpen, closeModal, collection }) => {
  const [name, setName] = useState<string>('');
  const [quantity, setQuantity] = useState<BigNumber>(new BigNumber(1));
  const [royalties, setRoyalties] = useState<BigNumber>(new BigNumber(500));
  const [metadatas, setMetadatas] = useState<string>('');
  const [attributes, setAttributes] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [uris, setUris] = useState<string[]>([]);
  const [metaUri, setMetaUri] = useState<string>('');
  const [invalidUris, setInvalidUris] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; cid: string; url: string }[]
  >([]);
  const ipfsUrlPattern = /^https?:\/\/.+\/ipfs\/[a-zA-Z0-9]+(\/[^\s]*)?$/;
  // const ipfsGateway = 'https://ipfs.io/ipfs/';
  // const ipfsGateway = 'https://dinovox.mypinata.cloud/ipfs/';
  const ipfsGateway = 'https://gateway.pinata.cloud/ipfs/';
  const [ipfsData, setIpfsData] = useState<string | null>(null);

  const { tokenLogin } = useGetLoginInfo();
  const { address } = useGetAccount();

  const handleFetchMetadata = async (value: string) => {
    setIpfsData(null);
    setMetadatas(value);
    setMetaUri('https://ipfs.io/ipfs/' + value);

    // const isPotentialCID = (v: string) =>
    //   v.length >= 46 && /^[a-zA-Z0-9]+$/.test(v);
    // if (!isPotentialCID(value)) {
    //   setIpfsData('Invalid IPFS CID');
    //   return;
    // }

    const extractCID = (value: string): string => value.split('/')[0];
    const isPotentialCID = (value: string): boolean => {
      const cid = extractCID(value);
      return cid.length >= 46 && /^[a-zA-Z0-9]+$/.test(cid);
    };
    if (!isPotentialCID(value)) {
      setIpfsData('Invalid IPFS CID');
      return;
    }

    try {
      //test via gateway pinata
      const url = `${ipfsGateway}${value}`;
      let response = await fetch(url);

      // const url =
      //   'https://gateway.pinata.cloud/ipfs/QmRxfHkLoZM3Pd9EayzQ9PWTGQLbWmswV8fgG3QckCoZCZ/902.json';
      // const response = await fetch(url);

      if (!response.ok) {
        //test via ipfs.io
        const url2 = 'https://ipfs.io/ipfs/' + value;
        response = await fetch(url2);

        if (!response.ok) {
          throw new Error('Erreur lors du téléchargement du JSON');
        }
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
      try {
        // const parsed = JSON.parse(json);
        // console.log('Parsed JSON:', parsed);
        // setJsonData(parsed);

        const stringified = JSON.stringify(json);
        // const hex = Buffer.from(stringified).toString('hex');
        setAttributes(stringified);
        // console.log('Hex-encoded attributes:', hex);
      } catch (e) {
        alert('Invalid JSON');
      }
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
      if (
        file.size > MAX_FILE_SIZE &&
        address !==
          'erd1yfxtk0s7eu9eq8zzwsvgsnuq85xrj0yysjhsp28tc2ldrps25mwqztxgph'
      ) {
        alert(
          `Le fichier ${file.name} dépasse la limite de ${MAX_FILE_SIZE_MB} Mo.`
        );
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const formData = new FormData();
    formData.append('collection', collection.collection);
    for (const file of Array.from(files)) {
      formData.append('files', file);
    }
    if (!tokenLogin) {
      return;
    }
    const res = await fetch(`${dinoclaim_api}/pinata/upload`, {
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
    for (const f of data.uploaded) {
      const uri = `https://ipfs.io/ipfs/${f.cid}`;
      if (f.name.endsWith('.json')) {
        setMetaUri(uri);
        handleFetchMetadata(f.cid);
        setUploadedFiles((prev) => [
          // on garde tout sauf les .json
          ...prev.filter((file) => !file.name.toLowerCase().endsWith('.json')),
          { name: f.name, cid: f.cid, url: uri }
        ]);
      } else {
        setUris((prev) => [...prev, ...uri.split('\n')]);
        setUploadedFiles((prev) => [
          ...prev,
          { name: f.name, cid: f.cid, url: uri }
        ]);
      }
    }
  };

  const onDeleteFile = (fileToRemove: { name: string; url: string }) => {
    // Supprimer de uploadedFiles
    setUploadedFiles((prev) => prev.filter((f) => f.url !== fileToRemove.url));

    // Supprimer de uris (si ce n'était pas un .json)
    if (!fileToRemove.name.toLowerCase().endsWith('.json')) {
      setUris((prev) => prev.filter((uri) => uri !== fileToRemove.url));
    }

    // Si fichier JSON → reset les métadonnées
    if (fileToRemove.name.toLowerCase().endsWith('.json')) {
      setMetaUri('');
      setMetadatas('');
      setIpfsData(null);
    }
  };

  return (
    <Dialog open={isOpen} onClose={closeModal} as={Fragment}>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
        <div className='bg-white rounded-lg max-h-[90vh] overflow-y-auto p-6 max-w-lg w-full shadow-lg'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>
              {t('collections:create_new_type', {
                type:
                  collection.type == 'MetaESDT'
                    ? 'MetaESDT'
                    : collection.type == 'NonFungibleESDT'
                    ? 'NFT'
                    : 'SFT'
              })}
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
                {t('collections:name')}
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
                {t('collections:quantity')}
              </label>
              <input
                onWheel={(e) => e.currentTarget.blur()}
                type='number'
                id='quantity'
                value={quantity.toFixed()}
                min='1'
                disabled={collection.type == 'NonFungibleESDT'}
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                onChange={(e) =>
                  setQuantity(
                    new BigNumber(
                      collection.type == 'NonFungibleESDT' ? 1 : e.target.value
                    )
                  )
                }
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

            {/* {collection.type !== 'MetaESDT' && ( */}
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
                htmlFor='metadatas'
                className='block text-sm font-medium text-gray-700'
              >
                Upload IPFS file(s) – 30 days free pinning
                <span className='tooltip'>
                  (ℹ)
                  <span className='text'>
                    Files are pinned 30 days for free to simplify creation.
                    Creators are encouraged to re-pin the files to their own
                    IPFS accounts or use a dedicated long-term pinning service.
                  </span>
                </span>
              </label>
              <input
                type='file'
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    handleUploadToPinata(e.target.files);
                  }
                }}
              />

              {uploadedFiles.length > 0 && (
                <div className='mt-4'>
                  <h4 className='text-sm font-medium mb-2'>📂 Uploaded:</h4>
                  <ul className='text-sm space-y-1'>
                    {uploadedFiles.map((file, index) => (
                      <li
                        key={index}
                        className='flex items-center justify-between'
                      >
                        <a
                          href={file.url}
                          target='_blank'
                          rel='noreferrer'
                          className='text-blue-600 underline truncate max-w-[80%]'
                        >
                          {file.name}
                        </a>
                        <button
                          onClick={() => onDeleteFile(file)}
                          className='ml-2 text-red-500 hover:text-red-700'
                          title='Remove file'
                        >
                          🗑️
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
              {collection.type !== 'MetaESDT' ? (
                <>
                  {ipfsData && (
                    <div className='mt-2'>
                      <h3 className='text-lg font-semibold'>Metadatas:</h3>
                      <pre
                        className='bg-gray-100 p-3 rounded text-sm overflow-y-auto max-h-64 border border-gray-300'
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {JSON.stringify(ipfsData, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {' '}
                  {attributes && (
                    <div className='mt-2'>
                      <h3 className='text-lg font-semibold'>Metadatas:</h3>
                      <pre className='bg-gray-100 p-2 rounded'>
                        {attributes}
                      </pre>
                    </div>
                  )}
                </>
              )}
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
                // value={
                //   collection.type === 'MetaESDT'
                //     ? attributes
                //     : `metadata:${metadatas};tags:${tags}`
                // }
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
            </div>

            <div className='mb-4'>
              <label
                htmlFor='uris'
                className='block text-sm font-medium text-gray-700'
              >
                Metadata URI
              </label>
              <textarea
                id='uris'
                value={metaUri}
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                placeholder='https://ipfs.io/ipfs/ipfsCID/1.mp4
https://ipfs.io/ipfs/ipfsCID/1.json'
                disabled
              />
            </div>

            <div className='mb-4'>
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
            collection={collection}
            name={name.trim()}
            quantity={quantity}
            royalties={royalties}
            hash=''
            attributes={`metadata:${metadatas};tags:${tags}`}
            // attributes={
            //   collection.type === 'MetaESDT'
            //     ? attributes
            //     : `metadata:${metadatas};tags:${tags}`
            // }
            // metada in uris
            uris={[...uris, ...(metaUri ? [metaUri] : [])]}
            // no metadata in uris
            // uris={uris}
            disabled={invalidUris.length > 0 || uris.length === 0}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default CreateSft;
