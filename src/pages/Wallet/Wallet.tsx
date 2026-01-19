import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useGetAccount,
  useGetAccountInfo,
  useGetNetworkConfig,
  useGetPendingTransactions,
  Address,
  Transaction,
  GAS_PRICE
} from 'lib';
import { useGetUserNFT, UserNft } from 'helpers/useGetUserNft';
import { useGetUserESDT } from 'helpers/useGetUserEsdt';
import { PageTemplate } from 'components/PageTemplate';
import { FormatAmount } from 'helpers/api/useGetEsdtInformations';
import bigToHex from 'helpers/bigToHex';
import { signAndSendTransactions } from 'helpers';
import BigNumber from 'bignumber.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faExchangeAlt,
  faCoins,
  faImages
} from '@fortawesome/free-solid-svg-icons';
import DisplayNft from 'helpers/DisplayNft';

/* ---------------- Types ---------------- */
type AssetType = 'TOKEN' | 'NFT';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: any; // Token or UserNft
  type: AssetType;
}

/* ---------------- Transfer Modal ---------------- */
const TransferModal = ({
  isOpen,
  onClose,
  asset,
  type
}: TransferModalProps) => {
  /* ---------------- Hooks ---------------- */
  const { t } = useTranslation();
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccountInfo();

  // Local State
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for batch quantities: identifier -> quantity string
  const [batchQuantities, setBatchQuantities] = useState<
    Record<string, string>
  >({});

  const isNft = type === 'NFT';

  // Prepare Assets - Safe derivation
  const assets: any[] = useMemo(() => {
    if (!asset) return [];
    return Array.isArray(asset) ? asset : [asset];
  }, [asset]);

  const isBatch = assets.length > 1;

  // Initialize batch quantities when assets change (or modal opens)
  useEffect(() => {
    if (isOpen && isBatch) {
      const initial: Record<string, string> = {};
      assets.forEach((a: any) => {
        // Default to '1' for everyone
        initial[a.identifier] = '1';
      });
      setBatchQuantities(initial);
    } else if (!isOpen) {
      // Clear batch quantities if not a batch transfer or closed
      setBatchQuantities({});
      setRecipient('');
      setAmount('');
      setError(null);
    }
  }, [isOpen, assets.length, isBatch]);

  const updateBatchQuantity = (identifier: string, value: string) => {
    setBatchQuantities((prev) => ({ ...prev, [identifier]: value }));
  };

  /* ---------------- Derived Values ---------------- */
  // For display (first item or summary)
  const mainAsset = assets[0] || {};
  const balance = isNft ? mainAsset.balance : mainAsset.balance;
  const decimals = isNft ? 0 : mainAsset.decimals || 18;
  const ticker = isNft ? mainAsset.identifier : mainAsset.identifier || 'EGLD';

  /* ---------------- Early Return ---------------- */
  if (!isOpen || !asset) return null;
  // Note: 'nonce' variable is derived per item loop for batch

  // If batch, we might disable amount input (send 1 of each or max?)
  // Simplified: Batch assumes sending 1 of each for now as per plan

  const handleSend = async () => {
    setError(null);
    if (!recipient || !Address.isValid(recipient)) {
      setError('Invalid recipient address');
      return;
    }

    // Validate amount only if not batch (single transfer)
    let amountBig = new BigNumber(0);
    if (!isBatch) {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setError('Invalid amount');
        return;
      }
      amountBig = new BigNumber(amount).shiftedBy(decimals);
    }

    try {
      setIsSending(true);
      const senderAddress = new Address(address);
      const recipientAddress = new Address(recipient);

      let transaction: Transaction;

      if (type === 'TOKEN') {
        if (ticker === 'EGLD') {
          // EGLD Transfer
          transaction = new Transaction({
            value: BigInt(amountBig.toFixed(0)),
            data: new TextEncoder().encode(''),
            receiver: recipientAddress,
            gasLimit: BigInt(50000),
            gasPrice: BigInt(GAS_PRICE),
            chainID: network.chainId,
            sender: senderAddress,
            version: 1
          });
        } else {
          // ESDT Transfer
          // data: ESDTTransfer@TokenHex@AmountHex
          const data =
            'ESDTTransfer@' +
            Buffer.from(ticker, 'utf8').toString('hex') +
            '@' +
            bigToHex(BigInt(amountBig.toFixed(0)));

          transaction = new Transaction({
            value: BigInt(0),
            data: new TextEncoder().encode(data),
            receiver: recipientAddress,
            gasLimit: BigInt(500000), // Standard ESDT transfer cost
            gasPrice: BigInt(GAS_PRICE),
            chainID: network.chainId,
            sender: senderAddress,
            version: 1
          });
        }
      } else {
        // NFT/SFT Transfer using MultiESDTNFTTransfer
        // Can handle single or batch

        let txData = 'MultiESDTNFTTransfer@' + recipientAddress.toHex();

        // Count of tokens
        txData += '@' + bigToHex(BigInt(assets.length));

        // Append each token
        for (const item of assets) {
          const itemTokenId = item.collection; // Collection ID for SFT/NFT (e.g., DINO-123456)
          const itemNonce = item.nonce || 0;

          let itemAmountBig = BigInt(0);
          if (!isBatch) {
            itemAmountBig = BigInt(amountBig.toFixed(0));
          } else {
            // For batch, use the specific quantity from state
            const qtyStr = batchQuantities[item.identifier] || '1';
            // Validate qty
            if (!qtyStr || isNaN(Number(qtyStr)) || Number(qtyStr) <= 0) {
              throw new Error(`Invalid quantity for ${item.name}`);
            }
            // For NFTs/SFTs, decimals is usually 0.
            // If UserNft has decimals, we should respect it, but usually SFTs are 0.
            // item.decimals might be undefined for NFTs. Default to 0.
            const itemDecimals = item.decimals || 0;
            itemAmountBig = BigInt(
              new BigNumber(qtyStr).shiftedBy(itemDecimals).toFixed(0)
            );
          }

          txData +=
            '@' +
            Buffer.from(itemTokenId, 'utf8').toString('hex') +
            '@' +
            bigToHex(BigInt(itemNonce)) +
            '@' +
            bigToHex(itemAmountBig);
        }

        transaction = new Transaction({
          value: BigInt(0),
          data: new TextEncoder().encode(txData),
          receiver: senderAddress, // For MultiESDTNFTTransfer, receiver is self
          gasLimit: BigInt(1000000 + 500000 * assets.length), // Scale gas
          gasPrice: BigInt(GAS_PRICE),
          chainID: network.chainId,
          sender: senderAddress,
          version: 1
        });
      }

      await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Processing Transfer...',
          errorMessage: 'Transfer failed',
          successMessage: 'Transfer successful'
        }
      });
      onClose();
    } catch (e) {
      console.error(e);
      setError('Transfer failed: ' + (e as any).message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl'>
        <h3 className='text-xl font-bold mb-4'>
          {isBatch ? `Transfer ${assets.length} Items` : `Transfer ${ticker}`}
        </h3>

        {isBatch && (
          <div className='mb-4 p-3 bg-gray-50 rounded-lg max-h-48 overflow-y-auto'>
            <p className='text-xs text-gray-500 mb-2 font-semibold'>
              Selected Items:
            </p>
            {assets.map((item: any) => {
              const itemBalance = Number(item.balance || 0);
              const canEdit = itemBalance > 1; // Only allow editing if user has multiple copies (SFT)

              return (
                <div
                  key={item.identifier}
                  className='flex justify-between items-center text-sm text-gray-700 mb-2'
                >
                  <span
                    className='truncate max-w-[50%] font-medium'
                    title={item.name}
                  >
                    {item.name}
                  </span>
                  <div className='flex items-center gap-2'>
                    <span className='text-gray-400 text-xs'>
                      Max: {itemBalance}
                    </span>
                    {canEdit ? (
                      <input
                        type='number'
                        className='w-16 rounded border border-gray-300 px-2 py-1 text-xs text-right focus:border-indigo-500 focus:outline-none'
                        value={batchQuantities[item.identifier] || '1'}
                        onChange={(e) =>
                          updateBatchQuantity(item.identifier, e.target.value)
                        }
                        max={itemBalance}
                        min='1'
                      />
                    ) : (
                      <span className='text-gray-500 text-xs font-semibold px-2'>
                        Qty: 1
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              To Address
            </label>
            <input
              type='text'
              className='w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none'
              placeholder='erd1...'
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setError(null);
              }}
            />
          </div>

          {!isBatch && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Amount
              </label>
              <div className='flex gap-2'>
                <input
                  type='number'
                  className='w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none'
                  placeholder='0.0'
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError(null);
                  }}
                />
                <button
                  className='text-xs text-indigo-600 font-semibold hover:underline'
                  onClick={() =>
                    setAmount(
                      new BigNumber(balance).shiftedBy(-decimals).toString()
                    )
                  }
                >
                  Max
                </button>
              </div>
              <p className='text-xs text-slate-500 mt-1'>
                Available:{' '}
                {new BigNumber(balance).shiftedBy(-decimals).toString()}{' '}
                {ticker}
              </p>
            </div>
          )}

          {error && (
            <div className='bg-red-50 border border-red-200 text-red-600 text-xs p-2 rounded-md'>
              {error}
            </div>
          )}

          <div className='flex gap-3 mt-6'>
            <button
              onClick={onClose}
              className='flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50'
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className='flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50'
            >
              {isSending ? 'Sending...' : 'Confirm Transfer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Main Page ---------------- */
export const Wallet = () => {
  const { t } = useTranslation();
  const { address, balance } = useGetAccount(); // balance used for EGLD
  const [activeTab, setActiveTab] = useState<'TOKENS' | 'NFTS'>('NFTS');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Assets
  const nfts: UserNft[] = useGetUserNFT(address, undefined, undefined, {
    enabled: !!address,
    size: 1000
  });

  const filteredNfts = useMemo(() => {
    if (!searchQuery) return nfts;
    const lowerQuery = searchQuery.toLowerCase();
    return nfts.filter(
      (nft) =>
        nft.name.toLowerCase().includes(lowerQuery) ||
        nft.collection.toLowerCase().includes(lowerQuery)
    );
  }, [nfts, searchQuery]);

  const esdts = useGetUserESDT(undefined, { enabled: !!address });

  // Combine EGLD into token list
  const tokens = useMemo(() => {
    const list = [...(esdts || [])];
    if (balance) {
      list.unshift({
        identifier: 'EGLD',
        name: 'EGLD',
        balance: balance,
        decimals: 18,
        assets: {
          svgUrl: 'https://github.com/multiversx.png'
        }
      });
    }
    return list;
  }, [esdts, balance]);

  // Modal State
  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean;
    asset: any;
    type: AssetType;
  }>({ isOpen: false, asset: null, type: 'TOKEN' });

  // Selection State
  const [selectedItems, setSelectedItems] = useState<UserNft[]>([]);

  const toggleSelection = (nft: UserNft) => {
    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.identifier === nft.identifier);
      if (exists) {
        return prev.filter((item) => item.identifier !== nft.identifier);
      } else {
        return [...prev, nft];
      }
    });
  };

  const openTransfer = (asset: any, type: AssetType) => {
    // If we have selected items and type is NFT, we use the batch transfer mode
    if (type === 'NFT' && selectedItems.length > 0) {
      // Logic to handle batch transfer will be added later
      // For now, if single click on transfer button, we might want to just transfer that one?
      // Let's assume the button on the card clears selection and opens specific?
      // Or we explicitly have a "Send Selected" button.
      setTransferModal({ isOpen: true, asset: selectedItems, type });
    } else {
      setTransferModal({ isOpen: true, asset, type });
    }
  };

  const openBatchTransfer = () => {
    if (selectedItems.length === 0) return;
    setTransferModal({ isOpen: true, asset: selectedItems, type: 'NFT' });
  };

  return (
    <div className='mx-auto max-w-7xl px-4 py-8 space-y-8'>
      <PageTemplate
        title='My Wallet'
        breadcrumbItems={[
          { label: 'Home', path: '/' },
          { label: 'Wallet', path: '/wallet' }
        ]}
      >
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-1'>
          {/* Tabs */}
          <div className='flex'>
            <button
              onClick={() => setActiveTab('NFTS')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'NFTS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faImages} className='mr-2' />
              NFTs / SFTs
            </button>
            <button
              onClick={() => setActiveTab('TOKENS')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'TOKENS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faCoins} className='mr-2' />
              Tokens
            </button>
          </div>

          {/* Search Input */}
          {activeTab === 'NFTS' && (
            <div className='relative w-full sm:w-64 mb-2 sm:mb-0'>
              <input
                type='text'
                placeholder='Search NFTs...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full rounded-lg border border-gray-300 bg-white py-2 pl-4 pr-10 text-sm font-medium text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className='mt-8'>
          {activeTab === 'NFTS' && (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {filteredNfts.length === 0 ? (
                <div className='col-span-full text-center py-12 text-slate-500'>
                  {searchQuery
                    ? 'No NFTs found matching your search.'
                    : 'No NFTs found.'}
                </div>
              ) : (
                filteredNfts.map((nft) => (
                  <div
                    key={nft.identifier}
                    className='group relative flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all'
                  >
                    <div className='aspect-square w-full overflow-hidden rounded-t-2xl bg-gray-100'>
                      <DisplayNft
                        nft={nft}
                        className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                        useThumbnail={true}
                      />
                    </div>
                    <div className='flex flex-1 flex-col p-4'>
                      <h3
                        className='text-sm font-bold text-gray-900 line-clamp-1'
                        title={nft.name}
                      >
                        {nft.name}
                      </h3>
                      <p className='text-xs text-gray-500 mb-3'>
                        {nft.collection}
                      </p>
                      <div className='mt-auto flex items-center justify-between'>
                        <span className='text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600'>
                          Qty: {nft.balance}
                        </span>
                        <div className='flex items-center gap-2'>
                          <input
                            type='checkbox'
                            className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                            checked={selectedItems.some(
                              (item) => item.identifier === nft.identifier
                            )}
                            onChange={() => toggleSelection(nft)}
                          />
                          <button
                            onClick={() => openTransfer(nft, 'NFT')}
                            className='rounded-full p-2 text-indigo-600 hover:bg-indigo-50 transition-colors'
                            title='Transfer'
                          >
                            <FontAwesomeIcon icon={faPaperPlane} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'TOKENS' && (
            <div className='overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm'>
              <table className='min-w-full divide-y divide-gray-200 text-sm'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left font-semibold text-gray-900'>
                      Token
                    </th>
                    <th className='px-6 py-3 text-right font-semibold text-gray-900'>
                      Balance
                    </th>
                    <th className='px-6 py-3 text-right font-semibold text-gray-900'>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 bg-white'>
                  {tokens.map((token: any) => (
                    <tr key={token.identifier} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap flex items-center gap-3'>
                        {token.assets?.svgUrl ? (
                          <img
                            src={token.assets.svgUrl}
                            alt={token.name}
                            className='h-8 w-8 rounded-full'
                          />
                        ) : (
                          <div className='h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold'>
                            {token.name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className='font-medium text-gray-900'>
                            {token.name}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {token.identifier}
                          </p>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900'>
                        <FormatAmount
                          amount={token.balance}
                          identifier={token.identifier}
                        />
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right'>
                        <button
                          onClick={() => openTransfer(token, 'TOKEN')}
                          className='inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors'
                        >
                          <FontAwesomeIcon icon={faExchangeAlt} />
                          Transfer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tokens.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className='px-6 py-12 text-center text-slate-500'
                      >
                        No tokens found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Batch Action Bar */}
        {selectedItems.length > 0 && activeTab === 'NFTS' && (
          <div className='fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-xl px-6 py-3 border border-gray-200 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4'>
            <span className='font-medium text-gray-900'>
              {selectedItems.length} selected
            </span>
            <div className='h-4 w-px bg-gray-300' />
            <button
              onClick={() => setSelectedItems([])}
              className='text-sm text-gray-500 hover:text-gray-700'
            >
              Cancel
            </button>
            <button
              onClick={openBatchTransfer}
              className='bg-indigo-600 text-white rounded-full px-4 py-1.5 text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2'
            >
              <FontAwesomeIcon icon={faPaperPlane} />
              Send Selected
            </button>
          </div>
        )}

        <TransferModal
          isOpen={transferModal.isOpen}
          onClose={() =>
            setTransferModal((prev) => ({ ...prev, isOpen: false }))
          }
          asset={transferModal.asset}
          type={transferModal.type}
        />
      </PageTemplate>
    </div>
  );
};
