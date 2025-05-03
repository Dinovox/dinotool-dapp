import React, { Fragment, useState } from 'react';
import { Dialog } from '@headlessui/react';
import BigNumber from 'bignumber.js';
import { CollectionRole } from 'helpers/api/accounts/getRolesCollections';
import { ActionIssueCollection } from 'helpers/actions/ActionIssueCollection';

export const IssueCollection: React.FC<{
  isOpen: boolean;
  closeModal: () => void;
}> = ({ isOpen, closeModal }) => {
  const [type, setType] = useState<string>('NFT');
  const [name, setName] = useState<string>('');
  const [ticker, setTicker] = useState<string>('');
  //   Token Name:

  //   length between 3 and 50 characters
  //   alphanumeric characters only
  //   Token Ticker:

  //   length between 3 and 10 characters
  //   alphanumeric UPPERCASE only
  return (
    <Dialog open={isOpen} onClose={closeModal} as={Fragment}>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
        <div className='bg-white rounded-lg max-h-[90vh] overflow-y-auto p-6 max-w-lg w-full shadow-lg'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>Create a new Collection</h2>
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
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700'>
                  Type
                </label>
                <div className='mt-2 flex items-center space-x-4'>
                  <label className='flex items-center'>
                    <input
                      type='radio'
                      name='type'
                      value='NFT'
                      className='form-radio text-blue-500'
                      defaultChecked
                      onChange={(e) => {
                        setType(e.target.value);
                      }}
                    />
                    <span className='ml-2 text-sm text-gray-700'>NFT</span>
                  </label>{' '}
                  <label className='flex items-center'>
                    <input
                      type='radio'
                      name='type'
                      value='SFT'
                      className='form-radio text-blue-500'
                      onChange={(e) => {
                        setType(e.target.value);
                      }}
                    />
                    <span className='ml-2 text-sm text-gray-700'>SFT</span>
                  </label>
                </div>
              </div>
              <label
                htmlFor='name'
                className='block text-sm font-medium text-gray-700'
              >
                Name
              </label>
              <input
                type='text'
                id='name'
                value={name}
                maxLength={20}
                pattern='[A-Za-z0-9]{3,20}'
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  const regex = /^[A-Za-z0-9]{0,50}$/;
                  if (regex.test(raw)) {
                    setName(raw);
                  }
                }}
              />
            </div>

            <div className='mb-4'>
              <label
                htmlFor='quantity'
                className='block text-sm font-medium text-gray-700'
              >
                Ticker
              </label>
              <input
                type='text'
                id='ticker'
                value={ticker}
                minLength={3}
                maxLength={10}
                min='1'
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                onChange={(e) => {
                  const raw = e.target.value.toUpperCase().trim();
                  const regex = /^[A-Z0-9]{0,10}$/;
                  if (regex.test(raw)) {
                    setTicker(raw);
                  }
                }}
              />
            </div>
          </form>
          <ActionIssueCollection type={type} name={name} ticker={ticker} />
        </div>
      </div>
    </Dialog>
  );
};

export default IssueCollection;
