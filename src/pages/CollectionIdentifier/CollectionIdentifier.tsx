import { PageWrapper } from 'wrappers';
import { useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';
import { Nfts } from 'helpers/api/accounts/getNfts';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useGetAccountInfo, useGetPendingTransactions } from 'lib';
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <PageWrapper>
      <div className='flex flex-col w-full max-w-7xl mx-auto'>
        <div className='px-6 pt-6'>
          <Breadcrumb
            items={[
              { label: 'Home', path: '/' },
              { label: 'Collections', path: '/collections' },
              {
                label: collection?.name || 'Collection',
                path: `/collections/${collection?.collection}`
              },
              { label: nfts?.name || 'NFT' }
            ]}
          />
        </div>
        <div className='dinocard-wrapper rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full mt-4'>
          <div
            style={{
              float: 'right',
              marginTop: '20px',
              marginRight: '20px'
            }}
          >
            {' '}
            <button
              onClick={() => navigate('/collections/' + collection.collection)}
              className=''
            >
              {t('lotteries:return')}
            </button>
          </div>

          <Section title='NFT Details'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Card>
                <p>
                  <strong>Identifier:</strong> {nfts.identifier}
                </p>
                <p>
                  <strong>Name:</strong> {nfts.name}
                </p>
                <p>
                  <strong>Collection:</strong> {nfts.collection}
                </p>
                <p>
                  <strong>Timestamp:</strong>{' '}
                  {new Date(nfts.timestamp * 1000).toLocaleString()}
                </p>
                <p>
                  <strong>Royalties:</strong> {nfts.royalties}%
                </p>
              </Card>

              <Card>
                {nfts.creator && (
                  <p>
                    <strong>Creator:</strong>{' '}
                    <ShortenedAddress address={nfts.creator} />
                  </p>
                )}
                {nfts.owner && (
                  <p>
                    <strong>Owner:</strong>{' '}
                    <ShortenedAddress address={nfts.owner} />
                  </p>
                )}
              </Card>
            </div>
          </Section>

          <Section title='Metadata'>
            <p className='mb-2 text-gray-700'>{nfts.metadata?.description}</p>

            <div className='flex flex-wrap gap-2 mt-2'>
              {Array.isArray(nfts.metadata?.attributes) &&
                nfts.metadata.attributes.map((attr, i) => (
                  <Badge key={i}>
                    {attr.trait_type}: {attr.value}
                  </Badge>
                ))}
            </div>
          </Section>

          <Section title='Media'>
            {nfts.media?.map((mediaItem, i) => (
              <Card key={i}>
                <p>
                  <strong>Type:</strong> {mediaItem.fileType}
                </p>
                <p>
                  <strong>Size:</strong>{' '}
                  {(mediaItem.fileSize / 1024).toFixed(1)} KB
                </p>
                <img
                  src={mediaItem.thumbnailUrl}
                  alt='NFT Preview'
                  className='rounded-lg mt-2 w-64'
                />
              </Card>
            ))}
          </Section>

          <Section title='Roles'>
            {collection.roles
              ?.filter((r) => r.address)
              .map((role, idx) => (
                <Card key={idx}>
                  <p className='font-semibold'>
                    {' '}
                    <ShortenedAddress address={role.address} />
                  </p>
                  <p className='text-sm text-gray-600'>
                    {role.roles.join(', ')}
                  </p>
                </Card>
              ))}
          </Section>
          {address && (
            <Section title='Actions'>
              <div className='flex flex-wrap gap-4'>
                {collection.roles &&
                  collection.roles.find(
                    (r) =>
                      r.address === address &&
                      r.roles.includes('ESDTRoleNFTAddQuantity')
                  ) && (
                    <button
                      className='dinoButton'
                      onClick={() => openModal('addQuantity', nfts)}
                    >
                      Add Quantity
                    </button>
                  )}
                {/* {collection.roles?.find?.(
                  (r) =>
                    r.address === address &&
                    (r.canBurn || collection.owner === address)
                ) && ( */}
                {/* everyone can burn what's left in wallet */}
                <button
                  className='dinoButton'
                  onClick={() => openModal('burnQuantity', nfts)}
                >
                  Burn Quantity
                </button>
                {/* )} */}
                {collection.roles &&
                  collection.roles.find(
                    (r) =>
                      r.address === address &&
                      r.roles.includes('ESDTRoleNFTRecreate')
                  ) && (
                    <button
                      className='dinoButton'
                      onClick={() => openModal('recreateSft', nfts)}
                    >
                      Recreate
                    </button>
                  )}
              </div>
              {collection.roles &&
                collection.roles.find(
                  (r) =>
                    r.address === address &&
                    r.roles.includes('ESDTRoleNFTModifyCreator')
                ) && (
                  <ActionModifyCreator
                    tokenIdentifier={nfts.collection}
                    nonce={nfts.nonce}
                  />
                )}
            </Section>
          )}
        </div>
        {collection && <></>}
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
      {/* <ActionProcessNft collection={nfts?.collection} /> */}
      {collection && <></>}
    </PageWrapper>
  );
};
