import React, { Fragment, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { ActionCreateSFT } from 'helpers/actions/ActionCreateSFT';
import {
  RolesCollections,
  useAccountsRolesCollections
} from 'helpers/api/accounts/getRolesCollections';
import { useGetAccount } from 'lib';
import { ActionUnsetSpecialRole } from 'helpers/actions/ActionUnsetSpecialRole';
import { Collection } from 'helpers/api/accounts/getCollections';
import { t } from 'i18next';

export const RemoveRoles: React.FC<{
  isOpen: boolean;
  closeModal: () => void;
  collection: Collection;
  address: string;
}> = ({ isOpen, closeModal, collection, address }) => {
  const { address: defaultAddress } = useGetAccount();
  const [role_address, setAddress] = useState<string>(
    address || defaultAddress
  );
  const [newRoles, setNewRoles] = useState<string[]>([]);

  const { data: temp } = useAccountsRolesCollections(role_address, {
    search: collection.collection
  });
  const collection_roles = temp?.find(
    (r: RolesCollections) => r.collection === collection.collection
  );
  // console.log('collection!?', collection_roles);

  const handleRoleToggle = (role: string) => {
    setNewRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  return (
    <Dialog open={isOpen} onClose={closeModal} as={Fragment}>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
        <div className='bg-white rounded-lg max-h-[90vh] overflow-y-auto p-6 max-w-lg w-full shadow-lg'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>
              {t('collections:remove_roles_from', {
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
                value={role_address}
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
              {collection_roles?.role?.roles?.map((role) => {
                const isChecked = newRoles?.includes(role);

                return (
                  <div key={role}>
                    <input
                      type='checkbox'
                      id={role}
                      className='hidden peer'
                      checked={isChecked}
                      disabled={role === 'ESDTRoleNFTCreate'}
                      onChange={() => handleRoleToggle(role)}
                    />
                    <label
                      htmlFor={role}
                      className={`
                        flex items-center gap-2 p-3 rounded border text-sm font-medium
                        ${
                          role === 'ESDTRoleNFTCreate'
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
                      {role}
                    </label>
                  </div>
                );
              })}
            </div>
          </form>
          <ActionUnsetSpecialRole
            tokenIdentifier={collection.collection}
            addressToAssign={role_address}
            roles={newRoles}
            disabled={!address || newRoles.length === 0}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default RemoveRoles;
