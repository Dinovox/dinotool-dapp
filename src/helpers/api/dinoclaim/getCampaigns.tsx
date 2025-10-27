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
    <div className='mt-4 rounded-lg border border-gray-200 bg-white'>
      <table className='w-full text-sm'>
        <thead className='bg-gray-50 text-gray-600 text-xs uppercase'>
          <tr>
            <th className='px-4 py-2 text-left font-semibold'>Title</th>
            <th className='px-4 py-2 text-left font-semibold'>Status</th>
            <th className='px-4 py-2 text-left font-semibold'>Created</th>
            <th className='px-4 py-2 text-left font-semibold'>Max Sends</th>
            <th className='px-4 py-2 text-left font-semibold'>Per Wallet</th>
            <th className='px-4 py-2 text-right font-semibold'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {result?.campaigns?.length ? (
            result.campaigns.map((c: any) => (
              <tr
                key={c.id}
                className='border-t border-gray-100 hover:bg-gray-50 transition'
              >
                <td className='px-4 py-3 font-medium text-gray-900'>
                  {c.title || c.name || 'Untitled'}
                </td>
                <td className='px-4 py-3'>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      c.status === 'draft'
                        ? 'bg-gray-100 text-gray-700'
                        : c.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className='px-4 py-3 text-gray-700'>
                  {c.created_at
                    ? new Date(c.created_at).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '—'}
                </td>

                <td className='px-4 py-3 text-gray-700'>{c.max_total_sends}</td>
                <td className='px-4 py-3 text-gray-700'>
                  {c.max_sends_per_wallet}
                </td>
                <td className='px-4 py-3 text-right'>
                  <button
                    onClick={() =>
                      onEditCampaign?.({
                        id: c.id,
                        title: c.title || c.name || '',
                        status: c.status,
                        start_at: c.start_at,
                        end_at: c.end_at,
                        collection: c.collection,
                        nonce: c.nonce,
                        created_at: c.created_at,
                        updated_at: c.updated_at,
                        max_total_sends: c.max_total_sends,
                        max_sends_per_wallet: c.max_sends_per_wallet,
                        daily_send_cap: c.daily_send_cap,
                        total_sends: c.total_sends
                      })
                    }
                    className='inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100'
                  >
                    🛠 Manage
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={7}
                className='px-4 py-6 text-center text-gray-500 text-sm'
              >
                No campaigns found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
