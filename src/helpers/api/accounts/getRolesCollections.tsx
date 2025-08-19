import { useEffect, useState } from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import { useGetNetworkConfig } from 'lib';
import { API_URL } from 'config';

export interface Role {
  canCreate: boolean;
  canBurn: boolean;
  canAddQuantity: boolean;
  canUpdateAttributes: boolean;
  canAddUri: boolean;
  canTransfer: boolean;
  roles: string[];
}

export interface RolesCollections {
  collection: string;
  type: string;
  subType: string;
  name: string;
  ticker: string;
  owner: string;
  timestamp: number;
  canFreeze: boolean;
  canWipe: boolean;
  canPause: boolean;
  canTransferNFTCreateRole: boolean;
  canChangeOwner: boolean;
  canUpgrade: boolean;
  canAddSpecialRoles: boolean;
  canTransfer: boolean;
  canCreate: boolean;
  canBurn: boolean;
  canAddQuantity: boolean;
  canUpdateAttributes: boolean;
  canAddUri: boolean;
  role: Role;
}

export interface UseAccountsRolesOptions {
  from?: number;
  size?: number;
  search?: string;
  type?: string;
  subType?: string;
  owner?: string;
  canCreate?: boolean;
  canBurn?: boolean;
  canAddQuantity?: boolean;
  canUpdateAttributes?: boolean;
  canTransferRole?: boolean;
  excludeMetaESDT?: boolean;
}

export const useAccountsRolesCollections = (
  address: string,
  options: UseAccountsRolesOptions = {}
) => {
  const { network } = useGetNetworkConfig();
  const [data, setData] = useState<RolesCollections[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      let url = `/accounts/${address}/roles/collections`;
      const config: AxiosRequestConfig = {
        baseURL: API_URL,
        params: { ...options }
      };
      console.log('fetching roles collections', url, config);

      try {
        const response = await axios.get<RolesCollections[]>(url, config);
        console.log('response', response);
        setData(response.data);
      } catch (err: any) {
        setError('Failed to fetch roles collections');
        console.error(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchData();
    }
  }, [address, JSON.stringify(options), network.apiAddress]);

  return { data, loading, error };
};
