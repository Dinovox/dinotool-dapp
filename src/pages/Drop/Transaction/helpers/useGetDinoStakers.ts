import { useEffect, useState } from 'react';
import axios from 'axios';
import { useGetLoginInfo } from '@multiversx/sdk-dapp/hooks/account/useGetLoginInfo';
import { internal_api } from 'config';

export const useGetDinoStakers = () => {
  const time = new Date();
  const [holders, setHolders] = useState<any[]>([]);
  const { tokenLogin, isLoggedIn } = useGetLoginInfo();

  const getDinoStakers = async () => {
    const expire_test = Number(localStorage.getItem('stakers_expire'));
    if (time.getTime() < expire_test) {
      const storage = localStorage.getItem('stakers');

      if (storage) {
        try {
          setHolders(JSON.parse(storage));
        } catch (error) {
          console.error('Failed to parse stakers from localStorage', error);
          setHolders([]);
        }
      } else {
        setHolders([]);
      }
      return;
    }

    if (!tokenLogin) {
      return;
    }

    try {
      const { data } = await axios.get<{ wallets: any[] }>(
        '/stats/dino/stakers',
        {
          baseURL: internal_api,
          headers: { Authorization: `Bearer ${tokenLogin.nativeAuthToken}` }
        }
      );

      if (data.wallets && Array.isArray(data.wallets)) {
        setHolders(data.wallets);
        localStorage.setItem('stakers', JSON.stringify(data.wallets));
        localStorage.setItem(
          'stakers_expire',
          (time.getTime() + 1000 * 60 * 1000).toString()
        );
      } else {
        setHolders([]);
      }
    } catch (err) {
      console.error('Unable to fetch stakers', err);
      setHolders([]);
    }
  };

  useEffect(() => {
    getDinoStakers();
  }, [tokenLogin]);

  return holders;
};
