import React, { Fragment, useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { ActionCreateSFT } from 'helpers/actions/ActionCreateSFT';
import {
  RolesCollections,
  useAccountsRolesCollections
} from 'helpers/api/accounts/getRolesCollections';
import {
  Collection,
  CollectionRole
} from 'helpers/api/accounts/getCollections';
import { useGetAccount } from 'lib';
import { ActionSetSpecialRole } from 'helpers/actions/ActionSetSpecialRole';
import { t } from 'i18next';
import { Tooltip } from 'components/Tooltip';

export const AddRoles: React.FC<{
  isOpen: boolean;
  closeModal: () => void;
  collection: Collection;
  definedRoles: any[];
}> = ({ isOpen, closeModal, collection, definedRoles }) => {
  const { address: defaultAddress } = useGetAccount();
  const [address, setAddress] = useState<string>(defaultAddress || '');
  const [newRoles, setNewRoles] = useState<string[]>([]);

  const { data: temp } = useAccountsRolesCollections(address, {
    search: collection.collection
  });

  const collection_roles = temp?.find(
    (r: RolesCollections) => r.collection === collection.collection
  );

  const sftRoles = [
    'ESDTRoleNFTCreate',
    'ESDTRoleNFTBurn',
    'ESDTRoleNFTAddQuantity',
    'ESDTTransferRole'
  ];

  collection.subType === 'DynamicSemiFungibleESDT' &&
    sftRoles.push(
      'ESDTRoleNFTUpdate',
      'ESDTRoleModifyRoyalties',
      'ESDTRoleSetNewURI',
      'ESDTRoleModifyCreator',
      'ESDTRoleNFTRecreate'
    );
  // ESDTRoleNFTCreate -> this role allows one to create a new SFT
  // ESDTRoleNFTBurn -> this role allows one to burn quantity of a specific SFT
  // ESDTRoleNFTAddQuantity -> this role allows one to add quantity of a specific SFT
  // ESDTTransferRole -> this role enables transfer only to specified addresses. The addresses with the transfer role can transfer anywhere.
  // ESDTRoleNFTUpdate -> this role allows one to update meta data attributes of a specific SFT
  // ESDTRoleModifyRoyalties -> this role allows one to modify royalities of a specific SFT
  // ESDTRoleSetNewURI -> this role allows one to set new uris of a specific SFT
  // ESDTRoleModifyCreator -> this role allows one to rewrite the creator of a specific token
  // ESDTRoleNFTRecreate -> this role allows one to recreate the whole NFT with new attributes

  const nftRoles = [
    'ESDTRoleNFTCreate',
    'ESDTRoleNFTBurn',
    'ESDTRoleNFTUpdateAttributes',
    'ESDTRoleNFTAddURI',
    'ESDTTransferRole'
  ];

  collection.subType === 'DynamicNonFungibleESDT' &&
    nftRoles.push(
      'ESDTRoleNFTUpdate',
      'ESDTRoleModifyRoyalties',
      'ESDTRoleSetNewURI',
      'ESDTRoleModifyCreator',
      'ESDTRoleNFTRecreate'
    );

  const roles = collection.type === 'NonFungibleESDT' ? nftRoles : sftRoles;

  //role create is ONLY for owner? and cannot be removed
  useEffect(() => {
    const isAlreadyAssigned =
      collection_roles?.role?.roles?.includes('ESDTRoleNFTCreate');
    const isAlreadyInNew =
      definedRoles.includes('ESDTRoleNFTCreate') ||
      newRoles.includes('ESDTRoleNFTCreate');

    if (
      collection_roles &&
      !isAlreadyAssigned &&
      !isAlreadyInNew &&
      address == defaultAddress
    ) {
      //Owner sans role create -> On ajoute
      console.log('test', isAlreadyAssigned, isAlreadyInNew);
      setNewRoles((prev) => [...prev, 'ESDTRoleNFTCreate']);
    } else if (
      collection &&
      isAlreadyAssigned &&
      isAlreadyInNew &&
      address != defaultAddress
    ) {
      //pas owner -> On enlève le role create (pas possible de l'ajouter au sc)
      setNewRoles((prev) => prev.filter((r) => r !== 'ESDTRoleNFTCreate'));
    }
  }, [collection, newRoles, address, collection_roles]);

  const handleRoleToggle = (role: string) => {
    if (collection_roles?.role?.roles?.includes(role)) return;
    if (definedRoles.includes(role)) return;
    setNewRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  // console.log('newRoles', newRoles);

  return (
    <Dialog open={isOpen} onClose={closeModal} as={Fragment}>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
        <div className='bg-white rounded-lg max-h-[90vh] overflow-y-auto p-6 max-w-lg w-full shadow-lg'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>
              {t('collections:add_roles_to', {
                collection: collection.name
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
                {t('collections:address')}
              </label>
              <input
                type='text'
                id='address'
                value={address}
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
              {roles.map((role) => {
                const isAssigned =
                  collection_roles?.role?.roles?.includes(role);
                const isChecked = isAssigned || newRoles?.includes(role);
                const isDisabled = definedRoles.includes(role);

                return (
                  <div key={role}>
                    <input
                      type='checkbox'
                      id={role}
                      className='hidden peer'
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => handleRoleToggle(role)}
                    />
                    <label
                      htmlFor={role}
                      className={`
            flex items-center gap-2 p-3 rounded border text-sm font-medium
            ${
              isAssigned || isDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                : 'bg-white hover:bg-blue-50 text-gray-800 cursor-pointer'
            }
            peer-checked:ring-2 peer-checked:ring-blue-500 peer-disabled:cursor-not-allowed
          `}
                    >
                      <div
                        className={`
              w-4 h-4 border border-gray-300 rounded-sm flex items-center justify-center
              ${isChecked ? 'bg-blue-600' : 'bg-white'}
              ${isAssigned ? 'border-gray-200' : ''}
            `}
                      >
                        {isChecked && (
                          <svg
                            className='w-3 h-3 text-white'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='3'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                        )}
                      </div>
                      <Tooltip content={t(`collections:${role}`)}>
                        {role}
                      </Tooltip>
                    </label>
                  </div>
                );
              })}
            </div>
          </form>
          {newRoles.includes('ESDTTransferRole') && (
            <div className='mt-4 p-4 bg-yellow-100 text-yellow-800 rounded'>
              Warning: When the <strong>Transfer</strong> role is assigned, the
              collection becomes restricted. Tokens can only be transferred{' '}
              <strong>to and from addresses</strong> that hold this role.{' '}
            </div>
          )}
          <ActionSetSpecialRole
            tokenIdentifier={collection.collection}
            addressToAssign={address}
            roles={newRoles}
            disabled={!address || newRoles.length === 0}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default AddRoles;
