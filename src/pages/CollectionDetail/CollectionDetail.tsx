import { PageWrapper } from 'wrappers';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';

import { Collection } from 'helpers/api/getCollections';

import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { useGetAccountInfo, useGetPendingTransactions } from 'lib';
import { CreateSft } from './modals/CreateSft';
import { AddRoles } from './modals/AddRoles';
import { ChangeToDynamic } from './modals/ChangeToDynamic';
import { RemoveRoles } from './modals/RemoveRoles';
import { useGetCollections } from 'helpers/api/getCollections';
import { useGetCollectionsNfts } from 'helpers/api/accounts/getCollectionsNfts';
import TransfertNFTCreateRole from './modals/TransfertNFTCreateRole';
import FreezeAddress from './modals/FreezeAddress';
import UnFreezeAddress from './modals/UnFreezeAddress';
import ControlChanges from './modals/ControlChanges';

import { ActionPause } from 'helpers/actions/ActionPause';
import { ActionUnPause } from 'helpers/actions/ActionUnPause';

import CollectionDetailHeader from './CollectionDetailHeader';
import CollectionDetailProperties from './CollectionDetailProperties';
import CollectionDetailRoles from './CollectionDetailRoles';
import { Section } from './Section';
import { Grid } from './Grid';
import { NftGrid } from './NftGrid';
import { t } from 'i18next';
import { ArrowRight, Leaf, Plus, Sparkles } from 'lucide-react';
import ShortenedAddress from 'helpers/shortenedAddress';
import { DecorativeIconCorners } from 'components/DecorativeIconCorners';
import { Breadcrumb } from 'components/ui/Breadcrumb';
import TransferOwnership from './modals/TransferOwnership';
export type ModalType =
  | 'createSft'
  | 'addRoles'
  | 'removeRoles'
  | 'changeToDynamic'
  | 'stopCreate'
  | 'transferNFTCreateRole'
  | 'transferOwnership'
  | 'controlChanges'
  | 'freezeAddress'
  | 'unFreezeAddress'
  | null;

export interface ModalState {
  type: ModalType;
  collection: Collection | null;
  address?: string;
}

