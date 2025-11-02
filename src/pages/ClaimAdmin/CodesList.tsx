import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { dino_claim_url, dinoclaim_api } from 'config';
import { useGetLoginInfo, useGetNetworkConfig } from 'lib';
import { ReserveCodeButton } from 'helpers/api/dinoclaim/postCampaignCodes';
import { QRCode } from 'antd';
import { PrettyQRCardsPrintFold } from './ToQrCode';
import shortenString from 'helpers/ShortenString';
import TextCopy from 'helpers/textCopy';

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
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // state du filtre
  const [statusFilter, setStatusFilter] = React.useState<'all' | string>('all');

  // valeurs uniques de statut (ex: ["open", "pending"])
  const statusValues = React.useMemo(() => {
    const set = new Set<string>();
    for (const c of codes) if (c.status) set.add(c.status);
    return Array.from(set).sort(); // tri alpha
  }, [codes]);

  // petits compteurs par statut (pour afficher "open (12)" etc.)
  const statusCounts = React.useMemo(() => {
    return codes.reduce(
      (acc, c) => {
        const k = c.status ?? 'unknown';
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [codes]);

  // jeux filtrés pour le tableau
  const filteredCodes = React.useMemo(() => {
    if (statusFilter === 'all') return codes;
    return codes.filter((c) => c.status === statusFilter);
  }, [codes, statusFilter]);

  const codes_items = useMemo(() => {
    return filteredCodes.map((code) => ({
      code: code.code,
      amount: 1,
      styleParam: '',
      status: code.status
    }));
  }, [filteredCodes]);

  useEffect(() => {
    // Pas d’ID ou pas d’auth -> pas de fetch, et on sort proprement du loading

    //On ne veut pas fetch à l'ouverture. mais on veut un message clair

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
        setLoaded(true);

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

  function fallbackCopy(text: string) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      // optionnel: petit feedback
      // toast.success('Copied!');
    } catch {
      fallbackCopy(text);
    }
  }

  function buildTableText(
    items: typeof codes,
    opts?: { delimiter?: 'tab' | 'semicolon' | 'comma'; withHeader?: boolean }
  ) {
    const delimiter =
      opts?.delimiter === 'semicolon'
        ? ';'
        : opts?.delimiter === 'comma'
        ? ','
        : '\t'; // défaut: tab
    const header = ['code', 'status', 'link', 'tx'];

    const rows = items.map((c) => [
      c.code ?? '',
      c.status ?? '',
      `${dino_claim_url}/${c.code}`,
      c.tx_hash ?? ''
    ]);

    const lines = [
      ...(opts?.withHeader === false ? [] : [header.join(delimiter)]),
      ...rows.map((r) => r.join(delimiter))
    ];

    return lines.join('\n');
  }

  function handleCopyAll() {
    const text = buildTableText(filteredCodes, {
      delimiter: 'tab',
      withHeader: true
    });
    copyToClipboard(text);
  }

  return (
    <div>
      <h2 className='text-xl font-bold mb-2'>Codes </h2>
      <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900 mb-4'>
        <h3 className='font-semibold text-yellow-800 mb-1 flex items-center gap-2'>
          🎟️ Code generation
        </h3>
        <p className='leading-relaxed'>
          Each code allows a user to claim <strong>one random reward</strong>{' '}
          from this campaign.
          <br />
          You can generate:
        </p>
        <ul className='list-disc list-inside mt-2 space-y-1'>
          <li>
            <strong>Single-use codes</strong> — each code can be used once to
            redeem a reward.
          </li>
          <li>
            <strong>Multi-use codes</strong> — allow multiple users to claim
            using the same code.
          </li>
        </ul>
        <p className='mt-3 italic text-yellow-800/90'>
          Use <strong>“Generate codes”</strong> below to create new claim codes.
          They can be scanned via QR or copied directly for distribution.
        </p>
      </div>
      <div className='mb-4'>
        <ReserveCodeButton campaignId={campaignId} />
        {/* Bouton manuel pour recharger si besoin */}
      </div>
      {!hasCodes ? (
        <div>
          {!loaded ? 'Display codes' : 'No codes available'}{' '}
          <button
            className='ml-2 px-3 py-1 rounded border'
            onClick={() => {
              setLoading(true);
            }}
          >
            ↻ {codes.length > 0 ? 'Refresh' : 'Load'}
          </button>
        </div>
      ) : (
        <>
          <div className='mb-4 flex items-center gap-2'>
            <div className='text-sm text-gray-600'>
              Total: <strong>{codes.length}</strong>
              {statusCounts && (
                <span className='ml-3'>
                  • open: {statusCounts['open'] ?? 0}
                </span>
              )}
            </div>
          </div>{' '}
          {/* Toolbar */}
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            <div className='mb-3 flex items-center gap-2'>
              <label className='text-sm text-gray-600'>
                Filtrer par statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='h-9 rounded-md border px-3 text-sm bg-white'
              >
                <option value='all'>Tous ({codes.length})</option>
                {statusValues.map((s) => (
                  <option key={s} value={s}>
                    {s} ({statusCounts[s] ?? 0})
                  </option>
                ))}
              </select>

              {statusFilter !== 'all' && (
                <button
                  type='button'
                  onClick={() => setStatusFilter('all')}
                  className='rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50'
                  title='Réinitialiser le filtre'
                >
                  Réinitialiser
                </button>
              )}
              <button
                type='button'
                onClick={() => handleCopyAll()}
                className='rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50'
              >
                Copy all to clipboard
              </button>
              <button
                type='button'
                onClick={() => {
                  const csv = buildTableText(filteredCodes, {
                    delimiter: 'comma',
                    withHeader: true
                  });
                  const blob = new Blob([csv], {
                    type: 'text/csv;charset=utf-8;'
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `codes_${campaignId || 'export'}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
                className='rounded border px-3 py-1.5 text-sm hover:bg-gray-50'
              >
                Export CSV
              </button>
              <button
                type='button'
                onClick={() => {
                  setLoading(true);
                }}
                className='rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50'
              >
                Refresh
              </button>
            </div>
          </div>
          <div className='overflow-x-auto rounded-xl border'>
            <table className='min-w-full divide-y'>
              <thead className='bg-gray-50'>
                <tr className='text-left text-sm font-semibold text-gray-700'>
                  <th className='px-3 py-2'>Code</th>
                  <th className='px-3 py-2'>Statut</th>
                  <th className='px-3 py-2'>QR</th>
                  <th className='px-3 py-2'>Tx</th>
                  <th className='px-3 py-2 w-0'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {filteredCodes.map((code) => (
                  <tr key={code.id} className='text-sm'>
                    {/* Code */}
                    <td className='px-3 py-2 font-mono'>
                      <TextCopy text={code.code} />

                      <div className='mt-2'>
                        <TextCopy
                          text={`Copy link`}
                          copy={`${dino_claim_url}/${code.code}`}
                        />
                      </div>
                    </td>

                    {/* Statut */}
                    <td className='px-3 py-2'>
                      <span
                        className={[
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                          code.status === 'open'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : code.status === 'pending'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-gray-200 bg-gray-50 text-gray-700'
                        ].join(' ')}
                      >
                        {code.status}
                      </span>
                      {code.status == 'reserved' && (
                        <>
                          <>
                            <div className='mt-1'>
                              <button
                                className='rounded border px-2 py-1 text-xs hover:bg-gray-50'
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      'Force consume this reserved code?'
                                    )
                                  )
                                    return;
                                  try {
                                    await axios.post(
                                      `${dinoclaim_api}/campaigns/${campaignId}/codes/${code.id}/consume`,
                                      {},
                                      {
                                        headers: {
                                          Authorization: `Bearer ${authToken}`
                                        }
                                      }
                                    );
                                    setCodes((prev) =>
                                      prev.map((c) =>
                                        c.id === code.id
                                          ? {
                                              ...c,
                                              status: 'consumed',
                                              claimed_at:
                                                new Date().toISOString()
                                            }
                                          : c
                                      )
                                    );
                                  } catch (err: any) {
                                    console.error('Consume code error:', err);
                                    alert(
                                      err?.response?.data?.message ||
                                        err?.message ||
                                        'Failed to consume code'
                                    );
                                  }
                                }}
                              >
                                Mark consumed
                              </button>
                            </div>
                          </>
                        </>
                      )}
                    </td>

                    {/* QR */}
                    <td className='px-3 py-2'>
                      <div className='flex items-center gap-2'>
                        <button
                          className='rounded border px-2 py-1 text-xs hover:bg-gray-50'
                          onClick={() =>
                            setCodes((prev) =>
                              prev.map((c) =>
                                c.id === code.id
                                  ? { ...c, showQr: !c.showQr }
                                  : c
                              )
                            )
                          }
                        >
                          {code.showQr ? 'Hide QR' : 'Show QR'}
                        </button>
                      </div>

                      {code.showQr && (
                        <div className='mt-2'>
                          <QRCode
                            value={`${dino_claim_url}/${code.code}`}
                            size={128}
                            style={{ marginLeft: 8, verticalAlign: 'middle' }}
                          />
                        </div>
                      )}
                    </td>

                    {/* Tx */}
                    <td className='px-3 py-2'>
                      {code.tx_hash ? (
                        <a
                          href={`${network.explorerAddress}/transactions/${code.tx_hash}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-600 underline break-all'
                          title={code.tx_hash}
                        >
                          {shortenString(code.tx_hash, 4)}
                        </a>
                      ) : (
                        <span className='text-gray-400'>—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className='px-3 py-2'>
                      <div className='flex items-center gap-2'>
                        {' '}
                        {code.status == 'open' && (
                          <div className='mt-1'>
                            <button
                              className='rounded border px-2 py-1 text-xs hover:bg-gray-50'
                              onClick={async () => {
                                if (
                                  !confirm(
                                    'Delete this code? (cannot be undone)'
                                  )
                                )
                                  return;
                                try {
                                  await axios.delete(
                                    `${dinoclaim_api}/campaigns/${campaignId}/codes/${code.id}`,
                                    {
                                      headers: {
                                        Authorization: `Bearer ${authToken}`
                                      }
                                    }
                                  );
                                  // 🧹 Supprime la ligne au lieu de la mettre à jour
                                  setCodes((prev) =>
                                    prev.filter((c) => c.id !== code.id)
                                  );
                                } catch (err: any) {
                                  console.error('Delete code error:', err);
                                  alert(
                                    err?.response?.data?.message ||
                                      err?.message ||
                                      'Failed to delete code'
                                  );
                                }
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        {code.status != 'copied' ? (
                          <div className='mt-1'>
                            <button
                              className='rounded border px-2 py-1 text-xs hover:bg-gray-50'
                              onClick={async () => {
                                const qtyStr = prompt(
                                  'How many copies do you want to create?',
                                  '1'
                                );
                                if (!qtyStr) return; // cancel
                                const qty = parseInt(qtyStr, 10);
                                if (isNaN(qty) || qty <= 0) {
                                  alert('Please enter a valid number');
                                  return;
                                }

                                try {
                                  const res = await axios.post(
                                    `${dinoclaim_api}/campaigns/${campaignId}/codes/${code.id}/copy`,
                                    { qty },
                                    {
                                      headers: {
                                        Authorization: `Bearer ${authToken}`
                                      }
                                    }
                                  );
                                  for (
                                    let i = 0;
                                    i < res.data.codes.totalInstancesCreated;
                                    i++
                                  ) {
                                    setCodes((prev) =>
                                      prev.concat({
                                        code: code.code,
                                        status: 'copied'
                                      } as Code)
                                    );
                                  }
                                } catch (err: any) {
                                  console.error('Copy code error:', err);
                                  alert(
                                    err?.response?.data?.message ||
                                      err?.message ||
                                      'Failed to copy code'
                                  );
                                }
                              }}
                            >
                              Duplicate
                            </button>
                          </div>
                        ) : (
                          <button
                            type='button'
                            onClick={() => {
                              setLoading(true);
                            }}
                            className='rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50'
                          >
                            Refresh
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PrettyQRCardsPrintFold
              items={codes_items}
              claimBaseUrl={dino_claim_url}
              pageSize='A4'
              orientation='portrait'
              marginMm={7}
              gapMm={3}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CodesList;
