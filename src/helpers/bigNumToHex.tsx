import BigNumber from 'bignumber.js';

const bigToHex = (bn: BigNumber) => {
  const base = 16;

  // Convertir BigNumber en chaîne hexadécimale
  let hex = bn.toString(base);

  // Si la longueur est impaire, ajouter un zéro devant
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }

  return hex;
};

export default bigToHex;
