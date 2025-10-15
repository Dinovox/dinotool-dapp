import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { dino_claim_url, dinoclaim_api } from 'config';
import { useGetLoginInfo, useGetNetworkConfig } from 'lib';
import { ReserveCodeButton } from 'helpers/api/dinoclaim/postCampaignCodes';
import { QRCode } from 'antd';
import { PrettyQRCardsPrintFold } from './ToQrCode';

interface Code {
  id: string;
  catalog_id: string;
  code: string;
  tx_hash: string | null;
  status: string;
  updated_at: string;
  claimed_at: string | null;
  showQr?: boolean;
}

const CodesList: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const { tokenLogin } = useGetLoginInfo();
  const authToken = tokenLogin?.nativeAuthToken ?? null;

  const { network } = useGetNetworkConfig();
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const codes_items = useMemo(() => {
    return codes.map((code) => ({
      code: code.code,
      amount: 1,
      styleParam: '',
      status: code.status
    }));
  }, [codes]);
  useEffect(() => {
    // Pas d’ID ou pas d’auth -> pas de fetch, et on sort proprement du loading
    if (!campaignId || !authToken || !loading) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    axios
      .get(`${dinoclaim_api}/campaigns/${campaignId}/codes`, {
        headers: { Authorization: `Bearer ${authToken}` },
        signal: controller.signal
      })
      .then((res) => {
        console.log('Fetched codes:', res.data);
        // Normalise la forme de la réponse
        const arr = Array.isArray(res.data)
          ? res.data
          : res.data?.codes ?? res.data?.items ?? [];
        setCodes(arr as Code[]);
        setError(null);
      })
      .catch((err) => {
        if (axios.isCancel(err) || err?.name === 'CanceledError') return;
        console.error('Fetch codes error:', err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Failed to fetch codes'
        );
        setCodes([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [campaignId, authToken, loading]); // <-- important : refetch quand le token arrive

  const hasCodes = codes && codes.length > 0;

  if (!authToken) return <div>Veuillez vous connecter…</div>;
  if (loading) return <div>Loading codes...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2 className='text-xl font-bold mb-2'>Codes </h2>
      <div className='mb-4'>
        <ReserveCodeButton campaignId={campaignId} />
        {/* Bouton manuel pour recharger si besoin */}
        <button
          className='ml-2 px-3 py-1 rounded border'
          onClick={() => {
            // force un refetch en modifiant une dep, ou relance l’effet en togglant un state si besoin
            // Ici on relance simplement en réassignant authToken via un setLoading cycle
            setLoading(true);
            // petite astuce: re-exécuter le même effet : change rien ici, mais tu peux aussi
            // extraire la fonction fetch dans un hook et l’appeler ici.
          }}
        >
          ↻ {codes.length > 0 ? 'Refresh' : 'Load'}
        </button>
      </div>
      {!hasCodes ? (
        <div>No codes available</div>
      ) : (
        <ul>
          <PrettyQRCardsPrintFold
            items={codes_items}
            claimBaseUrl={dino_claim_url}
            pageSize='A4'
            orientation='portrait'
            marginMm={7}
            gapMm={3}
          />
          {codes.map((code) => (
            <li key={code.id} className='py-1'>
              <div>
                <strong>{code.code}</strong> — <b>{code.status}</b>
                <button
                  className='ml-2 px-2 py-1 border rounded text-xs'
                  onClick={() =>
                    setCodes((prev) =>
                      prev.map((c) =>
                        c.id === code.id ? { ...c, showQr: !c.showQr } : c
                      )
                    )
                  }
                >
                  {code.showQr ? 'Hide QR' : 'Show QR'}
                </button>
                {code.showQr && (
                  <QRCode
                    value={`https://app.dinovox.com/claim/${code.code}`}
                    size={256}
                    style={{ marginLeft: 8, verticalAlign: 'middle' }}
                  />
                )}
                {code.tx_hash && (
                  <>
                    {' | '}
                    <strong>Tx:</strong>{' '}
                    <a
                      href={`${network.explorerAddress}/transactions/${code.tx_hash}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 underline'
                    >
                      {code.tx_hash}
                    </a>
                  </>
                )}
                {/* {' | '} */}
                {/* <strong>Updated:</strong>{' '}
                {new Date(code.updated_at).toLocaleString()}
                {code.claimed_at && (
                  <>
                    {' | '}
                    <strong>Claimed:</strong>{' '}
                    {new Date(code.claimed_at).toLocaleString()}
                  </>
                )} */}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CodesList;
