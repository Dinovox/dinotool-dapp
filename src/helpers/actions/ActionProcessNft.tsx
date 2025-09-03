//not imported/used anywhere yet should be used to refresh nft thumbnails if needed
//requires auth token from login with mvx utils
//https://utils.multiversx.com/auth
//https://docs.multiversx.com/developer-tools/mvx-utils/authentication

import React, { useState } from 'react';
import { useGetAccountInfo, useGetLoginInfo, useGetNetworkConfig } from 'lib';

export const ActionProcessNft: React.FC<{
  collection: string;
}> = ({ collection }) => {
  const { network } = useGetNetworkConfig();

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { tokenLogin } = useGetLoginInfo();
  console.log('tokenLogin', tokenLogin);
  const handleSend = async () => {
    if (!collection || !tokenLogin) return;

    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      // not working. maybe ttl ? or header origins ?
      // token genereted by mvx utils does work.
      // https://utils.multiversx.com/auth
      const res = await fetch(
        `${network.apiAddress}/nfts/process`,

        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenLogin.nativeAuthToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            collection,
            forceRefreshThumbnail: true
          })
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to process NFT collection');
      }

      const result = await res.json();
      setResponse('Thumbnail refresh successfully triggered.');
      console.log('Process NFT result:', result);
    } catch (err: any) {
      console.error('Error processing NFT:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {collection && (
        <>
          <button
            className='dinoButton'
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Process NFT'}
          </button>
          {response && (
            <p className='text-green-600 text-sm mt-2'>{response}</p>
          )}
          {error && <p className='text-red-500 text-sm mt-2'>{error}</p>}
        </>
      )}
    </>
  );
};
