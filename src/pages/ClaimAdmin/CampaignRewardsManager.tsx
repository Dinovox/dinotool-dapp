import React from 'react';
import axios from 'axios';
import { dinoclaim_api } from 'config';
import { useGetLoginInfo } from 'lib';
import { Tooltip } from 'components/Tooltip';
import { axios_claim, extractProblem } from 'helpers/api/accounts/axios';
type Reward = {
  id: string;
  campaign_id: string;
  collection: string;
  nonce: number;
  amount_per_claim: string; // string entier
  supply_total: string; // string entier
  supply_reserved?: string;
  supply_claimed?: number;
  active: boolean;
};

type RewardsEvent =
  | { type: 'loaded'; list: Reward[] }
  | { type: 'created'; reward: Reward; list: Reward[] }
  | { type: 'updated'; reward: Reward; list: Reward[] }
  | { type: 'deleted'; id: string; list: Reward[] }
  | { type: 'dirty-change'; dirtyIds: string[] }
  | { type: 'error'; message: string };

const EDIT_FIELDS: Array<keyof Reward> = [
  'collection',
  'nonce',
  'amount_per_claim',
  'supply_total',
  'active'
];

function pickEditable(r: Reward) {
  return {
    collection: (r.collection ?? '').trim(),
    nonce: Number(r.nonce ?? 0),
    amount_per_claim: String(r.amount_per_claim ?? '0'),
    supply_total: String(r.supply_total ?? '0'),
    active: Boolean(r.active)
  };
}
const sameEditState = (a: any, b: any) =>
  JSON.stringify(a) === JSON.stringify(b);

