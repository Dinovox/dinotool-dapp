import BigNumber from 'bignumber.js';
import { bigNumToHex } from './bigNumToHex';
import { use } from 'i18next';
import { useGetNetworkConfig } from 'lib';

export function parseTokenIdentifier(identifier: string): {
  collection: string;
  nonce: number;
} {
  if (!identifier || typeof identifier !== 'string') {
    return { collection: '', nonce: 0 };
  }

  const parts = identifier.split('-');
  // Cas 1 : DINOBOOST-9f6811-01  (avec nonce hexadécimal)
  if (parts.length >= 3) {
    const collection = parts.slice(0, 2).join('-'); // DINOBOOST-9f6811
    const nonceHex = parts[2];
    const nonce = parseInt(nonceHex, 16); // "01" => 1
    return { collection, nonce: Number.isFinite(nonce) ? nonce : 0 };
  }

  // Cas 2 : DINOBOOST-9f6811 (pas de nonce)
  return {
    collection: identifier.trim(),
    nonce: 0
  };
}
export function buildTokenIdentifier(
  collection: string,
  nonce: number
): string {
  if (!collection) return '';
  if (!nonce || nonce <= 0) return collection;

  // Convertit en hex, puis pad à une longueur paire
  let nonceHex = nonce.toString(16);
  if (nonceHex.length % 2 !== 0) {
    nonceHex = '0' + nonceHex;
  }

  return `${collection}-${nonceHex}`;
}

export function buildExplorerLinks(
  collection: string,
  nonce: number,
  url: string | null = null
) {
  const tokenUrl = `${url}/tokens/${collection}`;
  const collectionUrl = `${url}/collections/${collection}`;
  const itemUrl =
    Number(nonce) > 0
      ? `${url}/nfts/${collection}-${bigNumToHex(new BigNumber(nonce))}`
      : null;

  return { tokenUrl, collectionUrl, itemUrl };
}
