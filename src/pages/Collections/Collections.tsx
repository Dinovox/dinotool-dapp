import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';
import { useAccountsRolesCollections } from 'helpers/api/accounts/getRolesCollections';
import { useNavigate } from 'react-router-dom';
import { useGetAccountInfo } from 'hooks';
import IssueCollection from './modals/IssueCollection';
import { useState } from 'react';
import {
  Plus,
  Grid3X3,
  ArrowRight,
  Sparkles,
  Shield,
  Settings,
  Coins,
  User,
  Leaf
} from 'lucide-react';
import { DecorativeIconCorners } from 'components/DecorativeIconCorners';

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
  } = useAccountsRolesCollections(address, {
    size: 1000
  });

  const loading = useLoadTranslations('collections');
  const { t } = useTranslation();

  // Helper function to get collection badge color
  const getBadgeColor = (type: string, subType?: string) => {
    if (
      subType === 'DynamicMetaESDT' ||
      subType === 'DynamicSemiFungibleESDT' ||
      subType === 'DynamicNonFungibleESDT'
    )
      return 'bg-blue-400 text-white';
    if (type === 'MetaESDT') return 'bg-green-400 text-white';
    if (type === 'NonFungibleESDT') return 'bg-purple-400 text-white';
    return 'bg-gray-400 text-white';
  };

  // Helper function to count active permissions
  const getActivePermissions = (item: any) => {
    const permissions = [
      item.canFreeze,
      item.canWipe,
      item.canPause,
      item.canTransferNftCreateRole,
      item.canChangeOwner,
      item.canUpgrade,
      item.canAddSpecialRoles
    ];
    return permissions.filter(Boolean).length;
  };

  // Helper function to count active roles
  const getActiveRoles = (item: any) => {
    return item.role?.roles?.length || 0;
  };

  if (loading || loadingCollections) {
    return (
      <AuthRedirectWrapper requireAuth={true}>
        <PageWrapper>
          <div className='min-h-screen bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent'></div>
              <p className='text-gray-700 font-semibold text-lg'>
                Chargement...
              </p>
            </div>
          </div>
        </PageWrapper>
      </AuthRedirectWrapper>
    );
  }

  return (
    <AuthRedirectWrapper requireAuth={true}>
      <PageWrapper>
        <div className='min-h-screen bg-gradient-to-br from-cyan-100 to-cyan-200 relative overflow-hidden'>
          <DecorativeIconCorners animated />

          {/* Header Section - Dinovox Style */}
          <div className='bg-white/90 backdrop-blur-sm rounded-3xl mx-6 mt-6 shadow-lg border border-white/50'>
            <div className='max-w-7xl mx-auto px-8 py-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-4'>
                  <h1
                    className='text-2xl font-bold text-gray-800 dinoTitle'
                    style={{}}
                  >
                    {t('collections:my_collections')}
                  </h1>
                </div>
                <div className='bg-white rounded-2xl px-4 py-2 shadow-md border border-gray-200'>
                  <div className='flex items-center space-x-2 text-sm text-gray-600'>
                    <Sparkles className='h-4 w-4' />
                    <span className='font-medium'>
                      {t('collections:x_collections', {
                        x: collections?.length || 0,
                        s: collections?.length > 1 ? 's' : ''
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <p className='text-gray-600 mt-3 text-lg'>
                {t('collections:my_collections_info')}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className='max-w-7xl mx-auto px-6 py-8'>
            {/* Create New Collection Card */}
            <div className='mb-8'>
              <button
                onClick={openModal}
                className='dinoButton group relative flex items-center justify-center space-x-3'
              >
                <Plus className='h-5 w-5 group-hover:rotate-90 transition-transform duration-300' />
                <span>{t('collections:new_collection')}</span>
                <ArrowRight className='h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300' />
              </button>
            </div>

            {/* Collections Grid - Dinovox Style */}
            {collections && collections.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                {collections.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => navigate(`/collections/${item.collection}`)}
                    className='group cursor-pointer bg-white rounded-3xl shadow-lg hover:shadow-xl border border-gray-200 hover:border-yellow-300 transition-all duration-300 transform hover:-translate-y-2 overflow-hidden'
                  >
                    {/* Collection Image Area - Dinovox Style */}
                    <div
                      className={`relative h-48  group-hover:scale-105 transition-transform duration-300`}
                    >
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <div className='w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm'>
                          <Grid3X3 className='h-12 w-12 text-white/80' />
                        </div>
                      </div>

                      {/* Type Badge */}
                      <div className='absolute top-3 left-3'>
                        <div
                          className={`${getBadgeColor(
                            item.type,
                            item.subType
                          )} rounded-xl px-3 py-1 text-xs font-bold shadow-lg`}
                        >
                          {item.subType || item.type}
                        </div>
                      </div>

                      {/* Hover Arrow */}
                      <div className='absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                        <div className='bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg'>
                          <ArrowRight className='h-4 w-4 text-gray-700' />
                        </div>
                      </div>
                    </div>

                    {/* Collection Info - Dinovox Style */}
                    <div className='p-5'>
                      <div className='mb-4'>
                        <h3 className='text-lg font-bold text-gray-800 group-hover:text-yellow-600 transition-colors duration-300 truncate'>
                          {item.name}
                        </h3>
                        <p className='text-xs text-gray-500 mt-1 truncate bg-gray-50 px-2 py-1 rounded-lg font-mono'>
                          {item.ticker}
                        </p>
                      </div>

                      {/* Stats - Dinovox Style */}
                      <div className='grid grid-cols-2 gap-3 mb-4'>
                        <div className='bg-blue-50 rounded-xl p-3 border border-blue-100'>
                          <div className='flex items-center space-x-1 mb-1'>
                            <Shield className='h-3 w-3 text-blue-500' />
                            <span className='text-xs font-medium text-blue-700'>
                              Permissions
                            </span>
                          </div>
                          <span className='text-lg font-bold text-blue-800'>
                            {getActivePermissions(item)}/7
                          </span>
                        </div>
                        <div className='bg-green-50 rounded-xl p-3 border border-green-100'>
                          <div className='flex items-center space-x-1 mb-1'>
                            <Settings className='h-3 w-3 text-green-500' />
                            <span className='text-xs font-medium text-green-700'>
                              Rôles
                            </span>
                          </div>
                          <span className='text-lg font-bold text-green-800'>
                            {getActiveRoles(item)}
                          </span>
                        </div>
                      </div>

                      {/* Capabilities - Dinovox Style */}
                      <div className='space-y-2 mb-4'>
                        <div className='flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2'>
                          <span className='text-gray-700 font-medium'>
                            Création
                          </span>
                          <div
                            className={`w-3 h-3 rounded-full ${
                              item.role?.canCreate
                                ? 'bg-green-400'
                                : 'bg-gray-300'
                            }`}
                          ></div>
                        </div>
                        <div className='flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2'>
                          <span className='text-gray-700 font-medium'>
                            Transfert
                          </span>
                          <div
                            className={`w-3 h-3 rounded-full ${
                              item.canTransfer
                                ? 'bg-green-400'
                                : item.role?.canTransfer
                                ? 'bg-orange-300'
                                : 'bg-red-500'
                            }`}
                          ></div>
                        </div>
                        <div className='flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2'>
                          <span className='text-gray-700 font-medium'>
                            Destruction
                          </span>
                          <div
                            className={`w-3 h-3 rounded-full ${
                              item.role?.canBurn
                                ? 'bg-green-400'
                                : 'bg-gray-300'
                            }`}
                          ></div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className='flex items-center justify-between pt-3 border-t border-gray-100'>
                        <div className='flex items-center space-x-1 text-xs text-gray-500'>
                          {/* <User className='h-3 w-3' />
                          <span className='font-medium'>Propriétaire</span> */}
                        </div>
                        <div className='text-xs text-gray-400 group-hover:text-yellow-500 transition-colors duration-300 font-medium'>
                          Voir détails →
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State - Dinovox Style */
              <div className='text-center py-16'>
                <div className='max-w-md mx-auto'>
                  <div className='bg-yellow-400 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg'>
                    <Grid3X3 className='h-12 w-12 text-gray-800' />
                  </div>
                  <h3 className='text-2xl font-bold text-gray-800 mb-3'>
                    Aucune collection
                  </h3>
                  <p className='text-gray-600 mb-8 text-lg'>
                    Créez votre première collection NFT dans le Fenuaverse !
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal */}
          <IssueCollection isOpen={isModalOpen} closeModal={closeModal} />
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
