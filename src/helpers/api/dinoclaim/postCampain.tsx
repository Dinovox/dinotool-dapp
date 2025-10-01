import React, { useState } from 'react';
import axios from 'axios';
import { dinoclaim_api } from 'config';
import { useGetLoginInfo } from 'lib';

type CampaignPreview = {
  id: string;
  title: string;
  status: string;
  start_at?: string;
  end_at?: string;
  collection?: string;
  nonce?: number;
  created_at?: string;
  updated_at?: string;
  max_total_sends?: number;
  max_sends_per_wallet?: number;
  daily_send_cap?: number;
  total_sends?: number;
};

export const PostCampaignButton: React.FC<{
  onCreated?: (editedCampaign: CampaignPreview) => void;
}> = ({ onCreated }) => {
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
      const { data } = await axios.post(
        dinoclaim_api + '/campaigns',
        { answer: '' },
        config
      );
      setResult(data);
      if (onCreated && data?.campaign?.id) {
        onCreated({
          id: data.campaign.id,
          title: data.campaign.title,
          status: data.campaign.status,
          start_at: data.campaign.start_at,
          end_at: data.campaign.end_at,
          collection: data.campaign.collection,
          nonce: data.campaign.nonce,
          created_at: data.campaign.created_at,
          updated_at: data.campaign.updated_at,
          max_total_sends: data.campaign.max_total_sends,
          max_sends_per_wallet: data.campaign.max_sends_per_wallet,
          daily_send_cap: data.campaign.daily_send_cap,
          total_sends: data.campaign.total_sends
        });
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading || !tokenLogin}
        style={{
          background: '#4F46E5',
          color: '#fff',
          padding: '10px 24px',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: loading || !tokenLogin ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 8px rgba(79,70,229,0.15)',
          transition: 'background 0.2s'
        }}
      >
        {loading ? 'Creating...' : 'Create New'}
      </button>
      {result && <div>Success: {JSON.stringify(result)}</div>}
      {error && <div>Error: {error.message || 'Unknown error'}</div>}
    </div>
  );
};
