import React, { Fragment, useState } from 'react';
import { Dialog } from '@headlessui/react';
import BigNumber from 'bignumber.js';
import { ActionCreateSFT } from 'helpers/actions/ActionCreateSFT';
import { RolesCollections } from 'helpers/api/accounts/getRolesCollections';
import { useGetLoginInfo } from 'lib';
import { m } from 'framer-motion';
import { Nfts } from 'helpers/api/accounts/getNfts';
import { ActionAddQuantity } from 'helpers/actions/ActionAddQuantity';
import { ActionBurnQuantity } from 'helpers/actions/ActionBurnQuantity';

export const BurnQuantity: React.FC<{
  isOpen: boolean;
  closeModal: () => void;
  nfts: Nfts;
}> = ({ isOpen, closeModal, nfts }) => {
  const [quantity, setQuantity] = useState<BigNumber>(new BigNumber(1));

  return (
    <Dialog open={isOpen} onClose={closeModal} as={Fragment}>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
        <div className='bg-white rounded-lg max-h-[90vh] overflow-y-auto p-6 max-w-lg w-full shadow-lg'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>
              Burn quantity from {nfts.identifier}
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
                htmlFor='quantity'
                className='block text-sm font-medium text-gray-700'
              >
                Quantity
              </label>
              <input
                onWheel={(e) => e.currentTarget.blur()}
                type='number'
                id='quantity'
                value={quantity.toFixed()}
                min='1'
                disabled={nfts.type == 'NonFungibleESDT'}
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                onChange={(e) => setQuantity(new BigNumber(e.target.value))}
              />
            </div>
          </form>
          <ActionBurnQuantity
            collection={nfts.collection}
            nonce={nfts.nonce}
            quantity={quantity}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default BurnQuantity;
