import React, { Fragment, useState } from 'react';
import { Dialog } from '@headlessui/react';

import { Collection } from 'helpers/api/accounts/getCollections';
import { ActionTransferOwnership } from 'helpers/actions/ActionTransferOwnership';
import { t } from 'i18next';

export const TransferOwnership: React.FC<{
  isOpen: boolean;
  closeModal: () => void;
  collection: Collection;
}> = ({ isOpen, closeModal, collection }) => {
  const [newAddress, setNewAddress] = useState<string>('');

  // const handleRoleToggle = (role: string) => {
  //   if (collection_roles?.role?.roles?.includes(role)) return;
  //   if (definedRoles.includes(role)) return;
  //   setNewRoles((prev) =>
  //     prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
  //   );
  // };

  // console.log('newRoles', newRoles);

  return (
    <Dialog open={isOpen} onClose={closeModal} as={Fragment}>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
        <div className='bg-white rounded-lg max-h-[90vh] overflow-y-auto p-6 max-w-lg w-full shadow-lg'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>
              {t('collections:transfer_create_role_from', {
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
            {t('collections:transfer_create_role_info')}

            <div className='mb-4'>
              <label
                htmlFor='name'
                className='block text-sm font-medium text-gray-700'
              >
                {t('collections:new_address')}
              </label>
              <input
                type='text'
                id='address'
                value={newAddress}
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                onChange={(e) => setNewAddress(e.target.value)}
              />
            </div>
          </form>
          <ActionTransferOwnership
            newAddress={newAddress}
            tokenIdentifier={collection.collection}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default TransferOwnership;
