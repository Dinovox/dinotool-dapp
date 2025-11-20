// src/utils/getTokenDecimals.ts
import axios from 'axios';
import { useGetNetworkConfig } from 'lib';

// Fonction utilitaire pour récupérer et mettre en cache les décimales d’un token ESDT
export async function getTokenDecimals(
  identifier: string,
  apiAddress: string = useGetNetworkConfig().network.apiAddress
): Promise<number | null> {
  if (!identifier) return null;
  //   const { network } = useGetNetworkConfig();
  // Cache global partagé
  const cache: Map<string, number | null> =
    (window as any).__tokenDecimalsCache ||
    ((window as any).__tokenDecimalsCache = new Map());

  // Si déjà en cache → retourne immédiatement
  if (cache.has(identifier)) {
    const cached = cache.get(identifier);
    if (typeof cached === 'number') return cached;
  }

  try {
    const res = await axios.get(`${apiAddress}/tokens/${identifier}`);
    const dec = Number(res?.data?.decimals);
    const valid = Number.isFinite(dec) ? dec : null;

    cache.set(identifier, valid);
    return valid;
  } catch (err) {
    cache.set(identifier, null);
    return null;
  }
}
