import BigNumber from 'bignumber.js';

const bigNumToHex = (bn: BigNumber) => {
  const base = 16;

  // Convertir en chaîne hexadécimale
  let hex = bn.toString(base);

  // Si la longueur est impaire, ajouter un zéro devant
  return hex.length % 2 !== 0 ? '0' + hex : hex;
};

export { bigNumToHex };
