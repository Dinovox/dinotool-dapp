import React, { Fragment, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Collection } from 'helpers/api/accounts/getCollections';
import { ActionUnFreeze } from 'helpers/actions/ActionUnfreeze';
import BigNumber from 'bignumber.js';
import { t } from 'i18next';
export const UnFreezeAddress: React.FC<{
  isOpen: boolean;
  closeModal: () => void;
  collection: Collection;
}> = ({ isOpen, closeModal, collection }) => {
  const [nonce, setNonce] = useState<BigNumber>(new BigNumber(0));
  const [address, setAddress] = useState<string>('');

  return (
    <Dialog open={isOpen} onClose={closeModal} as={Fragment}>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
        <div className='bg-white rounded-lg max-h-[90vh] overflow-y-auto p-6 max-w-lg w-full shadow-lg'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>
              {t('collections:unfreeze_wallet_for', {
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
            {t('collections:unfreeze_wallet_info')}
            <div className='mb-4'>
              <label
                htmlFor='name'
                className='block text-sm font-medium text-gray-700'
              >
                {t('collections:address_to_unfreeze')}
              </label>
              <input
                type='text'
                id='address'
                value={address}
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className='mb-4'>
              <label
                htmlFor='nonce'
                className='block text-sm font-medium text-gray-700'
              >
                {t('collections:nonce_to_unfreeze')}
              </label>
              <input
                type='number'
                id='nonce'
                value={nonce?.toString() || ''}
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                onChange={(e) => setNonce(new BigNumber(e.target.value))}
              />
            </div>
          </form>
          <ActionUnFreeze
            address={address}
            nonce={nonce}
            tokenIdentifier={collection.collection}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default UnFreezeAddress;
