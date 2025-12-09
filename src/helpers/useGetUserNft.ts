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

// Update hook signature and URL construction
export const useGetUserNFT = (
  address: string,
  identifier?: string,
  collection?: string,
  opts?: {
    refreshKey?: number;
    from?: number;
    size?: number;
    search?: string;
    enabled?: boolean;
  }
) => {
  const [esdtBalance, setNftBalance] = useState(<any>[]);
  const refreshKey = opts?.refreshKey ?? 0;
  const from = opts?.from ?? 0;
  const size = opts?.size ?? 1000;
  const search = opts?.search ?? '';
  const enabled = opts?.enabled ?? true;

  const transactions = useGetPendingTransactions();
  // const hasPendingTransactions = transactions.length > 0;

  let url = `/accounts/${address}/nfts?from=${from}&size=${size}`;
  if (identifier) {
    url = url + `&identifiers=${identifier}`;
  }
  if (collection) {
    url = url + `&collections=${collection}`;
  }
  if (search) {
    url = url + `&search=${search}`;
  } else {
    // Default to dinovox collection if no specific search (as per user request "filtrer sur la collection" but let's keep it generic or follow previous behavior?)
    // Actually previous behavior didn't filter by collection by default unless passed as arg.
    // But user said "prends en charge la recherche sur l'api pour filtrer sur la collection".
    // Usually "search" param on /nfts searches name/identifier. To filter collection we use &collections=.
    // I'll assume 'search' param maps to 'search' query param for generic search, OR 'collections' if user meant that.
    // But looking at existing code: url = url + `&collections=${collection}`; is already there.
    // So I add &search=${search} for generic text search.
  }

  // Clean up URL logic
  const getUserNFT = async () => {
    if (!enabled) return;

    if (!address || address == '') {
      return;
    }
    // Reconstruct URL cleanly
    const params: any = {
      from,
      size
    };
    if (identifier) params.identifiers = identifier;
    if (collection) params.collections = collection;
    if (search) params.search = search; // API usually supports 'search' or 'name' or 'identifier'. MultiversX API docs says?
    // MultiversX API /accounts/{address}/nfts supports: search (Search by collection identifier, name or ticker)

    try {
      const { data } = await axios.get<[]>(`/accounts/${address}/nfts`, {
        baseURL: API_URL,
        params
      });
      setNftBalance(data);
    } catch (err) {
      console.error('Unable to fetch Tokens');
      setNftBalance([]);
    }
  };

  useEffect(() => {
    if (!enabled || !address || address == '') {
      setNftBalance([]);
      return;
    }
    getUserNFT();
  }, [
    address,
    identifier,
    collection,
    refreshKey,
    from,
    size,
    search,
    enabled
  ]);

  return esdtBalance as UserNftResponse;
};
