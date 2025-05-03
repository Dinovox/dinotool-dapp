import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';
import {
  useAccountsRolesCollections,
  CollectionRole
} from 'helpers/api/accounts/getRolesCollections';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, Fragment } from 'react';
import { ActionCreateSFT } from 'helpers/actions/ActionCreateSFT';
import BigNumber from 'bignumber.js';
import { Dialog } from '@headlessui/react'; // ou un autre composant modal si tu préfères
import { R } from 'framer-motion/dist/types.d-B50aGbjN';
import { useGetAccountInfo } from 'hooks';
import { ActionAssignRole } from 'helpers/actions/ActionAssignRole';
import { CreateSft } from './modals/CreateSft';
export const CollectionDetail = () => {
  // const [tokenIdentifier, setTokenIdentifier] = useState<string>('');

  const { address } = useGetAccountInfo();
  const [tokenIdentifier, setTokenIdentifier] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] =
    useState<CollectionRole | null>(null);

  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    if (id) {
      setTokenIdentifier(id);
    } else {
      navigate('/collections');
    }
  }, [id]);

  const {
    data: collections,
    loading: loadingCollections,
    error
  } = useAccountsRolesCollections(
    // 'erd1yfxtk0s7eu9eq8zzwsvgsnuq85xrj0yysjhsp28tc2ldrps25mwqztxgph',
    address,
    {
      search: id ? id : ''
    }
  );
  console.log('roles', collections);

  const loading = useLoadTranslations('home');
  const { t } = useTranslation();

  const openModal = (collection: CollectionRole) => {
    setSelectedCollection(collection);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCollection(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthRedirectWrapper requireAuth={true}>
      <PageWrapper>
        <div className='dinocard-wrapper rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          {collections.map((item, index) => (
            <div key={index}>
              <h3>{item.collection}</h3>
              <h3>Name: {item.name}</h3>
              <p>Owner: {item.owner}</p>
              <p>
                {item.canChangeOwner ? 'canChangeOwner' : 'no canChangeOwner'}
              </p>
              <p>{item.type}</p>
              <p>
                {item.role.canAddQuantity
                  ? 'canAddQuantity'
                  : 'no canAddQuantity'}
              </p>
              <p>{item.role.canAddUri ? 'canAddUri' : 'no canAddUri'}</p>
              <p>{item.role.canBurn ? 'canBurn' : 'no canBurn'}</p>
              <p>{item.role.canCreate ? 'canCreate' : 'no canCreate'}</p>
              <p>
                {item.role.canUpdateAttributes
                  ? 'canUpdateAttributes'
                  : 'no canUpdateAttributes'}
              </p>

              <br />

              {item.role.roles ? (
                <p>
                  Roles :{' '}
                  {item.role.roles && item.role.roles.map((role) => role + ' ')}
                </p>
              ) : (
                <ActionAssignRole
                  tokenIdentifier={tokenIdentifier}
                  addressToAssign={address}
                  roles={
                    item.type == 'NonFungibleESDT'
                      ? ['ESDTRoleNFTCreate', 'ESDTRoleNFTBurn']
                      : [
                          'ESDTRoleNFTCreate',
                          'ESDTRoleNFTAddQuantity',
                          'ESDTRoleNFTBurn'
                        ]
                  }
                  disabled={false}
                />
              )}
              {item.role.canCreate && (
                <button onClick={() => openModal(item)} className='dinoButton'>
                  Create {item.type == 'NonFungibleESDT' ? 'NFT' : 'SFT'}
                </button>
              )}
            </div>
          ))}
        </div>

        {selectedCollection && (
          <CreateSft
            isOpen={isModalOpen}
            closeModal={closeModal}
            selectedCollection={selectedCollection}
          />
        )}
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
