import { PageWrapper } from 'wrappers';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';
import DisplayNft from 'helpers/DisplayNft';
import { Nfts } from 'helpers/api/accounts/getNfts';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  useGetAccountInfo,
  useGetPendingTransactions,
  useGetNetworkConfig
} from 'lib';
import { useGetCollections } from 'helpers/api/accounts/getCollections';
import { useGetNfts } from 'helpers/api/accounts/getNfts';
import AddQuantity from './modals/AddQuantity';
import BurnQuantity from './modals/BurnQuantity';
import RecreateSft from './modals/RecreateSft';
import ModifyCreator from './modals/ModifyCreator';
import { Section } from 'pages/CollectionDetail/Section';
import { Card } from 'antd';
import ShortenedAddress from 'helpers/shortenedAddress';
import { Badge } from 'pages/CollectionDetail/Badge';
import { ActionModifyCreator } from 'helpers/actions/ActionModifyCreator';
import BigNumber from 'bignumber.js';
import { Breadcrumb } from 'components/ui/Breadcrumb';

export type NModalType =
  | 'addQuantity'
  | 'burnQuantity'
  | 'recreateSft'
  | 'modifyCreator'
  | null;

export interface NModalState {
  type: NModalType;
  nfts: Nfts | null;
  address?: string;
}

