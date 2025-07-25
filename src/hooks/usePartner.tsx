import { useState, useEffect } from 'react';
import { useGetAccount } from 'hooks';
import { Partner } from '../types/nft';

export const usePartner = () => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(false);
  const { address } = useGetAccount();

  const checkPartnerStatus = async () => {
    if (!address) return;

    setLoading(true);

    try {
      // Simulation d'appel API pour vérifier le statut partenaire
      // En réalité, ceci ferait appel à votre backend

      // Simulation : certaines adresses sont des partenaires
      const isPartnerAddress = address.includes('erd1') || address.length > 50;

      if (isPartnerAddress) {
        setPartner({
          address,
          name: 'Partenaire Dinovox',
          email: 'partner@dinovox.com',
          isVerified: true,
          joinDate: new Date('2024-01-15'),
          totalLockedNFTs: 5
        });
      } else {
        setPartner(null);
      }
    } catch (error) {
      console.error(
        'Erreur lors de la vérification du statut partenaire:',
        error
      );
      setPartner(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPartnerStatus();
  }, [address]);

  return {
    partner,
    loading,
    isPartner: !!partner,
    refetch: checkPartnerStatus
  };
};
