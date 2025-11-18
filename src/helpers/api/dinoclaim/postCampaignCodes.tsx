import React, { useState } from 'react';
import axios from 'axios';
import { dinoclaim_api } from 'config';
import { useGetLoginInfo } from 'lib';

interface Props {
  campaignId: string;
}

export const ReserveCodeButton: React.FC<
  Props & { onDone?: (result?: any, error?: any) => void }
> = ({ campaignId, onDone }) => {
  const { tokenLogin } = useGetLoginInfo();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const [showModal, setShowModal] = useState(false);
  const [qtyState, setQty] = useState(1);
  const [usesState, setUses] = useState(1);
  const [formCode, setFormCode] = useState('');

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
        `${dinoclaim_api}/campaigns/${campaignId}/codes`,
        {
          qty: qtyState,
          uses: usesState,
          prefix: '', // optionnel
          formCode: formCode ? formCode : undefined
        },
        config
      );
      setResult(data);
      onDone?.(data, null);
    } catch (err: any) {
      setError(err);
      onDone?.(null, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        className='px-4 py-2 rounded bg-[#4b4bb7] text-white disabled:opacity-50'
        onClick={() => setShowModal(true)}
        disabled={loading || !tokenLogin}
      >
        Generate codes
      </button>
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minWidth: 300,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <h4>Generate Codes to claim rewards</h4>
            <div style={{ marginBottom: 12 }}>
              <label>
                Number of codes:&nbsp;
                <input
                  type='number'
                  min={1}
                  value={qtyState}
                  onChange={(e) => {
                    setQty(Number(e.target.value));
                    setFormCode('');
                  }}
                  style={{ width: 60 }}
                />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                Max uses per code:&nbsp;
                <input
                  type='number'
                  min={1}
                  value={usesState}
                  onChange={(e) => {
                    setUses(Number(e.target.value));
                  }}
                  style={{ width: 60 }}
                />
              </label>
            </div>
            {/* Code manuel seulement pour un code unique: */}
            {qtyState === 1 && (
              <div style={{ marginBottom: 12 }}>
                <label>
                  Code (optionnal)&nbsp;
                  <input
                    type='text'
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder='Manual code'
                    style={{ width: 200 }}
                  />
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className='px-4 py-2 rounded bg-[#4b4bb7] text-white disabled:opacity-50'
                onClick={async () => {
                  setShowModal(false);
                  await handleClick();
                }}
                disabled={loading}
              >
                {loading ? 'Reserving...' : 'Confirm'}
              </button>
              <button
                className='px-4 py-2 rounded border disabled:opacity-50'
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {loading && 'Generating...'}
      {result?.codes?.totalCatalogCreated && (
        <div>Created: {result.codes.totalCatalogCreated}</div>
      )}
      {error && <div>Error: {error.message || 'Unknown error'}</div>}
    </div>
  );
};
