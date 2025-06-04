import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { Trans, useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';

import {
  Collection,
  CollectionRole
} from 'helpers/api/accounts/getCollections';

import { Nfts } from 'helpers/api/accounts/getNfts';

import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, Fragment } from 'react';
import BigNumber from 'bignumber.js';
import { Dialog } from '@headlessui/react'; // ou un autre composant modal si tu préfères
import { N, R, u } from 'framer-motion/dist/types.d-B50aGbjN';
import { useGetAccountInfo, useGetPendingTransactions } from 'hooks';

import { useGetCollections } from 'helpers/api/accounts/getCollections';
import { to } from 'react-spring';
import { useGetNfts } from 'helpers/api/accounts/getNfts';
import AddQuantity from './modals/AddQuantity';
import BurnQuantity from './modals/BurnQuantity';
import RecreateSft from './modals/RecreateSft';

export type NModalType = 'addQuantity' | 'burnQuantity' | 'recreateSft' | null;

export interface NModalState {
  type: NModalType;
  nfts: Nfts | null;
  address?: string;
}

export const CollectionIdentifier = () => {
  // const [tokenIdentifier, setTokenIdentifier] = useState<string>('');

  const { address } = useGetAccountInfo();
  const { hasPendingTransactions } = useGetPendingTransactions();

  const [tokenIdentifier, setTokenIdentifier] = useState<string>('');

  const { data: nfts } = useGetNfts(tokenIdentifier);
  console.log('nfts', nfts);
  const { data: collection } = useGetCollections(nfts?.collection);
  console.log('collection ??', collection);
  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    if (id) {
      setTokenIdentifier(id);
    } else {
      navigate('/collections');
    }
  }, [id]);

  const loading = useLoadTranslations('home');
  const { t } = useTranslation();

  const [modal, setModal] = useState<NModalState>({
    type: null,
    nfts: null
  });

  const openModal = (type: NModalType, nfts: Nfts | null, address?: string) => {
    setModal({ type, nfts, address });
  };

  const closeModal = () => {
    setModal({ type: null, nfts: null, address: '' });
  };

  useEffect(() => {
    if (!hasPendingTransactions) {
      setModal({ type: null, nfts: null, address: '' });
    }
  }, [hasPendingTransactions]);

  //liste des roles déjà affectés impossible de les affecter à nouveau
  const IGNORED_ROLES = [
    'ESDTTransferRole',
    'ESDTRoleNFTBurn',
    'ESDTRoleNFTAddQuantity'
  ];
  //update attributes is available for non dynamic NFTs only
  //one per collection for other types
  if (
    collection.type == 'NonFungibleESDT' &&
    collection?.subType === 'NonFungibleESDTv2'
  ) {
    IGNORED_ROLES.push('ESDTRoleNFTUpdateAttributes', 'ESDTRoleNFTAddURI');
  }

  const definedRoles = [
    ...(collection.roles
      ? Array.from(
          new Set(
            collection.roles
              .flatMap((r) => r.roles || [])
              .filter((role) => !IGNORED_ROLES.includes(role))
          )
        )
      : [])
  ];

  console.log('definedRoles', definedRoles);
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthRedirectWrapper requireAuth={true}>
      <PageWrapper>
        <div className='dinocard-wrapper rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          <div
            style={{
              float: 'right',
              marginTop: '20px',
              marginRight: '20px'
            }}
          >
            {' '}
            <button
              onClick={() => navigate('/collections/' + collection.collection)}
              className=''
            >
              {t('lotteries:return')}
            </button>
          </div>

          <div>
            {nfts && (
              <div>
                <h3>NFT Details:</h3>
                <p>Identifier: {nfts.identifier}</p>
                <p>Collection: {nfts.collection}</p>
                <p>
                  Timestamp: {new Date(nfts.timestamp * 1000).toLocaleString()}
                </p>
                <p>Type: {nfts.type}</p>
                <p>SubType: {nfts.subType}</p>
                <p>Name: {nfts.name}</p>
                <p>Creator: {nfts.creator}</p>
                <p>Royalties: {nfts.royalties}%</p>
                <p>Owner: {nfts.owner}</p>
                <p>
                  URL:{' '}
                  <a href={nfts.url} target='_blank' rel='noopener noreferrer'>
                    {nfts.url}
                  </a>
                </p>
                <p>Metadata Description: {nfts.metadata?.description}</p>
                <div>
                  <h4>Attributes:</h4>
                  {nfts.metadata?.attributes?.map((attr, index) => (
                    <p key={index}>
                      {attr.trait_type}: {attr.value}
                    </p>
                  ))}
                </div>
                <div>
                  <h4>Media:</h4>
                  {nfts.media?.map((mediaItem, index) => (
                    <div key={index}>
                      <p>File Type: {mediaItem.fileType}</p>
                      <p>File Size: {mediaItem.fileSize} bytes</p>
                      <img
                        src={mediaItem.thumbnailUrl}
                        alt='NFT Thumbnail'
                        style={{ maxWidth: '200px', marginTop: '10px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {collection &&
              collection.roles &&
              collection.roles.length > 0 &&
              collection.roles
                .filter((role) => role.address) // Filter roles with no address
                .map((role, item) => (
                  <div key={item}>
                    <h3>{role.address}</h3>
                    <p style={{ marginBottom: '10px' }}>
                      {role.roles && role.roles.map((role) => role + ' ')}
                    </p>
                  </div>
                ))}

            {collection.roles?.find?.(
              (r) => r.address === address && r.canAddQuantity
            ) && (
              <button
                onClick={() => openModal('addQuantity', nfts)}
                className='dinoButton'
              >
                Add Quantity
              </button>
            )}

            {collection.roles?.find?.(
              (r) =>
                r.address === address &&
                (r.canBurn || collection.owner === address)
            ) && (
              <button
                onClick={() => openModal('burnQuantity', nfts)}
                className='dinoButton'
              >
                Burn Quantity
              </button>
            )}
            {/* ||
                    collection.owner === address) */}
            {collection.roles &&
              collection.roles.find(
                (r) =>
                  r.address === address &&
                  r.roles.includes('ESDTRoleNFTRecreate')
              ) && (
                <button
                  onClick={() => openModal('recreateSft', nfts)}
                  className='dinoButton'
                >
                  Recreate
                </button>
              )}
          </div>
        </div>

        {/* modals */}
        <AddQuantity
          isOpen={modal.type === 'addQuantity'}
          closeModal={closeModal}
          nfts={nfts}
        />
        <BurnQuantity
          isOpen={modal.type === 'burnQuantity'}
          closeModal={closeModal}
          nfts={nfts}
        />

        <RecreateSft
          isOpen={modal.type === 'recreateSft'}
          closeModal={closeModal}
          nfts={nfts}
        />

        {collection && <></>}
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
