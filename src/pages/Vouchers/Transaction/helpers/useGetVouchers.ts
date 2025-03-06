import { useEffect, useState } from 'react';
import axios from 'axios';
import { useGetLoginInfo } from 'hooks';

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

        const { data } = await axios.get(
          'https://internal.mvx.fr/dinovox/vouchers',
          config
        );

        setVouchers(data?.vouchers || []); // Assure que ça reste un tableau
      } catch (err) {
        console.error('Unable to fetch vouchers', err);
        setVouchers([]); // Évite que l'état soit undefined en cas d'erreur
      }
    };

    fetchVouchers();
  }, [tokenLogin]); // Se recharge uniquement si `tokenLogin` change

  return vouchers;
};
