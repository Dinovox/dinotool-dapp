import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';

import { Collection } from 'helpers/api/accounts/getCollections';

import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { useGetAccountInfo, useGetPendingTransactions } from 'hooks';
import { CreateSft } from './modals/CreateSft';
import { AddRoles } from './modals/AddRoles';
import { ChangeToDynamic } from './modals/ChangeToDynamic';
import { RemoveRoles } from './modals/RemoveRoles';
import { useGetCollections } from 'helpers/api/accounts/getCollections';
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
export type ModalType =
  | 'createSft'
  | 'addRoles'
  | 'removeRoles'
  | 'changeToDynamic'
  | 'stopCreate'
  | 'transferNFTCreateRole'
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
  const { hasPendingTransactions } = useGetPendingTransactions();

  const [tokenIdentifier, setTokenIdentifier] = useState<string>('');

  const { data: collection } = useGetCollections(tokenIdentifier);
  const { data: nfts } = useGetCollectionsNfts(tokenIdentifier);

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

  console.log('definedRoles', definedRoles);
  console.log('collection.roles', collection.roles);
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
              marginRight: '20px',
              position: 'relative',
              zIndex: '1'
            }}
          >
            {' '}
            <button onClick={() => navigate('/collections')} className=''>
              {t('lotteries:return')}
            </button>
          </div>

          <div>
            <CollectionDetailHeader collection={collection} />
            <CollectionDetailProperties collection={collection} />
            <CollectionDetailRoles collection={collection} />
            <Section title={t('collections:available_actions')}>
              <Grid columns={2}>
                {collection.type &&
                  collection.type !== 'FungibleESDT' &&
                  collection.type !== 'NonFungibleESDT' &&
                  collection.type !== 'NonFungibleESDTv2' &&
                  collection.subType != 'DynamicSemiFungibleESDT' && (
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
                        className='dinoButton'
                      >
                        {t('collections:freeze_wallet')} 🔍
                      </button>{' '}
                      <button
                        onClick={() => openModal('unFreezeAddress', collection)}
                        className='dinoButton'
                      >
                        {t('collections:unfreeze_wallet')} 🔍
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
                  collection.canTransferNftCreateRole &&
                  collection.roles?.find?.((r) => r.canCreate) && (
                    <button
                      onClick={() =>
                        openModal('transferNFTCreateRole', collection)
                      }
                      className='dinoButton'
                    >
                      {t('collections:transfer_create_role')} 🔍
                    </button>
                  )}
                {collection.owner == address &&
                  collection.canUpgrade &&
                  collection.roles &&
                  collection?.roles?.length > 1 && (
                    <button
                      onClick={() => openModal('controlChanges', collection)}
                      className='dinoButton'
                    >
                      {t('collections:change_properties')} 🔍
                    </button>
                  )}
                {collection.canAddSpecialRoles &&
                  collection.owner == address && (
                    <button
                      onClick={() => openModal('addRoles', collection)}
                      className='dinoButton'
                    >
                      {t('collections:add_roles')} 🔍
                    </button>
                  )}
                {collection.owner == address &&
                  collection.roles &&
                  collection?.roles?.length > 1 && (
                    <button
                      onClick={() =>
                        openModal('removeRoles', collection, address)
                      }
                      className='dinoButton'
                    >
                      {t('collections:remove_roles')} 🔍
                    </button>
                  )}
                <br />
                {collection.roles?.find?.(
                  (r) => r.address === address && r.canCreate
                ) && (
                  <button
                    onClick={() => openModal('createSft', collection)}
                    className='dinoButton'
                  >
                    {t('collections:create_type', {
                      type:
                        collection.type === 'NonFungibleESDT' ? 'NFT' : 'SFT'
                    })}{' '}
                    🔍
                  </button>
                )}
                {/* {collection.role?.roles && (
                  <p>
                    Roles :{' '}
                    {collection.role.roles &&
                      collection.role.roles.map((role) => role + ' ')}
                  </p>
                )} */}
              </Grid>
            </Section>

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
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
