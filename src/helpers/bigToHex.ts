const bigToHex = (bn: bigint) => {
  const base = 16;
  let hex = BigInt(bn).toString(base);
  if (hex.length % 2) {
    hex = '0' + hex;
  }
  return hex;
};
export default bigToHex;