export const CollectionIdentifier = () => {
  // const [tokenIdentifier, setTokenIdentifier] = useState<string>('');

  const { address } = useGetAccountInfo();
  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;

  const [tokenIdentifier, setTokenIdentifier] = useState<string>('');

  const { data: nfts } = useGetNfts(tokenIdentifier);

  const [nftBalance, setNftBalance] = useState<BigNumber>(new BigNumber(0));

  useEffect(() => {
    if (!address || !tokenIdentifier) {
      setNftBalance(new BigNumber(0));
      return;
    }

    let cancelled = false;

    const fetchBalance = async () => {
      try {
        const res = await fetch(
          `https://api.multiversx.com/accounts/${address}/nfts?identifiers=${tokenIdentifier}`
        );
        if (!res.ok) throw new Error(`Failed to fetch NFTs: ${res.status}`);
        const data: any[] = await res.json();

        // try to match by identifier (and fallback to identifier@nonce if tokenIdentifier uses nonce)
        const found =
          data.find((it) => it.identifier === tokenIdentifier) ||
          data.find((it) => `${it.identifier}@${it.nonce}` === tokenIdentifier);

        const balance = found?.balance ?? found?.amount ?? '0';
        if (!cancelled) setNftBalance(new BigNumber(balance));
      } catch (err) {
        console.error('Error fetching NFT balance', err);
        if (!cancelled) setNftBalance(new BigNumber(0));
      }
    };

    fetchBalance();

    return () => {
      cancelled = true;
    };
  }, [address, tokenIdentifier]);

  const { data: collection } = useGetCollections(nfts?.collection);
  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    if (id) {
      setTokenIdentifier(id);
    } else {
      navigate('/collections');
    }
  }, [id]);

  const loading = useLoadTranslations('home');
  const { t } = useTranslation();
  const { network } = useGetNetworkConfig();

  const [modal, setModal] = useState<NModalState>({
    type: null,
    nfts: null
  });

  const openModal = (type: NModalType, nfts: Nfts | null, address?: string) => {
    setModal({ type, nfts, address });
  };

  const closeModal = () => {
    setModal({ type: null, nfts: null, address: '' });
  };

  useEffect(() => {
    if (!hasPendingTransactions) {
      setModal({ type: null, nfts: null, address: '' });
    }
  }, [hasPendingTransactions]);

  //liste des roles déjà affectés impossible de les affecter à nouveau
  const IGNORED_ROLES = [
    'ESDTTransferRole',
    'ESDTRoleNFTBurn',
    'ESDTRoleNFTAddQuantity'
  ];
  //update attributes is available for non dynamic NFTs only
  //one per collection for other types
  if (
    collection.type == 'NonFungibleESDT' &&
    collection?.subType === 'NonFungibleESDTv2'
  ) {
    IGNORED_ROLES.push('ESDTRoleNFTUpdateAttributes', 'ESDTRoleNFTAddURI');
  }

  const definedRoles = [
    ...(collection.roles
      ? Array.from(
          new Set(
            collection.roles
              .flatMap((r) => r.roles || [])
              .filter((role) => !IGNORED_ROLES.includes(role))
          )
        )
      : [])
  ];

  if (loading || !nfts || !collection) {
    return (
      <PageWrapper>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='animate-pulse text-xl text-slate-400 font-medium'>
            Loading...
          </div>
        </div>
      </PageWrapper>
    );
  }

  const mediaItem = nfts.media?.[0];

  return (
    <PageWrapper>
      <div className='min-h-screen bg-slate-50 pb-20'>
        {/* Breadcrumb Section */}
        <div className='max-w-7xl mx-auto px-6 pt-6'>
          <div className='flex items-center justify-between mb-6'>
            <Breadcrumb
              items={[
                { label: 'Home', path: '/' },
                { label: 'Collections', path: '/collections' },
                {
                  label: collection?.name || 'Collection',
                  path: `/collections/${collection?.collection}`
                },
                { label: nfts.name || 'NFT' }
              ]}
            />
            {/* Back Button */}
            <button
              onClick={() => navigate(`/collections/${collection.collection}`)}
              className='text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-2 transition-colors'
            >
              ← {t('lotteries:return')}
            </button>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12'>
          {/* Left Column: Image */}
          <div className='lg:col-span-5'>
            <div className='sticky top-6'>
              <div className='rounded-2xl overflow-hidden bg-white shadow-xl border border-slate-200 aspect-square relative group'>
                <DisplayNft
                  nft={nfts as any}
                  variant='media-only'
                  className='w-full h-full'
                />
              </div>

              {/* Additional Media if any */}
              {nfts.media && nfts.media.length > 1 && (
                <div className='flex gap-2 mt-4 overflow-x-auto pb-2'>
                  {nfts.media.slice(1).map((m, i) => (
                    <div
                      key={i}
                      className='h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-sm'
                    >
                      <img
                        src={m.thumbnailUrl}
                        alt=''
                        className='w-full h-full object-cover'
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Details */}
          <div className='lg:col-span-7 space-y-8'>
            {/* Title & Collection */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-indigo-600 font-medium'>
                <a
                  href={`/collections/${collection.collection}`}
                  className='hover:underline'
                >
                  {collection.name}
                </a>
                <span className='text-slate-300'>•</span>
                <span className='text-slate-500 text-sm bg-slate-100 px-2 py-0.5 rounded'>
                  {collection.type}
                </span>
              </div>
              <h1 className='text-4xl font-bold text-slate-900 leading-tight'>
                {nfts.name}
              </h1>
            </div>

            {/* Owner & Creator */}
            <div className='flex flex-wrap gap-4'>
              {nfts.owner && (
                <div className='flex items-center gap-3 bg-white p-3 pr-5 rounded-full border border-slate-200 shadow-sm'>
                  <div className='w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-50'>
                    O
                  </div>
                  <div>
                    <div className='text-xs text-slate-500 font-medium uppercase tracking-wide'>
                      Owner
                    </div>
                    <div className='font-mono text-sm font-semibold text-slate-800'>
                      <ShortenedAddress address={nfts.owner} />
                    </div>
                  </div>
                </div>
              )}
              {nfts.creator && (
                <div className='flex items-center gap-3 bg-white p-3 pr-5 rounded-full border border-slate-200 shadow-sm'>
                  <div className='w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-600 font-bold text-lg border border-amber-50'>
                    C
                  </div>
                  <div>
                    <div className='text-xs text-slate-500 font-medium uppercase tracking-wide'>
                      Creator
                    </div>
                    <div className='font-mono text-sm font-semibold text-slate-800'>
                      <ShortenedAddress address={nfts.creator} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {nfts.metadata?.description && (
              <div className='bg-white rounded-2xl p-6 border border-slate-200 shadow-sm'>
                <h3 className='text-lg font-bold text-slate-900 mb-2'>
                  Description
                </h3>
                <p className='text-slate-600 leading-relaxed'>
                  {nfts.metadata.description}
                </p>
              </div>
            )}

            {/* Attributes */}
            {Array.isArray(nfts.metadata?.attributes) &&
              nfts.metadata!.attributes!.length > 0 && (
                <div className='bg-white rounded-2xl p-6 border border-slate-200 shadow-sm'>
                  <h3 className='text-lg font-bold text-slate-900 mb-4'>
                    Attributes
                  </h3>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                    {nfts.metadata!.attributes!.map((attr, i) => (
                      <div
                        key={i}
                        className='bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col text-center'
                      >
                        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1'>
                          {attr.trait_type}
                        </span>
                        <span className='text-sm font-bold text-slate-800 break-words'>
                          {attr.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Info Grid */}
            <div className='bg-slate-100 rounded-2xl p-6 border border-slate-200 grid grid-cols-2 gap-y-6 gap-x-4'>
              <div>
                <div className='text-xs text-slate-500 uppercase font-bold tracking-wider mb-1'>
                  Identifier
                </div>
                <div className='flex items-center gap-2'>
                  <div className='text-sm font-mono text-slate-900 font-medium break-all'>
                    {nfts.identifier}
                  </div>
                  <a
                    href={`${network.explorerAddress}/nfts/${nfts.identifier}`}
                    target='_blank'
                    rel='noreferrer'
                    className='text-slate-400 hover:text-indigo-600 transition-colors'
                    title='View on Explorer'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='w-4 h-4'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25'
                      />
                    </svg>
                  </a>
                </div>
              </div>
              <div>
                <div className='text-xs text-slate-500 uppercase font-bold tracking-wider mb-1'>
                  Collection ID
                </div>
                <div className='text-sm font-mono text-slate-900 font-medium break-all'>
                  {nfts.collection}
                </div>
              </div>
              <div>
                <div className='text-xs text-slate-500 uppercase font-bold tracking-wider mb-1'>
                  Royalties
                </div>
                <div className='text-sm font-medium text-slate-900'>
                  {nfts.royalties}%
                </div>
              </div>
              <div>
                <div className='text-xs text-slate-500 uppercase font-bold tracking-wider mb-1'>
                  Minted
                </div>
                <div className='text-sm font-medium text-slate-900'>
                  {new Date(nfts.timestamp * 1000).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Actions */}
            {address && (
              <div className='pt-4 border-t border-slate-200'>
                <h3 className='text-lg font-bold text-slate-900 mb-4'>
                  Actions
                </h3>
                <div className='flex flex-wrap gap-4'>
                  {collection.roles?.find(
                    (r) =>
                      r.address === address &&
                      r.roles.includes('ESDTRoleNFTAddQuantity')
                  ) && (
                    <button
                      className='inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200'
                      onClick={() => openModal('addQuantity', nfts)}
                    >
                      Add Quantity
                    </button>
                  )}

                  <button
                    className='inline-flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-medium transition-colors'
                    onClick={() => openModal('burnQuantity', nfts)}
                  >
                    Burn Quantity
                  </button>

                  {collection.roles?.find(
                    (r) =>
                      r.address === address &&
                      r.roles.includes('ESDTRoleNFTRecreate')
                  ) && (
                    <button
                      className='inline-flex items-center px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors'
                      onClick={() => openModal('recreateSft', nfts)}
                    >
                      Recreate
                    </button>
                  )}

                  {collection.roles?.find(
                    (r) =>
                      r.address === address &&
                      r.roles.includes('ESDTRoleNFTModifyCreator')
                  ) && (
                    <ActionModifyCreator
                      tokenIdentifier={nfts.collection}
                      nonce={nfts.nonce}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* modals */}
      <AddQuantity
        isOpen={modal.type === 'addQuantity'}
        closeModal={closeModal}
        nfts={nfts}
      />
      <BurnQuantity
        isOpen={modal.type === 'burnQuantity'}
        closeModal={closeModal}
        nfts={nfts}
        balance={nftBalance}
      />

      <ModifyCreator
        isOpen={modal.type === 'modifyCreator'}
        closeModal={closeModal}
        nfts={nfts}
      />

      <RecreateSft
        isOpen={modal.type === 'recreateSft'}
        closeModal={closeModal}
        nfts={nfts}
        collection={collection}
      />
      {collection && <></>}
    </PageWrapper>
  );
};
