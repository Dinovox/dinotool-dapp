import { Badge, Card, Grid, Row } from 'antd';
import { Collection } from 'helpers/api/accounts/getCollections';
import React from 'react';
import { Section } from './Section';
import { t } from 'i18next';
const CollectionDetailRoles: React.FC<{
  collection: Collection;
}> = ({ collection }) => {
  return (
    <Section title={t('collections:assigned_roles')} className='roles-section'>
      {collection.roles &&
        collection.roles.map((role) => (
          <Card>
            <p>
              <strong>{role.address}</strong>
            </p>
            <p>{role.roles.join(', ')}</p>
          </Card>
        ))}
    </Section>
  );
};

export default CollectionDetailRoles;
