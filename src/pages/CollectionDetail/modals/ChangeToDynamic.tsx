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
import { useGetAccount } from 'hooks';
import { ActionSetSpecialRole } from 'helpers/actions/ActionSetSpecialRole';
import { is } from '@react-spring/shared';
import { ActionChangeToDynamic } from 'helpers/actions/ActionChangeToDynamic';
import { t } from 'i18next';

export const ChangeToDynamic: React.FC<{
  isOpen: boolean;
  closeModal: () => void;
  collection: Collection;
}> = ({ isOpen, closeModal, collection }) => {
  return (
    <Dialog open={isOpen} onClose={closeModal} as={Fragment}>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
        <div className='bg-white rounded-lg max-h-[90vh] overflow-y-auto p-6 max-w-lg w-full shadow-lg'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>
              {t('collections:convert_to_dynamic', {
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
          <div>
            <p className='text-sm text-gray-500'>
              {t('collections:convert_to_dynamic_warning')}{' '}
            </p>
          </div>
          <ActionChangeToDynamic tokenIdentifier={collection.collection} />
        </div>
      </div>
    </Dialog>
  );
};

export default ChangeToDynamic;
