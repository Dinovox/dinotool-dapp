import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';
import { useAccountsRolesCollections } from 'helpers/api/accounts/getRolesCollections';
import { useNavigate } from 'react-router-dom';
import { useGetAccountInfo } from 'hooks';
import IssueCollection from './modals/IssueCollection';
import { useState } from 'react';

export const Collections = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  const { address } = useGetAccountInfo();
  const {
    data: collections,
    loading: loadingCollections,
    error
  } = useAccountsRolesCollections(
    address,
    // 'erd1yfxtk0s7eu9eq8zzwsvgsnuq85xrj0yysjhsp28tc2ldrps25mwqztxgph',
    {
      size: 1000
    }
  );

  console.log('roles', collections);

  const loading = useLoadTranslations('collections');
  const { t } = useTranslation();

  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <AuthRedirectWrapper requireAuth={true}>
      <PageWrapper>
        <div className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          <div className='navigation-cards '>
            {collections.map((item, index) => (
              <div
                className={`nav-card`}
                key={index}
                onClick={() => navigate(`/collections/${item.collection}`)}
              >
                <div className='nav-card-content'>
                  <h3>{item.collection}</h3> <p>{item.name}</p>
                </div>
              </div>
            ))}{' '}
            <button onClick={() => openModal()} className='dinoButton'>
              {t('collections:new_collection')}
            </button>
            <IssueCollection isOpen={isModalOpen} closeModal={closeModal} />
          </div>
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