export const CampaignRewardsManager: React.FC<{
  campaignId: string;
  onEvent?: (e: RewardsEvent) => void;

  // alias optionnels (sucre syntaxique)
  onLoaded?: (list: Reward[]) => void;
  onCreated?: (r: Reward, list: Reward[]) => void;
  onUpdated?: (r: Reward, list: Reward[]) => void;
  onDeleted?: (id: string, list: Reward[]) => void;
  onDirtyChange?: (dirtyIds: string[]) => void;
}> = ({
  campaignId,
  onEvent,
  onLoaded,
  onCreated,
  onUpdated,
  onDeleted,
  onDirtyChange
}) => {
  const { tokenLogin } = useGetLoginInfo();

  const [loading, setLoading] = React.useState(true);
  const [list, setList] = React.useState<Reward[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [savingRow, setSavingRow] = React.useState<string | null>(null);
  const [deletingRow, setDeletingRow] = React.useState<string | null>(null);
  // normalise juste en trim; garde la casse (les ids MultiversX sont sensibles)
  const normCollection = (s?: string) => (s ?? '').trim();

  const isDuplicatePair = (
    collection: string | undefined,
    nonce: number | string | undefined,
    ignoreId?: string
  ) => {
    const col = normCollection(collection);
    const nn = Number(nonce ?? 0);
    return list.some(
      (r) =>
        r.id !== ignoreId &&
        normCollection(r.collection) === col &&
        Number(r.nonce) === nn
    );
  };
  // Ligne d’ajout
  const [showNew, setShowNew] = React.useState(false);
  const [newRow, setNewRow] = React.useState<Partial<Reward>>({
    collection: '',
    nonce: 0,
    amount_per_claim: '1',
    supply_total: '1',
    active: true
  });

  // Snapshot “original” des lignes (pour comparer)
  const originalMapRef = React.useRef<Map<string, any>>(new Map());
  // Set des lignes dirty
  const [dirty, setDirty] = React.useState<Set<string>>(new Set());

  const authHeader = React.useMemo(
    () =>
      tokenLogin?.nativeAuthToken
        ? { Authorization: `Bearer ${tokenLogin.nativeAuthToken}` }
        : undefined,
    [tokenLogin]
  );

  const seedOriginalMap = React.useCallback((rows: Reward[]) => {
    const m = new Map<string, any>();
    rows.forEach((r) => m.set(r.id, pickEditable(r)));
    originalMapRef.current = m;
    setDirty(new Set()); // reset dirty flags
    //and
    // setDirty((prev) => {
    //   const next = new Set(prev);
    //   // ... ta logique existante ...
    //   const ids = Array.from(next);
    //   onEvent?.({ type: 'dirty-change', dirtyIds: ids });
    //   onDirtyChange?.(ids);
    //   return next;
    // });
  }, []);

  const fetchList = React.useCallback(async () => {
    if (!authHeader) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(
        `${dinoclaim_api}/campaigns/${campaignId}/campaign_rewards`,
        { headers: authHeader }
      );
      const rows: Reward[] = Array.isArray(data) ? data : data?.rewards ?? [];
      setList(rows);
      seedOriginalMap(rows);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || 'Failed to load rewards'
      );
    } finally {
      setLoading(false);
    }
  }, [campaignId, authHeader, seedOriginalMap]);

  React.useEffect(() => {
    if (authHeader) fetchList();
  }, [authHeader, fetchList]);

  // helpers
  const onFieldChange = (id: string, field: keyof Reward, value: any) => {
    // 1) update UI
    setList((prev) =>
      prev.map((r) => (r.id === id ? ({ ...r, [field]: value } as Reward) : r))
    );
    // 2) recompute "dirty" for this row
    setDirty((prev) => {
      const next = new Set(prev);
      const current = list.find((r) => r.id === id);
      const edited = current
        ? ({ ...current, [field]: value } as Reward)
        : undefined;
      if (!edited) return next;
      const base = originalMapRef.current.get(id);
      const now = pickEditable(edited);
      if (sameEditState(now, base)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onAddFieldChange = (field: keyof Reward, value: any) => {
    setNewRow((prev) => ({ ...prev, [field]: value }) as Partial<Reward>);
  };

  const validateRow = (row: Partial<Reward>, ignoreId?: string) => {
    if (!row.collection?.trim()) return 'Collection is required';
    if (row.collection?.trim() === 'EGLD-000000')
      return 'Collection cannot be "EGLD-000000"';
    if (
      row.nonce == null ||
      Number.isNaN(Number(row.nonce)) ||
      Number(row.nonce) < 0
    ) {
      return 'Nonce must be a number ≥ 0';
    }
    if (!row.amount_per_claim || !/^\d+$/.test(String(row.amount_per_claim))) {
      return 'Amount must be an integer string (e.g. "1")';
    }
    if (
      row.supply_total === null ||
      row.supply_total === undefined ||
      !/^\d+$/.test(String(row.supply_total))
    ) {
      return 'Supply must be an integer string (e.g. "100")';
    }
    if (isDuplicatePair(row.collection, row.nonce, ignoreId)) {
      return 'This (collection, nonce) already exists in this campaign';
    }
    return null;
  };

  const handleCreate = async () => {
    if (!authHeader) return;
    const err = validateRow(newRow /* ignoreId undefined pour create */);
    if (err) return setError(err);

    setError(null);
    try {
      const payload = {
        collection: newRow.collection!.trim(),
        nonce: Number(newRow.nonce),
        amount_per_claim: Number(newRow.amount_per_claim),
        supply_total: Number(newRow.supply_total),
        active: Boolean(newRow.active)
      };

      const { data } = await axios.post(
        `${dinoclaim_api}/campaigns/${campaignId}/campaign_rewards`,
        payload,
        { headers: authHeader }
      );

      const created: Reward = data?.reward ?? data;
      if (created?.id) {
        setList((prev) => {
          const newList = [created, ...prev];
          onEvent?.({ type: 'created', reward: created, list: newList });
          onCreated?.(created, newList);
          return newList;
        });
        originalMapRef.current.set(created.id, pickEditable(created));
      } else {
        await fetchList();
      }

      setNewRow({
        collection: '',
        nonce: 0,
        amount_per_claim: '1',
        supply_total: '0',
        active: true
      });
      setShowNew(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Create failed');
    }
  };

  const handleSave = async (row: Reward) => {
    if (!authHeader) return;

    const err = validateRow(row, row.id);
    if (err) return setError(err);

    setSavingRow(row.id);
    setError(null);
    try {
      const payload = {
        collection: row.collection.trim(),
        nonce: Number(row.nonce),
        amount_per_claim: String(row.amount_per_claim),
        supply_total: String(row.supply_total),
        active: Boolean(row.active)
      };

      // const { data } = await axios.put(
      //   `${dinoclaim_api}/campaigns/${campaignId}/campaign_rewards/${row.id}`,
      //   payload,
      //   { headers: authHeader }
      // );

      //no try-catch: on error setError and return
      const res = await axios_claim.put(
        `${dinoclaim_api}/campaigns/${campaignId}/campaign_rewards/${row.id}`,
        payload,
        { headers: authHeader }
      );
      if (res.status >= 400) {
        setError(extractProblem(res.data));
        setDeletingRow(null);
        return;
      }

      const updated: Reward = res.data?.reward ?? res.data;

      // update list, baseline and dirty set if ok inform parent
      if (updated?.id) {
        setList((prev) => {
          const newList = prev.map((r) =>
            r.id === row.id ? { ...r, ...updated } : r
          );
          onEvent?.({ type: 'updated', reward: updated, list: newList });
          onUpdated?.(updated, newList);
          return newList;
        });
        originalMapRef.current.set(updated.id, pickEditable(updated));
        setDirty((prev) => {
          const next = new Set(prev);
          next.delete(updated.id);
          const ids = Array.from(next);
          onEvent?.({ type: 'dirty-change', dirtyIds: ids });
          onDirtyChange?.(ids);
          return next;
        });
      } else {
        await fetchList();
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Update failed');
    } finally {
      setSavingRow(null);
    }
  };

  const handleDelete = async (row: Reward) => {
    if (!authHeader) return;
    if (!confirm('Delete this reward? This cannot be undone.')) return;

    setDeletingRow(row.id);
    setError(null);

    //no try-catch: on error setError and return
    const res = await axios_claim.delete(
      `/campaigns/${campaignId}/campaign_rewards/${row.id}`,
      { headers: authHeader }
    );
    if (res.status >= 400) {
      setError(extractProblem(res.data));
      setDeletingRow(null);
      return;
    }

    // Succès (2xx)
    setList((prev) => {
      const newList = prev.filter((r) => r.id !== row.id);
      onEvent?.({ type: 'deleted', id: row.id, list: newList });
      onDeleted?.(row.id, newList);
      return newList;
    });
    originalMapRef.current.delete(row.id);
    setDirty((prev) => {
      const next = new Set(prev);
      next.delete(row.id);
      const ids = Array.from(next);
      onEvent?.({ type: 'dirty-change', dirtyIds: ids });
      onDirtyChange?.(ids);
      return next;
    });

    setDeletingRow(null);
  };

  if (!authHeader) return <div>Authentication required.</div>;

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>
          Rewards{' '}
          <Tooltip content='Si plusieurs lignes, la récompense sera sélectionnée aléatoirement au sein de la campagne au moment de l’utilisation d’un code'>
            <span className='ml-2 cursor-pointer'>ℹ️</span>
          </Tooltip>
        </h3>
        {!showNew && (
          <button
            className='px-3 py-1.5 rounded bg-[#4b4bb7] text-white'
            onClick={() => setShowNew(true)}
          >
            + New reward
          </button>
        )}
      </div>

      {error && <div className='text-sm text-red-600'>{error}</div>}

      <div className='rounded-md border overflow-hidden'>
        <div className='overflow-x-auto'>
          {' '}
          {/* <-- NEW */}
          <table className='w-full text-sm min-w-[920px]'>
            {' '}
            {/* <-- NEW min-w */}
            <colgroup>
              <col style={{ width: '28%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead className='bg-gray-50'>
              <tr className='text-left'>
                <th className='px-3 py-2'>Collection</th>
                <th className='px-3 py-2'>Nonce</th>
                <th className='px-3 py-2'>
                  {' '}
                  Amount / claim
                  <Tooltip content='Number of SFTs/tokens given to the user when they claim with a code'>
                    <span className='ml-2 cursor-pointer'>ℹ️</span>
                  </Tooltip>
                </th>
                <th className='px-3 py-2'>
                  Supply
                  <Tooltip content='Number of codes that can be claimed with this reward'>
                    <span className='ml-2 cursor-pointer'>ℹ️</span>
                  </Tooltip>
                </th>
                <th className='px-3 py-2'>Reserved</th>
                <th className='px-3 py-2'>Claimed</th>
                <th className='px-3 py-2'>Active</th>
                <th className='px-3 py-2 text-right'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* New row */}
              {showNew && (
                <tr className='bg-white/70'>
                  <td className='px-3 py-2'>
                    <input
                      className='spec-input-code w-full'
                      type='text'
                      placeholder='Collection (ex: DYNASFT-d4f18f)'
                      value={newRow.collection ?? ''}
                      onChange={(e) =>
                        onAddFieldChange('collection', e.target.value)
                      }
                    />
                  </td>
                  <td className='px-3 py-2'>
                    <input
                      className='spec-input-code w-full'
                      type='number'
                      min={0}
                      inputMode='numeric'
                      onWheel={(e) =>
                        (e.currentTarget as HTMLInputElement).blur()
                      }
                      value={newRow.nonce ?? 0}
                      onChange={(e) =>
                        onAddFieldChange('nonce', Number(e.target.value))
                      }
                    />
                  </td>
                  <td className='px-3 py-2'>
                    <input
                      className='spec-input-code w-full'
                      type='text'
                      placeholder='e.g. "1"'
                      value={newRow.amount_per_claim ?? '1'}
                      onChange={(e) =>
                        onAddFieldChange('amount_per_claim', e.target.value)
                      }
                    />
                  </td>
                  <td className='px-3 py-2'>
                    <input
                      className='spec-input-code w-full'
                      type='text'
                      placeholder='e.g. "100"'
                      value={newRow.supply_total ?? '0'}
                      onChange={(e) =>
                        onAddFieldChange('supply_total', e.target.value)
                      }
                    />
                  </td>
                  <td className='px-3 py-2 text-gray-500'>—</td>
                  <td className='px-3 py-2 text-gray-500'>—</td>
                  <td className='px-3 py-2'>
                    <input
                      type='checkbox'
                      checked={Boolean(newRow.active)}
                      onChange={(e) =>
                        onAddFieldChange('active', e.target.checked)
                      }
                    />
                  </td>
                  <td className='px-3 py-2 text-right'>
                    <div className='flex gap-2 justify-end'>
                      <button
                        onClick={handleCreate}
                        className='px-3 py-1.5 rounded bg-[#4b4bb7] text-white'
                        disabled={!!validateRow(newRow)}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowNew(false);
                          setNewRow({
                            collection: '',
                            nonce: 0,
                            amount_per_claim: '1',
                            supply_total: '1',
                            active: true
                          });
                        }}
                        className='px-3 py-1.5 rounded border'
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Existing rows */}
              {loading ? (
                <tr>
                  <td className='px-3 py-3 text-gray-600' colSpan={8}>
                    Loading rewards…
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td className='px-3 py-3 text-gray-500' colSpan={8}>
                    No rewards yet.
                  </td>
                </tr>
              ) : (
                list.map((r) => {
                  const isDirty = dirty.has(r.id);
                  const rowError = validateRow(r, r.id);
                  const canSave = isDirty && !rowError;
                  return (
                    <tr key={r.id} className='border-t'>
                      <td className='px-3 py-2'>
                        <input
                          className='spec-input-code w-full'
                          type='text'
                          value={r.collection}
                          onChange={(e) =>
                            onFieldChange(r.id, 'collection', e.target.value)
                          }
                          disabled={(r.supply_claimed ?? 0) > 0}
                        />
                      </td>
                      <td className='px-3 py-2'>
                        <input
                          className='spec-input-code w-full'
                          type='number'
                          min={0}
                          inputMode='numeric'
                          onWheel={(e) =>
                            (e.currentTarget as HTMLInputElement).blur()
                          }
                          value={r.nonce}
                          onChange={(e) =>
                            onFieldChange(r.id, 'nonce', Number(e.target.value))
                          }
                          disabled={(r.supply_claimed ?? 0) > 0}
                        />
                      </td>
                      <td className='px-3 py-2'>
                        <input
                          className='spec-input-code w-full'
                          type='text'
                          value={r.amount_per_claim}
                          onChange={(e) =>
                            onFieldChange(
                              r.id,
                              'amount_per_claim',
                              e.target.value
                            )
                          }
                          disabled={(r.supply_claimed ?? 0) > 0}
                        />
                      </td>
                      <td className='px-3 py-2'>
                        <input
                          className='spec-input-code w-full'
                          type='text'
                          value={r.supply_total}
                          onChange={(e) =>
                            onFieldChange(r.id, 'supply_total', e.target.value)
                          }
                        />
                      </td>
                      <td className='px-3 py-2 text-gray-700'>
                        {r.supply_reserved ?? '-'}
                      </td>
                      <td className='px-3 py-2 text-gray-700'>
                        {r.supply_claimed ?? '-'}
                      </td>
                      <td className='px-3 py-2'>
                        <input
                          type='checkbox'
                          checked={Boolean(r.active)}
                          onChange={(e) =>
                            onFieldChange(r.id, 'active', e.target.checked)
                          }
                        />
                      </td>
                      <td className='px-3 py-2 text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          {rowError?.includes('already exists') ? (
                            <div className='text-xs text-red-600 mt-1'>
                              Duplicate pair
                            </div>
                          ) : (
                            <>
                              {' '}
                              {isDirty && (
                                <>
                                  {' '}
                                  <span className='text-xs text-amber-600 flex items-center gap-1'>
                                    <span style={{ fontSize: 10 }}>●</span>{' '}
                                    Unsaved
                                  </span>
                                  <button
                                    className='px-3 py-1 rounded border disabled:opacity-50'
                                    disabled={savingRow === r.id || !canSave}
                                    onClick={() => handleSave(r)}
                                    title={rowError || undefined}
                                  >
                                    {savingRow === r.id ? 'Saving…' : 'Save'}
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          <button
                            className='px-3 py-1 rounded border border-red-500 text-red-600'
                            disabled={deletingRow === r.id}
                            onClick={() => handleDelete(r)}
                          >
                            {deletingRow === r.id ? 'Delete…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>{' '}
        {/* <-- NEW */}
      </div>
    </div>
  );
};
