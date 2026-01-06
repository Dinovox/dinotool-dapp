import { PageWrapper } from 'wrappers';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';

import { Collection } from 'helpers/api/getCollections';

import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useGetCollectionBranding } from 'helpers/api/useGetCollectionBranding';
import DisplayNftByToken from 'helpers/DisplayNftByToken';

import {
  useGetAccountInfo,
  useGetPendingTransactions,
  useGetNetworkConfig
} from 'lib';
import { CreateSft } from './modals/CreateSft';
import { AddRoles } from './modals/AddRoles';
import { ChangeToDynamic } from './modals/ChangeToDynamic';
import { RemoveRoles } from './modals/RemoveRoles';
import { useGetCollections } from 'helpers/api/getCollections';
import {
  useGetCollectionsNfts,
  CollectionNft
} from 'helpers/api/accounts/getCollectionsNfts';
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
import { ArrowRight, Leaf, Plus, Sparkles, ExternalLink } from 'lucide-react';
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
  const { network } = useGetNetworkConfig();
  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  const [tokenIdentifier, setTokenIdentifier] = useState<string>('');

  const [displayedNfts, setDisplayedNfts] = useState<CollectionNft[]>([]);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 100;

  const { data: collection } = useGetCollections(tokenIdentifier);
  const { branding } = useGetCollectionBranding(tokenIdentifier);
  const { data: fetchedNfts, loading: nftsLoading } = useGetCollectionsNfts(
    tokenIdentifier,
    {
      from: page * PAGE_SIZE,
      size: PAGE_SIZE
    }
  );

  useEffect(() => {
    setPage(0);
    setDisplayedNfts([]);
  }, [tokenIdentifier]);

  useEffect(() => {
    if (fetchedNfts && fetchedNfts.length > 0) {
      setDisplayedNfts((prev) => {
        // If it's the first page, replace. If it's a new page (checked by checking if we already have these items? No, simplified assumptions)
        // More robust: If page 0, replace. Else append.
        // We need to be careful not to append the SAME batches if effect runs twice.
        // But fetchedNfts reference changes only when new data comes. state 'page' allows us to know intent.

        // Actually, preventing duplicates based on identifier is safer.
        const newItems = page === 0 ? fetchedNfts : [...prev, ...fetchedNfts];
        // Unique by identifier to be safe against strict mode double-invoke
        const unique = Array.from(
          new Map(newItems.map((item) => [item.identifier, item])).values()
        );
        return unique;
      });
    } else if (page === 0 && !nftsLoading) {
      setDisplayedNfts([]);
    }
  }, [fetchedNfts, page, nftsLoading]);

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

        <div className='mx-6 mt-6'>
          {/* Banner */}
          <div
            className='h-64 w-full bg-center bg-cover rounded-3xl shadow-lg bg-slate-100 relative'
            style={{
              backgroundImage: `url(${
                branding?.images.banner || collection.banner || ''
              })`
            }}
          >
            <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-3xl' />
          </div>

          {/* Info Card - Overlapping Banner */}
          <div className='bg-white/95 backdrop-blur-sm rounded-3xl -mt-20 mx-4 md:mx-8 shadow-xl border border-white/50 relative px-6 py-6 md:px-10'>
            <div className='flex flex-col md:flex-row gap-6 md:items-start'>
              {/* Logo */}
              <div className='-mt-16 flex-shrink-0'>
                {branding?.images.logo ? (
                  <img
                    src={branding.images.logo}
                    alt={collection.name}
                    className='h-32 w-32 rounded-2xl object-cover border-4 border-white shadow-lg bg-white'
                  />
                ) : (
                  <DisplayNftByToken
                    tokenIdentifier={collection.collection}
                    nonce='1'
                    variant='media-only'
                    className='h-32 w-32 rounded-2xl object-cover border-4 border-white shadow-lg bg-white'
                  />
                )}
              </div>

              {/* Text Info */}
              <div className='flex-1 space-y-3 pt-2'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                  <div>
                    <h1 className='text-3xl font-bold text-slate-900 dinoTitle tracking-tight'>
                      {collection.name}
                    </h1>
                    <div className='flex items-center gap-3 mt-2 text-slate-600'>
                      <div className='flex items-center gap-1 font-medium'>
                        <span className='opacity-70 text-sm'>Ticker:</span>
                        <a
                          href={`${network.explorerAddress}/collections/${collection.collection}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1'
                        >
                          {collection.ticker}
                          <ExternalLink className='h-3 w-3' />
                        </a>
                      </div>
                      <span className='w-1 h-1 rounded-full bg-slate-300' />
                      <div className='text-sm flex items-center gap-1'>
                        <span className='opacity-70'>Owner:</span>
                        <ShortenedAddress address={collection.owner} />
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className='flex items-center gap-2 flex-wrap'>
                    <div className='bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium border border-indigo-100 flex items-center gap-1.5 shadow-sm'>
                      <Sparkles className='h-3.5 w-3.5' />
                      {collection.type === 'NonFungibleESDT'
                        ? 'NFT'
                        : collection.type === 'MetaESDT'
                        ? 'MetaESDT'
                        : 'SFT'}
                    </div>
                    {collection.subType?.startsWith('Dynamic') && (
                      <div className='bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-medium border border-amber-100 flex items-center gap-1.5 shadow-sm'>
                        <Sparkles className='h-3.5 w-3.5' />
                        Dynamic
                      </div>
                    )}
                  </div>
                </div>

                <p className='text-gray-600 text-base max-w-3xl leading-relaxed'>
                  {collection.description ||
                    t('collections:controls_collection_info')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-6 py-8 space-y-8'>
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
                        onClick={() => openModal('unFreezeAddress', collection)}
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
                      <ActionUnPause tokenIdentifier={collection.collection} />
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

        <div className='max-w-7xl mx-auto px-6 pb-20'>
          <Section title={t('collections:nfts')}>
            <NftGrid nfts={displayedNfts} />

            {/* Load More Button */}
            {fetchedNfts && fetchedNfts.length === PAGE_SIZE && (
              <div className='flex justify-center mt-8'>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={nftsLoading}
                  className='dinoButton min-w-[200px] flex justify-center'
                >
                  {nftsLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
            {nftsLoading && page > 0 && (
              <div className='text-center mt-2'>Loading more NFTs...</div>
            )}
          </Section>
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
