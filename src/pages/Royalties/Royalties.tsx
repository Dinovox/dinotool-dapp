import React from 'react';
import { PageTemplate } from 'components/PageTemplate';
import { useTranslation } from 'react-i18next';

export const Royalties = () => {
  const { t } = useTranslation();

  return (
    <div className='mx-auto max-w-7xl px-4 py-6'>
      <PageTemplate
        title='Royalties'
        breadcrumbItems={[
          { label: 'Home', path: '/' },
          { label: 'Royalties', path: '/royalties' }
        ]}
      >
        <div className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
          <h2 className='text-lg font-semibold text-slate-900'>
            Rewards & Royalties
          </h2>
          <p className='mt-2 text-slate-500'>
            This page will interface with marketplace contracts to claim
            available rewards.
          </p>
        </div>
      </PageTemplate>
    </div>
  );
};
