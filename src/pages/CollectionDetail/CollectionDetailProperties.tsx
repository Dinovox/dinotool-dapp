import { Badge } from './Badge';
import { Collection } from 'helpers/api/accounts/getCollections';

import React from 'react';
import { Section } from './Section';
import { t } from 'i18next';

const CollectionDetailProperties: React.FC<{
  collection: Collection;
}> = ({ collection }) => {
  return (
    <Section title={t('collections:properties')}>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
        <Badge color={collection.canUpgrade ? 'green' : 'gray'}>
          {collection.canUpgrade ? 'Can Upgrade' : 'Cannot Upgrade'}
        </Badge>
        <Badge color={collection.canFreeze ? 'green' : 'gray'}>
          {collection.canFreeze ? 'Can Freeze' : 'Cannot Freeze'}
        </Badge>
        <Badge color={collection.canPause ? 'green' : 'gray'}>
          {collection.canPause ? 'Can Pause' : 'Cannot Pause'}
        </Badge>
        <Badge color={collection.canChangeOwner ? 'green' : 'gray'}>
          {collection.canChangeOwner
            ? 'Can Change Owner'
            : 'Cannot Change Owner'}
        </Badge>
        <Badge color={collection.canWipe ? 'green' : 'gray'}>
          {collection.canWipe ? 'Can Wipe' : 'Cannot Wipe'}
        </Badge>
        <Badge color={collection.canPause ? 'green' : 'gray'}>
          {collection.canPause ? 'Can Pause' : 'Cannot Pause'}
        </Badge>
        <Badge color={collection.canTransferNftCreateRole ? 'green' : 'gray'}>
          {collection.canTransferNftCreateRole
            ? 'Can Transfer NFT Create Role'
            : 'Cannot Transfer NFT Create Role'}
        </Badge>
        <Badge color={collection.canAddSpecialRoles ? 'green' : 'gray'}>
          {collection.canAddSpecialRoles
            ? 'Can Add Special Roles'
            : 'Cannot Add Special Roles'}
        </Badge>
        <Badge color={collection.canTransfer ? 'green' : 'red'}>
          {collection.canTransfer ? 'Can Transfer' : 'Cannot Transfer'}
        </Badge>
      </div>
    </Section>
  );
};

export default CollectionDetailProperties;
