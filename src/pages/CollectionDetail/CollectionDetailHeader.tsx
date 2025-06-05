import { Card } from 'antd';
import { Collection } from 'helpers/api/accounts/getCollections';

import React from 'react';
import { Section } from './Section';
import ShortenedAddress from 'helpers/shortenedAddress';

const CollectionDetailHeader: React.FC<{
  collection: Collection;
}> = ({ collection }) => {
  return (
    <Section title={`Collection ${collection.name}`}>
      <h2></h2>
      <p>
        <strong>Type:</strong> {collection.type}
      </p>
      <p>
        <strong>Subtype:</strong> {collection.subType}
      </p>
      <a
        href={`https://explorer.multiversx.com/collections/${collection.collection}`}
        target='_blank'
        rel='noopener noreferrer'
      >
        {collection.collection}
      </a>
      <p>
        Owner: <ShortenedAddress address={collection.owner} />
      </p>
    </Section>
  );
};

export default CollectionDetailHeader;
