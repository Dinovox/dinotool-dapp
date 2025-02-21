import { useEffect, useState } from 'react';
import axios from 'axios';
// import { network } from 'config';
import { useGetLoginInfo } from '@multiversx/sdk-dapp/hooks/account/useGetLoginInfo';

export const useGetDinoStakers = () => {
  // console.log('useGetDinoStakers');
  const time = new Date();
  const [holders, setHolders] = useState<any>({});
  const { tokenLogin, isLoggedIn } = useGetLoginInfo();

  const getDinoStakers = async () => {
    //using storage to reduce calls
    const expire_test = Number(localStorage.getItem('stakers_expire'));
    if (time.getTime() < expire_test) {
      const storage = localStorage.getItem('stakers');
      console.log('storage', storage);
      if (storage) {
        setHolders(JSON.parse(storage));
      } else {
        setHolders({});
      }
      setHolders(storage);
      return;
    }

    const url = '/stats/dino/stakers';
    if (tokenLogin) {
      try {
        const { data } = await axios.get<{ wallets: any[] }>(url, {
          baseURL: 'https://internal.mvx.fr',
          params: {},
          headers: {
            Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
          }
        });
        if (!data.wallets) {
          setHolders(data.wallets);
          return;
        }
        //storage of 1000 minutes
        const expire = time.getTime() + 1000 * 60 * 1000;
        localStorage.setItem('stakers', JSON.stringify(data.wallets));
        localStorage.setItem('stakers_expire', expire.toString());
      } catch (err) {
        console.error('Unable to fetch stakers');
        setHolders([]);
      }
    } else {
      console.log('Not logged in');
    }
  };

  useEffect(() => {
    getDinoStakers();
  }, []);

  return holders;
};
