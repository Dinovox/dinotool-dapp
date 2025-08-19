import { useState, useEffect } from 'react';
import { useGetAccount } from 'lib';
import { NFT } from '../types/nft';

export const useNFTs = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useGetAccount();

  const fetchNFTs = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      // Simulation d'appel API MultiversX pour récupérer les NFTs
      const response = await fetch(
        `https://devnet-api.multiversx.com/accounts/${address}/nfts?size=100`
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des NFTs');
      }

      const data = await response.json();

      // Transformation des données pour correspondre à notre interface
      const transformedNFTs: NFT[] = data.map((nft: any) => ({
        identifier: nft.identifier,
        name: nft.name || `NFT #${nft.nonce}`,
        collection: nft.collection,
        nonce: nft.nonce,
        type: nft.type,
        creator: nft.creator,
        royalties: nft.royalties || 0,
        uris: nft.uris || [],
        url: nft.url || '',
        media: nft.media,
        isWhitelistedStorage: nft.isWhitelistedStorage || false,
        metadata: nft.metadata,
        balance: nft.balance || '1',
        ownedByCurrentUser: true
      }));

      setNfts(transformedNFTs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      // Données de démonstration en cas d'erreur
      setNfts([
        {
          identifier: 'DEMO-123456-01',
          name: 'Dinovox Genesis #1',
          collection: 'DINOVOX-abc123',
          nonce: 1,
          type: 'NonFungibleESDT',
          creator: 'erd1...',
          royalties: 500,
          uris: ['https://example.com/metadata.json'],
          url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
          media: [
            {
              url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
              originalUrl:
                'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
              thumbnailUrl:
                'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200',
              fileType: 'image/jpeg',
              fileSize: 150000
            }
          ],
          isWhitelistedStorage: true,
          metadata: {
            description: 'Un NFT rare de la collection Genesis Dinovox',
            attributes: [
              { trait_type: 'Rarity', value: 'Legendary' },
              { trait_type: 'Element', value: 'Fire' }
            ]
          },
          balance: '1',
          ownedByCurrentUser: true
        },
        {
          identifier: 'DEMO-123456-02',
          name: 'Dinovox Warrior #42',
          collection: 'DINOVOX-abc123',
          nonce: 42,
          type: 'NonFungibleESDT',
          creator: 'erd1...',
          royalties: 500,
          uris: ['https://example.com/metadata2.json'],
          url: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400',
          media: [
            {
              url: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400',
              originalUrl:
                'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800',
              thumbnailUrl:
                'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200',
              fileType: 'image/jpeg',
              fileSize: 180000
            }
          ],
          isWhitelistedStorage: true,
          metadata: {
            description: 'Un guerrier puissant de la collection Dinovox',
            attributes: [
              { trait_type: 'Rarity', value: 'Epic' },
              { trait_type: 'Element', value: 'Earth' }
            ]
          },
          balance: '1',
          ownedByCurrentUser: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, [address]);

  return {
    nfts,
    loading,
    error,
    refetch: fetchNFTs
  };
};
