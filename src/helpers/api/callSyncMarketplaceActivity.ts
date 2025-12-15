import axios, { AxiosRequestConfig } from 'axios';
import { dinoclaim_api } from 'config';

export const callSyncMarketplaceActivity = async () => {
  try {
    const url = `/marketplace/activity/sync`;
    const config: AxiosRequestConfig = {
      baseURL: dinoclaim_api
    };
    await axios.get(url, config);
    console.log('Marketplace activity synced');
  } catch (err) {
    console.error('Failed to sync marketplace activity', err);
  }
};
