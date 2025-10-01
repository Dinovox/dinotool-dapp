import React, { useState } from 'react';
import axios from 'axios';
import { dinoclaim_api } from 'config';
import { useGetLoginInfo } from 'lib';

export const PutCampaignIDButton = ({
  uuid,
  collection,
  nonce,
  title,
  max_total_sends
}: any) => {
  const { tokenLogin } = useGetLoginInfo();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const handleClick = async () => {
    if (!tokenLogin) return;
    setLoading(true);
    setError(null);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
        }
      };
      const { data } = await axios.put(
        dinoclaim_api + '/campaigns/' + uuid,
        { collection: collection, nonce: nonce, title: title, max_total_sends },
        config
      );
      setResult(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading || !tokenLogin}>
        {loading ? 'Posting...' : 'PUT Campaign'}
        {uuid} - {collection}
      </button>
      {result && <div>Success: {JSON.stringify(result)}</div>}
      {error && <div>Error: {error.message || 'Unknown error'}</div>}
    </div>
  );
};
