import { useEffect, useState } from 'react';
import { useGetNetworkConfig, useGetPendingTransactions } from 'lib';
import axios from 'axios';
import { API_URL } from 'config';

export type NftMedia = {
  url: string;
  originalUrl?: string;
  thumbnailUrl?: string;
  fileType?: string;
  fileSize?: number;
};

export type NftAttribute = {
  trait_type?: string;
  value?: string | number | boolean | null;
};

export type NftMetadata =
  | {
      tokenId?: number;
      name?: string;
      description?: string;
      attributes?: NftAttribute[] | Record<string, any>;
      [key: string]: any;
    }
  | {
      error: {
        code: string;
        message: string;
        timestamp: number;
        [k: string]: any;
      };
    };

export type UserNft = {
  identifier: string;
  collection: string;
  attributes?: string;
  hash?: string;
  nonce?: number;
  type: string;
  subType?: string;
  name: string;
  creator?: string;
  royalties?: number;
  uris?: string[];
  url?: string;
  media?: NftMedia[];
  isWhitelistedStorage?: boolean;
  tags?: string[];
  metadata?: NftMetadata | Record<string, any>;
  balance: string;
  ticker: string;
  decimals?: number;
  score?: number;
  rank?: number;
  isNsfw?: boolean;
  [key: string]: any;
};

export type UserNftResponse = UserNft[];

export const useGetUserNFT = (
  address: string,
  identifier?: string,
  collection?: string,
  opts?: { refreshKey?: number }
) => {
  const network = useGetNetworkConfig();
  const [esdtBalance, setNftBalance] = useState(<any>[]);
  const refreshKey = opts?.refreshKey ?? 0;

  // const address = useGetAccountInfo().address;
  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;
  let url = '/accounts/' + address + '/nfts?from=0&size=1000';
  if (identifier) {
    url = url + `&identifiers=${identifier}`;
  }
  if (collection) {
    url = url + `&collections=${collection}`;
  }
  const getUserNFT = async () => {
    if (!address || address == '') {
      return;
    }
    try {
      const { data } = await axios.get<[]>(url, {
        baseURL: API_URL,
        params: {}
      });
      setNftBalance(data);
    } catch (err) {
      console.error('Unable to fetch Tokens');
      setNftBalance([]);
    }
  };

  useEffect(() => {
    getUserNFT();
  }, [address, identifier, refreshKey]);

  return esdtBalance as UserNftResponse;
};
