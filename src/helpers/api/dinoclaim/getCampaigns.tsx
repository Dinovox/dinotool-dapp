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
export const GetCampaigns: React.FC<{
  onEditCampaign?: (editedCampaign: CampaignPreview) => void;
}> = ({ onEditCampaign }) => {
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
      const { data } = await axios.get(dinoclaim_api + '/campaigns', config);
      console.log('Fetched campaigns:', data);
      setResult(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (tokenLogin) {
      handleClick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenLogin]);
  return (
    <div>
      {result && Array.isArray(result) && (
        <ul>
          {result.map((campaign: any) => (
            <li key={campaign.id || campaign._id}>
              {campaign.name || JSON.stringify(campaign)}
            </li>
          ))}
        </ul>
      )}
      {result && !Array.isArray(result) && (
        <div>
          {result.campaigns && Array.isArray(result.campaigns) && (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {result.campaigns.map((campaign: any) => (
                <li
                  key={campaign.id || campaign._id}
                  style={{
                    margin: '16px 0',
                    padding: '16px',
                    borderRadius: '12px',
                    background: '#f9f9fc',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '1.1em',
                        marginBottom: 4
                      }}
                    >
                      {campaign.title ||
                        campaign.name ||
                        `Campaign ${campaign.id || campaign._id}`}
                    </div>
                    <div style={{ fontSize: '0.95em', color: '#555' }}>
                      <div>
                        Status: <b>{campaign.status}</b>
                      </div>
                      <div>
                        Created:
                        {campaign.created_at
                          ? new Date(campaign.created_at).toLocaleString(
                              undefined,
                              {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              }
                            )
                          : ''}
                      </div>
                      <div>Collection: {campaign.collection}</div>
                      <div>Max Total Sends: {campaign.max_total_sends}</div>
                      <div>
                        Max Sends Per Wallet: {campaign.max_sends_per_wallet}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      marginLeft: 16
                    }}
                  >
                    <button
                      style={{
                        background: '#fff',
                        border: '1px solid #a3a3e6',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        color: '#4b4bb7',
                        cursor: 'pointer',
                        fontWeight: 500,
                        marginTop: 8
                      }}
                      onClick={() =>
                        onEditCampaign &&
                        onEditCampaign({
                          id: campaign.id || campaign._id,
                          title: campaign.title || campaign.name || '',
                          status: campaign.status,
                          start_at: campaign.start_at,
                          end_at: campaign.end_at,
                          collection: campaign.collection,
                          nonce: campaign.nonce,
                          created_at: campaign.created_at,
                          updated_at: campaign.updated_at,
                          max_total_sends: campaign.max_total_sends,
                          max_sends_per_wallet: campaign.max_sends_per_wallet,
                          daily_send_cap: campaign.daily_send_cap,
                          total_sends: campaign.total_sends
                        })
                      }
                    >
                      🛠️ Manage
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error && <div>Error: {error.message || 'Unknown error'}</div>}
    </div>
  );
};
