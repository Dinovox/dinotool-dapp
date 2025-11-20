import { PageWrapper } from 'wrappers';
import { useEffect, useState } from 'react';
import { useNFTs } from '../../hooks/useNFTs';
import { usePartner } from '../../hooks/usePartner';
import { NFT, LockedNFT } from '../../types/nft';
import PartnerInfo from './components/PartnerInfo';
import LockConfirmation from './components/LockConfirmation';
import NFTCard from './components/NFTCard';
import VestingDurationSelector from './components/VestingDurationSelector';
import { signAndSendTransactions } from 'helpers';
import {
  AbiRegistry,
  Address,
  GAS_PRICE,
  SmartContractTransactionsFactory,
  Transaction,
  TransactionsFactoryConfig,
  useGetAccount,
  useGetNetworkConfig,
  useGetAccountInfo
} from 'lib';
import { vaultContractAddress } from 'config';
import BigNumber from 'bignumber.js';
import { useGetLoginInfo, useGetPendingTransactions } from 'lib';
import {
  Lock,
  Grid,
  List,
  Search,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { bigNumToHex } from 'helpers/bigNumToHex';
import { duration } from 'moment';
import { useGetUserLockedNft } from 'pages/Dashboard/widgets/LockedNftAbi/hooks/useGetUserLockedNft';
import { t } from 'i18next';
import useLoadTranslations from 'hooks/useLoadTranslations';

type Step = 'selection' | 'duration' | 'confirmation' | 'success';

export const Locker = () => {
  const loading = useLoadTranslations('locker');

  const { address } = useGetAccount();
  const { isLoggedIn } = useGetLoginInfo();
  const { nfts, loading: nftsLoading, error: nftsError } = useNFTs();
  const { partner, loading: partnerLoading } = usePartner();
  const { network } = useGetNetworkConfig(); // hook dapp

  const [currentStep, setCurrentStep] = useState<Step>('selection');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [lockedNFTs, setLockedNFTs] = useState<LockedNFT[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [newOwner, setNewOwner] = useState<string>('');

  const [transactionSessionId, setTransactionSessionId] = useState<
    string | null
  >(null);
  const pendingTransactions = useGetPendingTransactions();

  // Filtrage des NFTs
  const filteredNFTs = nfts.filter((nft) => {
    const matchesSearch =
      nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nft.identifier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollection =
      selectedCollection === 'all' || nft.collection === selectedCollection;
    const isNotLocked = !lockedNFTs.some(
      (locked) => locked.identifier === nft.identifier
    );

    return matchesSearch && matchesCollection && isNotLocked;
  });

  // Collections uniques
  const collections = Array.from(new Set(nfts.map((nft) => nft.collection)));

  const locked = useGetUserLockedNft();
  useEffect(() => {
    if (locked.lockedNfts.length > 0) {
      setLockedNFTs(locked.lockedNfts);
    } else {
      setLockedNFTs([]);
    }
  }, [locked.lockedNfts]);
  const handleNFTSelect = (nft: NFT) => {
    setSelectedNFT(nft);
    setCurrentStep('duration');
  };

  const handleDurationConfirm = () => {
    if ((selectedDuration || customDate) && selectedNFT) {
      setCurrentStep('confirmation');
    }
  };

  const handleLockConfirm = async () => {
    if (!selectedNFT || (!selectedDuration && !customDate)) return;

    const unlockTimestamp =
      customDate ||
      (() => {
        const date = new Date();
        date.setDate(date.getDate() + (selectedDuration || 0));
        return date;
      })();

    const lockedNFT: LockedNFT = {
      ...selectedNFT,
      lockDate: new Date(),
      unlockTimestamp,
      vestingDuration:
        selectedDuration ||
        Math.ceil(
          (unlockTimestamp.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      isLocked: true
    };

    setLockedNFTs((prev) => [...prev, lockedNFT]);

    // const unlockTimestamp = Math.floor(unlockDate.getTime() / 1000);

    const dataParts = [
      'ESDTNFTTransfer',
      Buffer.from(selectedNFT.collection, 'utf8').toString('hex'),
      bigNumToHex(new BigNumber(selectedNFT.nonce)),
      bigNumToHex(new BigNumber(1)),
      new Address(vaultContractAddress).toHex(),
      Buffer.from('lockNft', 'utf8').toString('hex'),
      bigNumToHex(new BigNumber(selectedDuration || 0)),
      newOwner ? new Address(newOwner).toHex() : undefined // ajouté uniquement si défini
    ].filter((v) => v !== undefined && v !== null);

    const payload = dataParts.join('@');

    const transaction = new Transaction({
      value: BigInt('0'),
      data: new TextEncoder().encode(payload),
      receiver: new Address(address),
      gasLimit: BigInt('60000000'),

      gasPrice: BigInt(GAS_PRICE),
      chainID: network.chainId,
      sender: new Address(address),
      version: 1
    });

    try {
      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Locking NFT...',
          errorMessage: 'Failed to lock NFT',
          successMessage: 'NFT successfully locked'
        }
      });

      if (sessionId) {
        setTransactionSessionId(sessionId);
      } else {
        console.error('Transaction session ID is null');
      }
    } catch (error) {
      console.error('Erreur lors de la transaction de verrouillage:', error);
    }
  };

  const resetFlow = () => {
    setCurrentStep('selection');
    setSelectedNFT(null);
    setSelectedDuration(null);
    setCustomDate(null);
    setTransactionHash('');
  };

  async function waitForTxSuccess(
    txHash: string,
    maxTries = 10,
    delayMs = 3000
  ): Promise<boolean> {
    const apiUrl = `${network.apiAddress}/transactions/${txHash}`;

    for (let i = 0; i < maxTries; i++) {
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (data?.status === 'success') {
        setCurrentStep('success');
        setTransactionHash(txHash);
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    console.warn('❌ Transaction did not complete in time.');
    return false;
  }

  useEffect(() => {
    if (!transactionSessionId) return;


    // const tx = pendingTransactions[transactionSessionId]?.transactions[0];
    const tx = pendingTransactions[0];
    // txManager.setCallbacks

    if (tx?.hash) {
      console.error('✅ Tx hash now available:', tx.hash);
      waitForTxSuccess(tx.hash);
      // (optionnel : reset si tu veux le faire une seule fois)
      setTransactionSessionId(null);
    }
  }, [transactionSessionId, pendingTransactions]);

  // if (!isLoggedIn) {
  //   return (
  //     <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center'>
  //       <div className='text-center'>
  //         <Lock className='w-16 h-16 text-gray-400 mx-auto mb-4' />
  //         <h1 className='text-2xl font-bold text-gray-800 mb-2'>
  //           {t('locker:title')}
  //         </h1>
  //         <p className='text-gray-600 mb-6'>{t('locker:description_login')}</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <PageWrapper>
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50'>
        <div className='container mx-auto px-4 py-8'>
          <div className='max-w-6xl mx-auto'>
            {/* En-tête */}
            <div className='text-center mb-8'>
              <div className='flex items-center justify-center space-x-3 mb-4'>
                <div className='w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center'>
                  <Lock className='w-6 h-6 text-white' />
                </div>
                <h1 className='text-3xl font-bold text-gray-800'>
                  {t('locker:title')}
                </h1>
              </div>
              <p className='text-gray-600 max-w-2xl mx-auto'>
                {t('locker:description')}
              </p>
            </div>

            {/* Informations partenaire */}
            {/* {!partnerLoading && (
                <PartnerInfo partner={partner} address={address} />
              )} */}

            {/* Étapes */}
            <div className='flex items-center justify-center space-x-4 mb-8'>
              {[
                {
                  step: 'selection',
                  label: t('locker:select_nft'),
                  icon: Grid
                },
                {
                  step: 'duration',
                  label: t('locker:select_duration'),
                  icon: Lock
                },
                {
                  step: 'confirmation',
                  label: t('locker:confirm_lock'),
                  icon: CheckCircle
                }
              ].map(({ step, label, icon: Icon }, index) => (
                <div key={step} className='flex items-center'>
                  <div
                    className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${
                    currentStep === step
                      ? 'bg-blue-600 text-white'
                      : ['duration', 'confirmation'].includes(currentStep) &&
                        index < 1
                      ? 'bg-green-500 text-white'
                      : currentStep === 'confirmation' && index < 2
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
                  >
                    <Icon className='w-5 h-5' />
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      currentStep === step ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </span>
                  {index < 2 && <div className='w-8 h-0.5 bg-gray-300 mx-4' />}
                </div>
              ))}
            </div>

            {/* Contenu principal */}
            <div className='bg-white rounded-2xl shadow-lg p-6'>
              {/* NFTs verrouillés */}
              {currentStep == 'selection' && lockedNFTs.length > 0 && (
                <div className='mt-12 pt-8 border-t border-gray-200 mb-8'>
                  <h3 className='text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2'>
                    <Lock className='w-5 h-5 text-red-500' />
                    <span> {t('locker:locked_nfts')}</span>
                  </h3>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                    {lockedNFTs.map((nft) => (
                      <>
                        <NFTCard
                          key={nft.identifier}
                          nft={nft}
                          lockedNft={nft}
                          isLocked={true}
                          unlockTimestamp={nft.unlockTimestamp}
                          selectable={false}
                        />
                      </>
                    ))}
                  </div>
                </div>
              )}
              {currentStep === 'selection' && (
                <div>
                  <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0'>
                    <h2 className='text-xl font-bold text-gray-800'>
                      {t('locker:select_nft_to_lock')}
                    </h2>

                    <div className='flex items-center space-x-4'>
                      {/* Recherche */}
                      <div className='relative'>
                        <Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                        <input
                          type='text'
                          placeholder='Rechercher...'
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        />
                      </div>

                      {/* Filtre collection */}
                      <select
                        value={selectedCollection}
                        onChange={(e) => setSelectedCollection(e.target.value)}
                        className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      >
                        <option value='all'>
                          {t('locker:all_collections')}
                        </option>
                        {collections.map((collection) => (
                          <option key={collection} value={collection}>
                            {collection}
                          </option>
                        ))}
                      </select>

                      {/* Mode d'affichage */}
                      <div className='flex border border-gray-300 rounded-lg overflow-hidden'>
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 ${
                            viewMode === 'grid'
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <Grid className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 ${
                            viewMode === 'list'
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <List className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  </div>

                  {nftsLoading ? (
                    <div className='flex items-center justify-center py-12'>
                      <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                      <span className='ml-3 text-gray-600'>
                        {t('locker:loading_nfts')}
                      </span>
                    </div>
                  ) : nftsError ? (
                    <div className='text-center py-12'>
                      <AlertCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
                      <p className='text-red-600 mb-2'>
                        {t('locker:error_loading_nfts')}
                      </p>
                    </div>
                  ) : filteredNFTs.length === 0 ? (
                    <div className='text-center py-12'>
                      <Grid className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                      <p className='text-gray-600'>
                        {t('locker:no_nfts_available')}
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`
                    ${
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'space-y-4'
                    }
                  `}
                    >
                      {filteredNFTs.map((nft) => (
                        <NFTCard
                          key={nft.identifier}
                          nft={nft}
                          onSelect={handleNFTSelect}
                          selectable={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 'duration' && selectedNFT && (
                <div>
                  <div className='flex items-center justify-between mb-6'>
                    <h2 className='text-xl font-bold text-gray-800'>
                      {t('locker:select_duration')}
                    </h2>
                    <button
                      onClick={() => setCurrentStep('selection')}
                      className='text-gray-500 hover:text-gray-700'
                    >
                      {t('locker:back')}
                    </button>
                  </div>

                  {/* NFT sélectionné */}
                  <div className='bg-gray-50 rounded-lg p-4 mb-6'>
                    <h3 className='font-semibold text-gray-800 mb-3'>
                      {t('locker:selected_nft')}
                    </h3>
                    <div className='flex items-center space-x-4'>
                      <img
                        src={
                          selectedNFT.media?.[0]?.thumbnailUrl ||
                          selectedNFT.url
                        }
                        alt={selectedNFT.name}
                        className='w-16 h-16 rounded-lg object-cover'
                      />
                      <div>
                        <h4 className='font-semibold text-gray-800'>
                          {selectedNFT.name}
                        </h4>
                        <p className='text-sm text-gray-500'>
                          #{selectedNFT.nonce}
                        </p>
                        <p className='text-xs text-gray-400'>
                          {selectedNFT.collection}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='mb-6'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      {t('locker:new_owner_optional') || 'New owner (optional)'}
                    </label>
                    <input
                      type='text'
                      value={newOwner}
                      onChange={(e) => setNewOwner(e.target.value.trim())}
                      placeholder='erd1...'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                    {newOwner ? (
                      /^erd1[0-9a-z]{58}$/i.test(newOwner) ? (
                        <p className='mt-2 text-sm text-green-600'>
                          {t('locker:new_owner_valid') ||
                            'Valid Elrond address'}
                        </p>
                      ) : (
                        <p className='mt-2 text-sm text-red-600'>
                          {t('locker:new_owner_invalid') ||
                            'Invalid address format. Expected an Elrond address (erd1...)'}
                        </p>
                      )
                    ) : (
                      <p className='mt-2 text-sm text-gray-500'>
                        {t('locker:new_owner_help') ||
                          'If left empty, the NFT will be locked to your address.'}
                      </p>
                    )}
                  </div>
                  <VestingDurationSelector
                    selectedDuration={selectedDuration}
                    customDate={customDate}
                    onDurationChange={setSelectedDuration}
                    onCustomDateChange={setCustomDate}
                  />

                  <div className='flex justify-end mt-6'>
                    <button
                      onClick={handleDurationConfirm}
                      disabled={!selectedDuration && !customDate}
                      className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                    >
                      {t('locker:continue')}
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'confirmation' && selectedNFT && (
                <div>
                  <div className='flex items-center justify-between mb-6'>
                    <h2 className='text-xl font-bold text-gray-800'>
                      {t('locker:confirm_lock')}
                    </h2>
                    <button
                      onClick={() => setCurrentStep('duration')}
                      className='text-gray-500 hover:text-gray-700'
                    >
                      {t('locker:back')}
                    </button>
                  </div>

                  <LockConfirmation
                    nft={selectedNFT}
                    duration={selectedDuration}
                    customDate={customDate}
                    onConfirm={handleLockConfirm}
                    onCancel={() => setCurrentStep('duration')}
                  />
                </div>
              )}

              {currentStep === 'success' && (
                <div className='text-center py-12'>
                  <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                    <CheckCircle className='w-12 h-12 text-green-600' />
                  </div>
                  <h2 className='text-2xl font-bold text-gray-800 mb-4'>
                    {t('locker:lock_success')}
                  </h2>
                  <p className='text-gray-600 mb-6'>
                    {t('locker:lock_success_description')}
                  </p>

                  {transactionHash && (
                    <div className='bg-gray-50 rounded-lg p-4 mb-6 max-w-md mx-auto'>
                      <p className='text-sm text-gray-600 mb-2'>
                        {t('locker:transaction_hash')}:
                      </p>
                      <p className='font-mono text-xs text-gray-800 break-all'>
                        {transactionHash}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={resetFlow}
                    className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
                  >
                    {t('locker:lock_another_nft')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>{' '}
    </PageWrapper>
  );
};
