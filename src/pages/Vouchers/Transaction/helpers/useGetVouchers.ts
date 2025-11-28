import { useEffect, useState } from 'react';
import axios from 'axios';
import { useGetLoginInfo } from 'lib';
import { dinoclaim_api } from 'config';

export const useGetVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const { tokenLogin, isLoggedIn } = useGetLoginInfo();

  useEffect(() => {
    const fetchVouchers = async () => {
      if (!tokenLogin) return; // Ne fait rien si pas connecté

      try {
        const config = {
          headers: {
            Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
          }
        };

        const { data } = await axios.get(`${dinoclaim_api}/vouchers`, config);

        setVouchers(data?.vouchers || []);
      } catch (err) {
        console.error('Unable to fetch vouchers', err);
        setVouchers([]);
      }
    };

    fetchVouchers();
  }, [tokenLogin]);

  return vouchers;
};
