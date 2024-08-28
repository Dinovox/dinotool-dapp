import { useEffect, useState } from 'react';
import axios from 'axios';
// import { network } from 'config';
import { useGetNetworkConfig } from 'hooks';
import toHex from 'helpers/toHex';

export const useGetNftInformations = (identifier: string, nonce: string) => {
  const { network } = useGetNetworkConfig();
  //const { network } = useGetNetworkConfig();
  const time = new Date();
  const [esdtInfo, setEsdtInfo] = useState<any>({});

  // {
  //   "identifier": "WORLD-dbf560-01",
  //   "collection": "WORLD-dbf560",
  //   "timestamp": 1680906336,
  //   "attributes": "dGFnczpibHVyZWQgZmlzaDttZXRhZGF0YTpRbVJjUDk0a1hyNXpaalJHdmk3bUo2dW43THB4VWhZVlI0UjRScGljeHpnWWt0",
  //   "nonce": 1,
  //   "type": "NonFungibleESDT",
  //   "name": "BLURED",
  //   "creator": "erd12stex47hwg0hvx8cfvukj3y3ugs7dm0686k3wasycffexva6ch9s7tvj29",
  //   "royalties": 25,
  //   "uris": [
  //     "aHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1TbjRXZnBjaldkdlM0NERoM1U4Z1RjU2ZkUEZZMmNnWk5qeHlYUG0xM3NYaA=="
  //   ],
  //   "url": "https://devnet-media.elrond.com/nfts/asset/QmSn4WfpcjWdvS44Dh3U8gTcSfdPFY2cgZNjxyXPm13sXh",
  //   "media": [
  //     {
  //       "url": "https://devnet-media.elrond.com/nfts/asset/QmSn4WfpcjWdvS44Dh3U8gTcSfdPFY2cgZNjxyXPm13sXh",
  //       "originalUrl": "https://ipfs.io/ipfs/QmSn4WfpcjWdvS44Dh3U8gTcSfdPFY2cgZNjxyXPm13sXh",
  //       "thumbnailUrl": "https://devnet-media.elrond.com/nfts/thumbnail/WORLD-dbf560-a5aad70c",
  //       "fileType": "image/png",
  //       "fileSize": 831291
  //     }
  //   ],
  //   "isWhitelistedStorage": true,
  //   "tags": [
  //     "blured fish"
  //   ],
  //   "metadata": {
  //     "error": {
  //       "code": "empty_metadata",
  //       "message": "Metadata value is empty",
  //       "timestamp": 1681069952
  //     }
  //   },
  //   "owner": "erd1qqqqqqqqqqqqqpgqtqyp5v7nwnrvxhlnxav7z6k27an2m4vkch9sgsmrrt",
  //   "ticker": "WORLD-dbf560",
  //   "rarities": {}
  // }

  const getEsdtInfo = async () => {
    console.log('getinfo', identifier, toHex(nonce));
    //using storage to reduce calls
    const expire_test = Number(
      localStorage.getItem(
        'esdt_' + identifier + '-' + toHex(nonce) + '_expire'
      )
    );
    if (time.getTime() < expire_test) {
      //const storage = localStorage.getItem('esdt_' + identifier);
      const storage = JSON.parse(
        localStorage.getItem(
          'esdt_' + identifier + '-' + toHex(nonce)
        ) as string
      );

      //const esdt = JSON.parse(storage);
      setEsdtInfo(storage);
      return;
    }

    if (identifier == '' || identifier == undefined || nonce == '') {
      return;
    }
    const url = '/nfts/' + identifier + '-' + toHex(nonce);

    try {
      const { data } = await axios.get<[]>(url, {
        baseURL: network.apiAddress,
        params: {}
      });
      setEsdtInfo(data);
      //storage of 1000 minutes
      const expire = time.getTime() + 1000 * 60 * 1000;
      localStorage.setItem(
        'esdt_' + identifier + '-' + toHex(nonce),
        JSON.stringify(data)
      );
      localStorage.setItem(
        'esdt_' + identifier + '-' + toHex(nonce) + '_expire',
        expire.toString()
      );
    } catch (err) {
      console.error('Unable to fetch Tokens');
      setEsdtInfo([]);
    }
  };

  useEffect(() => {
    getEsdtInfo();
  }, [identifier, nonce]);

  return esdtInfo;
};
