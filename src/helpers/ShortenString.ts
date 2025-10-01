type ShortenString = (fullString: string, len: number) => string;

const shortenString: ShortenString = (fullString, len) => {
  return fullString?.length > len * 2
    ? `${fullString.substring(0, len)}...${fullString.substring(
        fullString?.length - len
      )}`
    : fullString;
};

export default shortenString;
