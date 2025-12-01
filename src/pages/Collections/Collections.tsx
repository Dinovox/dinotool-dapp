import { PageWrapper } from 'wrappers';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';
import { useAccountsRolesCollections } from 'helpers/api/accounts/getRolesCollections';
import { useNavigate } from 'react-router-dom';
import { useGetAccountInfo } from 'lib';
import IssueCollection from './modals/IssueCollection';
import { useEffect, useState } from 'react';
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
import { internal_api_v2 } from 'config';
import { Breadcrumb } from 'components/ui/Breadcrumb';

export const Collections = () => {
  const [collectionsData, setCollectionsData] = useState<Record<string, any>>(
    {}
  );

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
      item.canTransferNFTCreateRole,
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

  useEffect(() => {
    const fetchCollectionDetails = async () => {
      if (!collections || collections.length === 0) return;

      const results = await Promise.all(
        collections.map(async (col) => {
          try {
            const res = await fetch(
              `${internal_api_v2}/collections/${col.collection}`
            );
            const data = await res.json();
            return { id: col.collection, data };
          } catch {
            return { id: col.collection, data: null };
          }
        })
      );

      const mapped = results.reduce(
        (acc, curr) => {
          acc[curr.id] = curr.data;
          return acc;
        },
        {} as Record<string, any>
      );

      setCollectionsData(mapped);
    };

    fetchCollectionDetails();
  }, [collections]);

  if (loading || loadingCollections) {
    return (
      <PageWrapper>
        <div className='min-h-screen bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center'>
          <div className='flex flex-col items-center space-y-4'>
            <div className='animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent'></div>
            <p className='text-gray-700 font-semibold text-lg'>Chargement...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className='min-h-screen bg-gradient-to-br from-cyan-100 to-cyan-200 relative overflow-hidden'>
        <DecorativeIconCorners animated />

        {/* Breadcrumb */}
        <div className='max-w-7xl mx-auto px-6 pt-6'>
          <Breadcrumb
            items={[{ label: 'Home', path: '/' }, { label: 'Collections' }]}
          />
        </div>

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
          {loading || loadingCollections ? (
            <div className='flex justify-center items-center py-20 text-gray-500'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3'></div>
              Chargement...
            </div>
          ) : collections && collections.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {collections.map((item, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/collections/${item.collection}`)}
                  className='group cursor-pointer bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col h-full'
                >
                  {/* Collection Image Area */}
                  <div className='relative h-48 bg-gray-100 overflow-hidden'>
                    {collectionsData[item.collection] ? (
                      <img
                        src={
                          collectionsData[item.collection].cover ||
                          '/cards/wip.png'
                        }
                        alt={item.name}
                        className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-gray-300'>
                        <Grid3X3 className='h-12 w-12' />
                      </div>
                    )}

                    {/* Type Badge */}
                    <div className='absolute top-3 left-3'>
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm ${getBadgeColor(
                          item.type,
                          item.subType
                        )}`}
                      >
                        {item.subType || item.type}
                      </span>
                    </div>
                  </div>

                  {/* Collection Info */}
                  <div className='p-4 flex-1 flex flex-col'>
                    <div className='mb-4'>
                      <h3 className='text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate'>
                        {item.name}
                      </h3>
                      <p className='text-xs text-gray-500 mt-1 truncate font-mono bg-gray-50 inline-block px-2 py-1 rounded'>
                        {item.ticker}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className='grid grid-cols-2 gap-3 mb-4 mt-auto'>
                      <div className='bg-gray-50 rounded-lg p-2 text-center'>
                        <div className='text-xs text-gray-500 mb-1'>
                          Permissions
                        </div>
                        <div className='font-bold text-gray-900'>
                          {getActivePermissions(item)}/7
                        </div>
                      </div>
                      <div className='bg-gray-50 rounded-lg p-2 text-center'>
                        <div className='text-xs text-gray-500 mb-1'>Roles</div>
                        <div className='font-bold text-gray-900'>
                          {getActiveRoles(item)}
                        </div>
                      </div>
                    </div>

                    {/* Capabilities Indicators */}
                    <div className='flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3'>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.role?.canCreate
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        />
                        <span>Create</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.canTransfer || item.role?.canTransfer
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        />
                        <span>Transfer</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className='text-center py-20 bg-gray-50 rounded-2xl border border-gray-100 border-dashed'>
              <div className='bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100'>
                <Grid3X3 className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='text-xl font-bold text-gray-900 mb-2'>
                {t('collections:no_collections')}
              </h3>
              <p className='text-gray-500 mb-6 max-w-md mx-auto'>
                {t('collections:no_collections_desc')}
              </p>
            </div>
          )}
        </div>

        {/* Modal */}
        <IssueCollection isOpen={isModalOpen} closeModal={closeModal} />
      </div>
    </PageWrapper>
  );
};
