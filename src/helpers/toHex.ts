function toHex(d: any) {
  let result = '';
  result = Number(d).toString(16);
  if (Math.abs(result.length % 2) == 1) {
    result = '0' + result;
  }
  return result;
  //return  ((Number(d).toString(16)));//.slice(-2).toUpperCase();
}
export default toHex;