export const CollectionDetail = () => {
  // const [tokenIdentifier, setTokenIdentifier] = useState<string>('');

  const { address } = useGetAccountInfo();
  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  const [tokenIdentifier, setTokenIdentifier] = useState<string>('');

  const { data: collection } = useGetCollections(tokenIdentifier);
  const { data: nfts } = useGetCollectionsNfts(tokenIdentifier);

  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    if (id) {
      setTokenIdentifier(id);
    } else {
      navigate('/marketplace/collections');
    }
  }, [id]);

  const loading = useLoadTranslations('collections');

  const [modal, setModal] = useState<ModalState>({
    type: null,
    collection: null
  });

  const openModal = (
    type: ModalType,
    collection: Collection,
    address?: string
  ) => {
    setModal({ type, collection, address });
  };

  const closeModal = () => {
    setModal({ type: null, collection: null, address: '' });
  };

  useEffect(() => {
    if (!hasPendingTransactions) {
      setModal({ type: null, collection: null, address: '' });
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <PageWrapper>
      <div className='min-h-screen bg-gradient-to-br from-cyan-100 to-cyan-200 relative overflow-hidden'>
        <DecorativeIconCorners animated />

        {/* Header Section - Dinovox Style */}
        <div className='max-w-7xl mx-auto px-6 pt-6'>
          <Breadcrumb
            items={[
              { label: 'Home', path: '/' },
              { label: 'Collections', path: '/collections' },
              { label: collection?.name || 'Collection' }
            ]}
          />
        </div>
        <div className='bg-white/90 backdrop-blur-sm rounded-3xl mx-6 mt-6 shadow-lg border border-white/50'>
          <div className='max-w-7xl mx-auto px-8 py-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <h1
                  className='text-2xl font-bold text-gray-800 dinoTitle'
                  style={{}}
                >
                  {collection.name}
                </h1>
              </div>
              <div className='bg-white rounded-2xl px-4 py-2 shadow-md border border-gray-200'>
                <div className='flex items-center space-x-2 text-sm text-gray-600'>
                  <Sparkles className='h-4 w-4' />
                  <span className='font-medium'>
                    {collection.type == 'NonFungibleESDT'
                      ? 'NFT'
                      : collection.type == 'MetaESDT'
                      ? 'MetaESDT'
                      : 'SFT'}
                  </span>
                </div>
                {collection.subType?.startsWith('Dynamic') && (
                  <div className='bg-white rounded-2xl px-4 py-2 shadow-md border border-gray-200'>
                    <div className='flex items-center space-x-2 text-sm text-gray-600'>
                      <Sparkles className='h-4 w-4' />
                      <span className='font-medium'>
                        <strong>Dynamic</strong>
                      </span>
                    </div>
                  </div>
                )}{' '}
              </div>{' '}
            </div>{' '}
            <p className='text-gray-600 mt-3 text-lg'>
              {t('collections:controls_collection_info')}
            </p>
            <p className='text-gray-600 mt-3 text-lg'>
              Owner: <ShortenedAddress address={collection.owner} />
            </p>
          </div>
          <div>
            {/* <CollectionDetailHeader collection={collection} /> */}
            <CollectionDetailProperties
              collection={collection}
              extraContent={
                collection.owner === address &&
                collection.canUpgrade &&
                collection.roles &&
                collection.roles.length > 1 ? (
                  <button
                    onClick={() => openModal('controlChanges', collection)}
                    className='dinoButton group relative flex items-center justify-center space-x-3'
                  >
                    {t('collections:change_properties')}
                    <ArrowRight className='h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300' />
                  </button>
                ) : null
              }
            />
            <CollectionDetailRoles
              collection={collection}
              extraContent={
                <>
                  {collection.canAddSpecialRoles &&
                    collection.owner == address && (
                      <button
                        onClick={() => openModal('addRoles', collection)}
                        className='dinoButton group relative flex items-center justify-center space-x-3'
                      >
                        {t('collections:add_roles')}{' '}
                        <ArrowRight className='h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300' />
                      </button>
                    )}
                  {collection.owner == address &&
                    collection.roles &&
                    collection?.roles?.length > 1 && (
                      <button
                        onClick={() =>
                          openModal('removeRoles', collection, address)
                        }
                        className='dinoButton group relative flex items-center justify-center space-x-3'
                      >
                        {t('collections:remove_roles')}{' '}
                        <ArrowRight className='h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300' />
                      </button>
                    )}
                </>
              }
            />
            {address && (
              <Section title={t('collections:available_actions')}>
                <Grid columns={2}>
                  {collection.roles?.find?.(
                    (r) => r.address === address && r.canCreate
                  ) && (
                    <button
                      onClick={() => openModal('createSft', collection)}
                      className='dinoButton group relative flex items-center justify-center space-x-3'
                    >
                      <Plus className='h-5 w-5 group-hover:rotate-90 transition-transform duration-300' />
                      {t('collections:create_type', {
                        type:
                          collection.type === 'NonFungibleESDT' ? 'NFT' : 'SFT'
                      })}
                      <ArrowRight className='h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300' />
                    </button>
                  )}
                  {collection.type &&
                    collection.type !== 'FungibleESDT' &&
                    collection.type !== 'NonFungibleESDT' &&
                    collection.type !== 'NonFungibleESDTv2' &&
                    collection.subType != 'DynamicSemiFungibleESDT' &&
                    collection.owner == address && (
                      <button
                        onClick={() => openModal('changeToDynamic', collection)}
                        className='dinoButton'
                      >
                        {t('collections:change_to_dynamic')}
                      </button>
                    )}
                  {collection.canFreeze &&
                    collection.roles &&
                    collection?.roles?.length > 1 &&
                    collection.owner == address && (
                      <>
                        <button
                          onClick={() => openModal('freezeAddress', collection)}
                          className='dinoButton group relative flex items-center justify-center space-x-3'
                        >
                          {t('collections:freeze_wallet')}{' '}
                          <ArrowRight className='h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300' />
                        </button>{' '}
                        <button
                          onClick={() =>
                            openModal('unFreezeAddress', collection)
                          }
                          className='dinoButton group relative flex items-center justify-center space-x-3'
                        >
                          {t('collections:unfreeze_wallet')}{' '}
                          <ArrowRight className='h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300' />
                        </button>
                        {/* <ActionFreeze
                    tokenIdentifier={collection.collection}
                    addressToAssign={''}
                  />{' '}
                  <ActionUnFreeze
                    tokenIdentifier={collection.collection}
                    addressToAssign={''}
                  /> */}
                      </>
                    )}{' '}
                  {collection.canPause &&
                    collection.roles &&
                    collection?.roles?.length > 1 &&
                    collection.owner == address && (
                      <>
                        <ActionPause tokenIdentifier={collection.collection} />{' '}
                        <ActionUnPause
                          tokenIdentifier={collection.collection}
                        />
                      </>
                    )}
                  {collection.owner == address &&
                    collection.canTransferNftCreateRole && (
                      <button
                        onClick={() =>
                          openModal('transferNFTCreateRole', collection)
                        }
                        className='dinoButton group relative flex items-center justify-center space-x-3'
                      >
                        {t('collections:transfer_create_role')}{' '}
                        <ArrowRight className='h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300' />
                      </button>
                    )}{' '}
                  {/* {collection.owner == address &&
                    collection.canChangeOwner && (
                      <button
                        onClick={() =>
                          openModal('transferOwnership', collection)
                        }
                        className='dinoButton group relative flex items-center justify-center space-x-3'
                      >
                        {t('collections:transfer_ownership_role')}{' '}
                        <ArrowRight className='h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300' />
                      </button>
                    )} */}
                </Grid>
              </Section>
            )}

            {/* Stop create is too dangerous to show*/}
            {/* <button
              onClick={() => openModal('stopCreate', collection)}
              className='dinoButton'
            >
              Stop Create
            </button> */}
          </div>

          <NftGrid nfts={nfts} />
        </div>

        {/* Modals */}
        {collection && (
          <>
            <CreateSft
              isOpen={modal.type === 'createSft'}
              closeModal={closeModal}
              collection={collection}
            />
            <AddRoles
              isOpen={modal.type === 'addRoles'}
              closeModal={closeModal}
              collection={collection}
              definedRoles={definedRoles}
            />
            {collection.roles && collection?.roles?.length > 1 && (
              <RemoveRoles
                isOpen={modal.type === 'removeRoles'}
                closeModal={closeModal}
                collection={collection}
                address={modal.address ? modal.address : ''}
              />
            )}
            <ChangeToDynamic
              isOpen={modal.type === 'changeToDynamic'}
              closeModal={closeModal}
              collection={collection}
            />
            {/* <StopCreate
              isOpen={modal.type === 'stopCreate'}
              closeModal={closeModal}
              collection={collection}
            /> */}
            <TransfertNFTCreateRole
              isOpen={modal.type === 'transferNFTCreateRole'}
              closeModal={closeModal}
              collection={collection}
            />
            <TransferOwnership
              isOpen={modal.type === 'transferOwnership'}
              closeModal={closeModal}
              collection={collection}
            />
            <ControlChanges
              isOpen={modal.type === 'controlChanges'}
              closeModal={closeModal}
              collection={collection}
            />
            <FreezeAddress
              isOpen={modal.type === 'freezeAddress'}
              closeModal={closeModal}
              collection={collection}
            />
            <UnFreezeAddress
              isOpen={modal.type === 'unFreezeAddress'}
              closeModal={closeModal}
              collection={collection}
            />
          </>
        )}
      </div>
    </PageWrapper>
  );
};
