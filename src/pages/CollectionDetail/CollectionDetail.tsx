import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { Trans, useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';

import {
  Collection,
  CollectionRole
} from 'helpers/api/accounts/getCollections';

import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, Fragment } from 'react';
import BigNumber from 'bignumber.js';
import { Dialog } from '@headlessui/react'; // ou un autre composant modal si tu préfères
import { R, u } from 'framer-motion/dist/types.d-B50aGbjN';
import { useGetAccountInfo, useGetPendingTransactions } from 'hooks';
import { CreateSft } from './modals/CreateSft';
import { AddRoles } from './modals/AddRoles';
import { ChangeToDynamic } from './modals/ChangeToDynamic';
import { RemoveRoles } from './modals/RemoveRoles';
import { useGetCollections } from 'helpers/api/accounts/getCollections';
import { to } from 'react-spring';
import StopCreate from './modals/StopCreate';
import TransfertNFTCreateRole from './modals/TransfertNFTCreateRole';
import ControlChanges from './modals/ControlChanges';
import { ActionFreeze } from 'helpers/actions/ActionFreeze';
import { ActionUnFreeze } from 'helpers/actions/ActionUnfreeze';
import { ActionPause } from 'helpers/actions/ActionPause';
import { ActionUnPause } from 'helpers/actions/ActionUnPause';

export type ModalType =
  | 'createSft'
  | 'addRoles'
  | 'removeRoles'
  | 'changeToDynamic'
  | 'stopCreate'
  | 'transferNFTCreateRole'
  | 'controlChanges'
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
            <button onClick={() => navigate('/collections')} className=''>
              {t('lotteries:return')}
            </button>
          </div>

          <div>
            <h3>
              Collection:
              <a
                href={`https://explorer.multiversx.com/collections/${collection.collection}`}
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-500 hover:underline'
              >
                {collection.collection}
              </a>
            </h3>
            <h3>Name: {collection.name}</h3>
            <p>Type: {collection.type}</p>
            <p>SubType: {collection.subType}</p>
            {collection.type &&
              collection.type !== 'FungibleESDT' &&
              collection.type !== 'NonFungibleESDT' &&
              collection.type !== 'NonFungibleESDTv2' &&
              collection.subType != 'DynamicSemiFungibleESDT' && (
                <button
                  onClick={() => openModal('changeToDynamic', collection)}
                  className='dinoButton'
                >
                  Upgrade to Dynamic
                </button>
              )}
            <p>Owner: {collection.owner}</p>
            <p>
              {collection.canChangeOwner
                ? 'Can Change Owner'
                : 'Cannot Change Owner'}
            </p>
            <p>{collection.canFreeze ? 'Can Freeze' : 'Cannot Freeze'}</p>
            {collection.canFreeze && (
              <>
                <ActionFreeze
                  tokenIdentifier={collection.collection}
                  addressToAssign={''}
                />{' '}
                <ActionUnFreeze
                  tokenIdentifier={collection.collection}
                  addressToAssign={''}
                />
              </>
            )}{' '}
            <p>{collection.canWipe ? 'Can Wipe' : 'Cannot Wipe'}</p>
            <p>{collection.canPause ? 'Can Pause' : 'Cannot Pause'}</p>
            {collection.canPause && (
              <>
                <ActionPause tokenIdentifier={collection.collection} />{' '}
                <ActionUnPause tokenIdentifier={collection.collection} />
              </>
            )}
            <p>
              {collection.canTransferNftCreateRole
                ? 'Can Transfer NFT Create Role'
                : 'Cannot Transfer NFT Create Role'}
            </p>
            {collection.owner == address &&
              collection.canTransferNftCreateRole &&
              collection.roles?.find?.((r) => r.canCreate) && (
                <button
                  onClick={() => openModal('transferNFTCreateRole', collection)}
                  className='dinoButton'
                >
                  Transfert NFT Create Role
                </button>
              )}
            <p>{collection.canUpgrade ? 'Can Upgrade' : 'Cannot Upgrade'}</p>
            {collection.owner == address && collection.canUpgrade && (
              <button
                onClick={() => openModal('controlChanges', collection)}
                className='dinoButton'
              >
                Change controls
              </button>
            )}
            <p>
              {collection.canAddSpecialRoles
                ? 'Can Add Special Roles'
                : 'Cannot Add Special Roles'}
            </p>
            {collection.canAddSpecialRoles && collection.owner == address && (
              <button
                onClick={() => openModal('addRoles', collection)}
                className='dinoButton'
              >
                Add Roles
              </button>
            )}
            {collection.owner == address &&
              collection.roles &&
              collection?.roles?.length > 1 && (
                <button
                  onClick={() => openModal('removeRoles', collection, address)}
                  className='dinoButton'
                >
                  Removes Roles
                </button>
              )}
            <p>{collection.canTransfer ? 'Can Transfer' : 'Cannot Transfer'}</p>
            <br />
            {collection.roles?.find?.(
              (r) => r.address === address && r.canCreate
            ) && (
              <button
                onClick={() => openModal('createSft', collection)}
                className='dinoButton'
              >
                Create {collection.type === 'NonFungibleESDT' ? 'NFT' : 'SFT'}
              </button>
            )}
            {collection.role?.roles && (
              <p>
                Roles :{' '}
                {collection.role.roles &&
                  collection.role.roles.map((role) => role + ' ')}
              </p>
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
            {/* Stop create is too dangerous to show*/}
            {/* <button
              onClick={() => openModal('stopCreate', collection)}
              className='dinoButton'
            >
              Stop Create
            </button> */}
          </div>
        </div>

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
          </>
        )}
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
