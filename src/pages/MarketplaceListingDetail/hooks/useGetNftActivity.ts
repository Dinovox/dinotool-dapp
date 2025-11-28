import { useEffect, useState } from 'react';
import axios from 'axios';
import { useGetNetworkConfig } from 'lib';

export interface NftActivity {
  txHash: string;
  gasLimit: number;
  gasPrice: number;
  gasUsed: number;
  miniBlockHash: string;
  nonce: number;
  receiver: string;
  receiverShard: number;
  round: number;
  sender: string;
  senderShard: number;
  signature: string;
  status: string;
  value: string;
  fee: string;
  timestamp: number;
  data: string;
  function: string;
  action?: {
    category: string;
    name: string;
    description: string;
    arguments?: any;
  };
}

export const useGetNftActivity = (identifier?: string) => {
  const { network } = useGetNetworkConfig();
  const [activity, setActivity] = useState<NftActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!identifier || !network.apiAddress) return;

      setIsLoading(true);
      setError(null);

      try {
        // Try /nfts/{identifier}/transactions endpoint
        const { data } = await axios.get<NftActivity[]>(
          `/nfts/${identifier}/transactions`,
          {
            baseURL: network.apiAddress,
            params: {
              size: 50, // Limit to 50 recent transactions
              withScResults: true
            }
          }
        );
        setActivity(data);
      } catch (err) {
        console.error('Failed to fetch NFT activity', err);
        setError('Failed to load activity');

        // Fallback: try /transactions?token={identifier} if the above fails
        try {
          const { data } = await axios.get<NftActivity[]>(`/transactions`, {
            baseURL: network.apiAddress,
            params: {
              token: identifier,
              size: 50,
              withScResults: true
            }
          });
          setActivity(data);
          setError(null);
        } catch (fallbackErr) {
          console.error('Fallback fetch failed', fallbackErr);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [identifier, network.apiAddress]);

  return { activity, isLoading, error };
};
