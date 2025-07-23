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
import { ActionControlChanges } from 'helpers/actions/ActionControlChanges';
import { t } from 'i18next';
import { Tooltip } from 'components/Tooltip';

type Props = {
  collection: Record<string, any>; // Pas de typage strict ici
};

export const ControlChanges: React.FC<{
  isOpen: boolean;
  closeModal: () => void;
  collection: Collection;
}> = ({ isOpen, closeModal, collection }) => {
  const [formValues, setFormValues] = useState<
    Partial<Record<string, boolean>>
  >({});

  //canCreateMultiShard todo explore this argument
  //cannot use keyof Collection here because canTransferNFTCreateRole has bad case
  const controls = [
    'canFreeze',
    'canWipe',
    'canPause',
    'canTransferNFTCreateRole',
    'canChangeOwner',
    'canUpgrade',
    'canAddSpecialRoles'
  ] as const;

  type VmControl = (typeof controls)[number];
  const controlToTsKey: Record<VmControl, keyof Collection> = {
    canFreeze: 'canFreeze',
    canWipe: 'canWipe',
    canPause: 'canPause',
    canTransferNFTCreateRole: 'canTransferNftCreateRole', // mapping nécessaire
    canChangeOwner: 'canChangeOwner',
    canUpgrade: 'canUpgrade',
    canAddSpecialRoles: 'canAddSpecialRoles'
  };

  useEffect(() => {
    // Initialise le formulaire avec les valeurs actuelles de la collection
    const initialValues: Partial<Record<string, boolean>> = {};
    controls.forEach((ctrl) => {
      initialValues[ctrl] = !!collection[controlToTsKey[ctrl]];
      //initialValues[ctrl] = !!collection[ctrl as keyof Collection];
    });
    setFormValues(initialValues);
  }, [collection]);

  const handleChange = (ctrl: string) => {
    setFormValues((prev) => ({
      ...prev,
      [ctrl]: !prev[ctrl]
    }));
  };

  return (
    <Dialog open={isOpen} onClose={closeModal} as={Fragment}>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40'>
        <div className='bg-white rounded-lg max-h-[90vh] overflow-y-auto p-6 max-w-lg w-full shadow-lg'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>
              {t('collections:change_properties_of', {
                collection: collection.name
              })}
            </h2>
            <button
              onClick={closeModal}
              className='text-gray-500 hover:text-gray-700'
            >
              ✕
            </button>
          </div>{' '}
          {t('collections:change_properties_time')}
          <div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
              {controls.map((ctrl) => (
                <div
                  key={ctrl}
                  className='flex items-center justify-between p-3 border border-gray-200 rounded bg-white shadow-sm'
                >
                  <label className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      checked={formValues[ctrl] || false}
                      onChange={() => handleChange(ctrl)}
                      className='h-4 w-4 text-blue-600 border-gray-300 rounded'
                    />
                    <span className='text-sm font-medium text-gray-800 capitalize'>
                      <Tooltip content={t(`collections:${ctrl}`)}>
                        {ctrl.replace('can', '')}
                      </Tooltip>
                    </span>
                  </label>

                  <span
                    className={`text-sm font-medium ${
                      formValues[ctrl] ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {formValues[ctrl] ? 'Assigned' : 'Not assigned'}
                  </span>
                </div>
              ))}{' '}
            </div>
          </div>
          <ActionControlChanges
            tokenIdentifier={collection.collection}
            controls={formValues}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default ControlChanges;
