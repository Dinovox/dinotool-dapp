import { useEffect, useState } from 'react';
import axios from 'axios';
// import { network } from 'config';
import { useGetNetworkConfig } from 'hooks';

export const useGetDinoHolders = (identifier: string) => {
  const { network } = useGetNetworkConfig();
  //const { network } = useGetNetworkConfig();
  const time = new Date();
  const [holders, setHolders] = useState<any>({});

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

  const getDinoHolders = async () => {
    //using storage to reduce calls
    const expire_test = Number(
      localStorage.getItem('holders_' + identifier + '_expire')
    );
    if (time.getTime() < expire_test) {
      //const storage = localStorage.getItem('esdt_' + identifier);
      const storage = JSON.parse(
        localStorage.getItem('holders_' + identifier) as string
      );

      //const esdt = JSON.parse(storage);
      setHolders(storage);
      return;
    }

    if (identifier == '' || identifier == undefined) {
      return;
    }

    const url = '/collections/' + identifier + '/accounts?size=10000';

    try {
      const { data } = await axios.get<[]>(url, {
        baseURL: 'https://api.multiversx.com',
        params: {}
      });
      setHolders(data);
      //storage of 1000 minutes
      const expire = time.getTime() + 1000 * 60 * 1000;
      localStorage.setItem('holders_' + identifier, JSON.stringify(data));
      localStorage.setItem(
        'holders_' + identifier + '_expire',
        expire.toString()
      );
    } catch (err) {
      console.error('Unable to fetch Holdders');
      setHolders([]);
    }
  };

  useEffect(() => {
    getDinoHolders();
  }, [identifier]);

  return holders;
};
