import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';
import axios from 'axios';
import { useGetNetworkConfig } from 'lib';
import toHex from 'helpers/toHex';
import type { UserNft } from './../useGetUserNft';

type NftStatus = 'idle' | 'loading' | 'loaded' | 'error';

type NftRecord = {
  status: NftStatus;
  data?: UserNft;
  error?: string | null;
  lastFetched?: number;
};

type NftContextValue = {
  /**
   * Accès brut au cache, par clé "identifier-hexNonce"
   */
  cache: Record<string, NftRecord>;
  /**
   * Déclenche le fetch si nécessaire (cache mémoire + localStorage + API MVX).
   */
  requestNft: (identifier: string, nonce: string, type?: string) => void;
};

const NftContext = createContext<NftContextValue | undefined>(undefined);

// TTL du cache localStorage : 1000 minutes comme ton hook actuel
const CACHE_TTL_MS = 1000 * 60 * 1000;

const buildKey = (identifier: string, nonce: string) =>
  `esdt_${identifier}-${toHex(nonce)}`;

type NftProviderProps = {
  children: React.ReactNode;
};

export const NftProvider: React.FC<NftProviderProps> = ({ children }) => {
  const { network } = useGetNetworkConfig();
  const [cache, setCache] = useState<Record<string, NftRecord>>({});

  const loadFromLocalStorage = (key: string): UserNft | null => {
    try {
      const expireStr = localStorage.getItem(`${key}_expire`);
      if (!expireStr) return null;
      const expire = Number(expireStr);
      if (Date.now() > expire) return null;

      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.identifier) return null;
      return parsed as UserNft;
    } catch {
      return null;
    }
  };

  const saveToLocalStorage = (key: string, nft: UserNft) => {
    try {
      const expire = Date.now() + CACHE_TTL_MS;
      localStorage.setItem(key, JSON.stringify(nft));
      localStorage.setItem(`${key}_expire`, expire.toString());
    } catch {
      // ignore storage errors
    }
  };

  const requestNft = useCallback(
    (identifier: string, nonce: string, type?: string) => {
      if (
        !identifier ||
        !nonce ||
        nonce === '0' ||
        identifier === 'EGLD-000000' ||
        type === 'ESDT' ||
        type === 'ignore'
      ) {
        return;
      }

      const key = buildKey(identifier, nonce);

      // 1) Si déjà en mémoire et "loaded" récent => on ne refetch pas
      const existing = cache[key];
      if (existing && existing.status === 'loaded') {
        return;
      }
      if (existing && existing.status === 'loading') {
        return;
      }

      // 2) Tentative de lecture depuis localStorage
      const fromStorage = loadFromLocalStorage(key);
      if (fromStorage) {
        setCache((prev) => ({
          ...prev,
          [key]: {
            status: 'loaded',
            data: fromStorage,
            error: null,
            lastFetched: Date.now()
          }
        }));
        return;
      }

      // 3) Sinon, on déclenche un fetch réseau
      setCache((prev) => ({
        ...prev,
        [key]: { status: 'loading', error: null }
      }));

      const url = `/nfts/${identifier}-${toHex(nonce)}`;

      axios
        .get(url, {
          baseURL: network.apiAddress
        })
        .then((res) => {
          const data = res.data as UserNft;
          setCache((prev) => ({
            ...prev,
            [key]: {
              status: 'loaded',
              data,
              error: null,
              lastFetched: Date.now()
            }
          }));
          saveToLocalStorage(key, data);
        })
        .catch((err) => {
          console.error('Unable to fetch NFT info', err);
          setCache((prev) => ({
            ...prev,
            [key]: { status: 'error', error: 'Unable to fetch NFT' }
          }));
        });
    },
    [cache, network.apiAddress]
  );

  const value: NftContextValue = {
    cache,
    requestNft
  };

  return <NftContext.Provider value={value}>{children}</NftContext.Provider>;
};

/**
 * Hook bas niveau : donne accès au contexte brut.
 */
const useNftContext = () => {
  const ctx = useContext(NftContext);
  if (!ctx) {
    throw new Error('useNft must be used within a NftProvider');
  }
  return ctx;
};

/**
 * Hook global : tu lui donnes identifier + nonce, il te renvoie
 * le UserNft (+ états de chargement/erreur) en s’appuyant sur :
 * - cache mémoire
 * - localStorage
 * - API MVX
 */
export const useNft = (
  identifier?: string,
  nonce?: string,
  type?: string
): {
  nft: UserNft | null;
  status: NftStatus;
  isLoading: boolean;
  error: string | null;
} => {
  const { cache, requestNft } = useNftContext();

  const key = identifier && nonce ? buildKey(identifier, nonce) : undefined;

  useEffect(() => {
    if (identifier && nonce) {
      requestNft(identifier, nonce, type);
    }
  }, [identifier, nonce, type, requestNft]);

  if (!key) {
    return {
      nft: null,
      status: 'idle',
      isLoading: false,
      error: null
    };
  }

  const record = cache[key] || { status: 'idle' as NftStatus };

  return {
    nft: record.data || null,
    status: record.status,
    isLoading: record.status === 'loading',
    error: record.error || null
  };
};
