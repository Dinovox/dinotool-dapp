import { Badge, Card, Grid, Row } from 'antd';
import { Collection } from 'helpers/api/accounts/getCollections';
import React from 'react';
import { Section } from './Section';
import { t } from 'i18next';
import ShortenedAddress from 'helpers/shortenedAddress';
const CollectionDetailRoles: React.FC<{
  collection: Collection;
  extraContent?: React.ReactNode;
}> = ({ collection, extraContent }) => {
  return (
    <Section title={t('collections:assigned_roles')} className='roles-section'>
      {extraContent && <div className='mb-4'>{extraContent}</div>}
      {collection.roles &&
        collection.roles.map((role) => (
          <Card>
            <p>
              <strong>
                <ShortenedAddress address={role.address} />
              </strong>
            </p>
            <p>{role.roles.join(', ')}</p>
          </Card>
        ))}
    </Section>
  );
};

export default CollectionDetailRoles;
