import axios from 'axios';
import BigNumber from 'bignumber.js';
import { Tooltip } from 'components/Tooltip';
import { dinoclaim_api } from 'config';
import { axios_claim, extractProblem } from 'helpers/api/accounts/axios';
import {
  buildExplorerLinks,
  buildTokenIdentifier,
  parseTokenIdentifier
} from 'helpers/parseToken';
import shortenString from 'helpers/ShortenString';
import { getTokenDecimals } from 'helpers/useTokenDecimals';
import { useGetLoginInfo, useGetNetworkConfig } from 'lib';
import React from 'react';
type Reward = {
  id: string;
  campaign_id: string;
  identifier: string;
  collection: string;
  nonce: number;
  amount_per_claim: string; // string entier
  decimals: number | null;
  supply_total: number;
  supply_reserved?: number;
  supply_claimed?: number;
  active: boolean;
  balance_available?: string;
  balance_required?: string;
  balance_missing?: string;
  balance_tx_hash?: string;
};

type RewardsEvent =
  | { type: 'loaded'; list: Reward[] }
  | { type: 'created'; reward: Reward; list: Reward[] }
  | { type: 'updated'; reward: Reward; list: Reward[] }
  | { type: 'deleted'; id: string; list: Reward[] }
  | { type: 'dirty-change'; dirtyIds: string[] }
  | { type: 'error'; message: string }
  | { type: 'cancel'; reward: Reward; list: Reward[] };

// extrait les champs éditables d’une Reward pour comparaison
async function pickEditable(r: Reward) {
  let decimals: number | null = r.decimals != null ? Number(r.decimals) : null;

  // if (!r.nonce || r.nonce === 0) {
  //   const fetched = await getTokenDecimals(r.collection);
  //   if (fetched != null) decimals = fetched;
  // }
  return {
    identifier: (r.identifier ?? '').trim(),
    collection: (r.collection ?? '').trim(),
    nonce: Number(r.nonce ?? 0),
    amount_per_claim: String(r.amount_per_claim ?? '0'),
    supply_total: Number(r.supply_total ?? '0'),
    active: Boolean(r.active),
    decimals
  };
}

function toEditableState(r: Reward) {
  const decimals: number | null =
    r.decimals != null ? Number(r.decimals) : null;

  return {
    identifier: (r.identifier ?? '').trim(),
    collection: (r.collection ?? '').trim(),
    nonce: Number(r.nonce ?? 0),
    amount_per_claim: String(r.amount_per_claim ?? '0'),
    supply_total: Number(r.supply_total ?? '0'),
    active: Boolean(r.active),
    decimals
  };
}
// compare deux états éditables d’une Reward
const sameEditState = (a: any, b: any) =>
  JSON.stringify(a) === JSON.stringify(b);

export const CampaignRewardsManager: React.FC<{
  campaignId: string;
  testedBalance: any;
  onEvent?: (e: RewardsEvent) => void;
  onLoaded?: (list: Reward[]) => void;
  onCreated?: (r: Reward, list: Reward[]) => void;
  onUpdated?: (r: Reward, list: Reward[]) => void;
  onDeleted?: (id: string, list: Reward[]) => void;
  onDirtyChange?: (dirtyIds: string[]) => void;
  onCanceled?: (reward: Reward, list: Reward[]) => void;
}> = ({
  campaignId,
  testedBalance,
  onEvent,
  onLoaded,
  onCreated,
  onUpdated,
  onDeleted,
  onDirtyChange,
  onCanceled
}) => {
  const { network } = useGetNetworkConfig();
  const { tokenLogin } = useGetLoginInfo();

  const [loading, setLoading] = React.useState(true);
  const [list, setList] = React.useState<Reward[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [savingRow, setSavingRow] = React.useState<string | null>(null);
  const [deletingRow, setDeletingRow] = React.useState<string | null>(null);
  // normalise juste en trim; garde la casse (les ids MultiversX sont sensibles)
  const normCollection = (s?: string) => (s ?? '').trim();

  // vérifie si une paire (collection, nonce) existe déjà dans la liste (sauf ignoreId)
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
  // Ligne d’ajout & values par défaut
  const [showNew, setShowNew] = React.useState(false);
  const [newRow, setNewRow] = React.useState<Partial<Reward>>({
    collection: '',
    nonce: 0,
    amount_per_claim: '1',
    supply_total: 1,
    active: true
  });

  // Snapshot “original” des lignes (pour comparer)
  const originalMapRef = React.useRef<Map<string, any>>(new Map());
  // Set des lignes dirty
  const [dirty, setDirty] = React.useState<Set<string>>(new Set());
  // Header d’authentification
  const authHeader = React.useMemo(
    () =>
      tokenLogin?.nativeAuthToken
        ? { Authorization: `Bearer ${tokenLogin.nativeAuthToken}` }
        : undefined,
    [tokenLogin]
  );

  const testedBalanceRaw = testedBalance; // ou: const testedBalanceRaw = testedbalance;
  type BalanceEntry = {
    id: string;
    token: { available: string };
  };
  type TestedBalance = {
    wallet?: {
      rewards?: Array<{
        id?: string;
        token?: {
          available?: string | number;
          required?: string | number;
          missing?: string | number;
        };
        // ... autres champs inutiles ici
      }>;
    };
  };

  type BalanceInfo = {
    available: number;
    required: number;
    missing: number;
    tx_hash: string;
  };
  const balanceMap = React.useMemo(() => {
    const m = new Map<string, BalanceInfo>();
    const rewards = (testedBalanceRaw as TestedBalance)?.wallet?.rewards ?? [];

    for (const r of rewards) {
      const id = String(r?.id ?? '').trim();
      const av = Number(r?.token?.available ?? 0);
      const rq = Number(r?.token?.required ?? 0);
      const ms = Number(r?.token?.missing ?? 0);

      if (!id) continue;

      m.set(id, {
        available: Number.isFinite(av) ? av : 0,
        required: Number.isFinite(rq) ? rq : 0,
        missing: Number.isFinite(ms) ? ms : 0,
        tx_hash: ''
      });
    }

    return m;
  }, [testedBalanceRaw]);

  const onEventRef = React.useRef(onEvent);
  const onDirtyChangeRef = React.useRef(onDirtyChange);

  React.useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);
  React.useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  }, [onDirtyChange]);
  // Seed original map
  // détiens la veritié initiale des lignes pour le dirty checking
  const seedOriginalMap = React.useCallback(
    async (rows: Reward[]) => {
      const m = new Map<string, any>();

      // fetch décimales pour ESDT (nonce === 0)
      const fetchable = rows.filter((r) => !r.nonce || r.nonce === 0);
      const decimalsMap = Object.fromEntries(
        await Promise.all(
          fetchable.map(async (r) => [
            r.id,
            await getTokenDecimals(r.collection, network.apiAddress)
          ])
        )
      );

      const enrichedRows = rows.map((r) => {
        const decimals = decimalsMap[r.id] ?? r.decimals ?? null;
        const obj = {
          ...r,
          identifier: (r.identifier ?? '').trim(),
          collection: (r.collection ?? '').trim(),
          nonce: Number(r.nonce ?? 0),
          amount_per_claim: decimals
            ? String(
                new BigNumber(r.amount_per_claim ?? '0').dividedBy(
                  new BigNumber(10).exponentiatedBy(decimals)
                )
              )
            : String(r.amount_per_claim ?? '0'),
          supply_total: Number(r.supply_total ?? '0'),
          active: Boolean(r.active),
          decimals
        };
        m.set(r.id, obj);
        return obj;
      });

      originalMapRef.current = m;

      // reset dirty UNIQUEMENT au seed initial
      const empty = new Set<string>();
      setDirty(empty);
      const ids: string[] = [];
      onEventRef.current?.({ type: 'dirty-change', dirtyIds: ids });
      onDirtyChangeRef.current?.(ids);

      return enrichedRows;
    },
    [network.apiAddress] // ✅ stable
  );
  React.useEffect(() => {
    if (!authHeader) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(
          `${dinoclaim_api}/campaigns/${campaignId}/campaign_rewards`,
          { headers: authHeader }
        );
        const rows: Reward[] = Array.isArray(data) ? data : data?.rewards ?? [];
        const enriched = await seedOriginalMap(rows);
        if (!cancelled) setList(enriched);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message || e?.message || 'Failed to load rewards'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authHeader, campaignId, seedOriginalMap]); // ✅ ne se relance plus à chaque rendu
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

      // 🧩 1. on attend la seed pour enrichir les décimales
      const enriched = await seedOriginalMap(rows);

      // 🧩 2. on set la liste enrichie
      setList(enriched);

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
    console.log('onFieldChange', id, field, value);
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
      // const now = pickEditable(edited);
      const now = toEditableState(edited);
      if (sameEditState(now, base)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onAddFieldChange = (field: keyof Reward, value: any) => {
    setNewRow((prev) => ({ ...prev, [field]: value }) as Partial<Reward>);
  };

  const validateRow = (row: Partial<Reward>, ignoreId?: string) => {
    // if (!row.identifier?.trim()) return 'Identifier is required';
    if (row.collection?.trim() === 'EGLD-000000')
      return 'Collection cannot be "EGLD-000000"';
    if (
      row.nonce == null ||
      Number.isNaN(Number(row.nonce)) ||
      Number(row.nonce) < 0
    ) {
      return 'Nonce must be a number ≥ 0';
    }
    {
      let bn = new BigNumber(String(row.amount_per_claim ?? '0'));
      if (row.decimals != null) {
        bn = bn
          .multipliedBy(new BigNumber(10).exponentiatedBy(row.decimals))
          .integerValue(BigNumber.ROUND_FLOOR);
      }
      if (!bn.isFinite() || (bn.decimalPlaces() ?? 0) > 0 || bn.lt(1)) {
        return 'Amount must be a positive integer (e.g. "1")';
      }
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
      let amount_per_claim_base = newRow.amount_per_claim ?? '0';
      if (newRow.decimals != null) {
        amount_per_claim_base = new BigNumber(newRow.amount_per_claim || 0)
          .multipliedBy(new BigNumber(10).exponentiatedBy(newRow.decimals))
          .toFixed(0);
      }
      const payload = {
        collection: newRow.collection!.trim(),
        nonce: Number(newRow.nonce),
        amount_per_claim: amount_per_claim_base, // <-- base units
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
        const normalized = normalizeRowForUI(created, newRow.decimals ?? 0);

        setList((prev) => {
          const newList = [normalized, ...prev];
          onEvent?.({ type: 'created', reward: normalized, list: newList });
          onCreated?.(normalized, newList);
          return newList;
        });
        originalMapRef.current.set(created.id, toEditableState(normalized));

        originalMapRef.current.set(created.id, pickEditable(normalized));
      } else {
        await fetchList();
      }

      //reset new row form after submit
      setNewRow({
        identifier: '',
        collection: '',
        nonce: 0,
        amount_per_claim: '1',
        supply_total: 1,
        active: true
      });
      //hide new row form
      setShowNew(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Create failed');
    }
  };

  const handleWithdraw = async (id: string, excedent: number) => {
    if (!authHeader) return;
    if (!(excedent > 0)) return;
    if (!confirm(`Récupérer ${excedent} token(s) pour cette récompense ?`))
      return;

    setSavingRow(id);
    setError(null);

    try {
      const payload = { rewardId: id, amount: String(excedent) };

      const res = await axios_claim.post(
        `${dinoclaim_api}/campaigns/${campaignId}/withdraw`,
        payload,
        { headers: authHeader }
      );

      if (res.status >= 400) {
        setError(extractProblem(res.data));
        return;
      }

      // update balance map optimistically
      try {
        const info = balanceMap.get(id);
        if (info) {
          const avail = Number.isFinite(info.available) ? info.available : 0;
          balanceMap.set(id, {
            ...info,
            available: Math.max(0, avail - excedent),
            tx_hash: res.data.data?.tx_hash ?? ''
          });
          console.log(
            'Updated balance after withdraw:',
            balanceMap.get(id),
            res.data,
            res.data.data.tx_hash
          );
          // force a re-render so the badge updates
          setList((prev) => [...prev]);
        }
      } catch (err) {
        // ignore mutation errors — we'll refresh from server below
      }

      // refresh list / balances after successful withdraw
      await fetchList();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Withdraw failed');
    } finally {
      setSavingRow(null);
    }
  };

  const handleCancel = (row: Reward) => {
    const original = originalMapRef.current.get(row.id);
    if (original) {
      setList((prev) => {
        const newList = prev.map((r) =>
          r.id === row.id ? { ...r, ...original } : r
        );
        onEvent?.({ type: 'cancel', reward: original, list: newList });
        onCanceled?.(original, newList);
        return newList;
      });
      originalMapRef.current.set(row.id, pickEditable(original));
    }
    setDirty((prev) => {
      const next = new Set(prev);
      next.delete(row.id);
      const ids = Array.from(next);
      onEvent?.({ type: 'dirty-change', dirtyIds: ids });
      onDirtyChange?.(ids);
      return next;
    });
  };
  function normalizeRowForUI(r: Reward, d: number): Reward {
    const dec = d != null ? Number(d) : null;
    const amountUi =
      dec != null
        ? new BigNumber(r.amount_per_claim ?? '0')
            .dividedBy(new BigNumber(10).exponentiatedBy(dec))
            .toFixed() // garde une string “propre”
        : String(r.amount_per_claim ?? '0');

    return {
      ...r,
      decimals: dec,
      amount_per_claim: amountUi
    };
  }
  const handleSave = async (row: Reward) => {
    if (!authHeader) return;

    const err = validateRow(row, row.id);
    if (err) return setError(err);

    setSavingRow(row.id);
    setError(null);
    try {
      let amount_per_claim = row.amount_per_claim;
      if (row.decimals != null) {
        const bn = new BigNumber(row.amount_per_claim || 0);
        amount_per_claim = bn
          .multipliedBy(new BigNumber(10).exponentiatedBy(row.decimals))
          .toFixed(0);
      }
      const payload = {
        collection: row.collection.trim(),
        nonce: Number(row.nonce),
        amount_per_claim: String(amount_per_claim),
        supply_total: String(row.supply_total),
        active: Boolean(row.active)
      };

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
        const normalized = normalizeRowForUI(updated, row.decimals ?? 0);

        setList((prev) => {
          const newList = prev.map((r) =>
            r.id === row.id ? { ...r, ...normalized } : r
          );
          onEvent?.({ type: 'updated', reward: normalized, list: newList });
          onUpdated?.(normalized, newList);
          return newList;
        });
        // originalMapRef.current.set(updated.id, pickEditable(updated));
        originalMapRef.current.set(normalized.id, toEditableState(normalized));
        setDirty((prev) => {
          const next = new Set(prev);
          next.delete(normalized.id);
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

  const emitDirty = React.useCallback(
    (set: Set<string>) => {
      const ids = Array.from(set);
      onEvent?.({ type: 'dirty-change', dirtyIds: ids });
      onDirtyChange?.(ids);
    },
    [onEvent, onDirtyChange]
  );

  React.useEffect(() => {
    emitDirty(dirty);
  }, [dirty, emitDirty]);

  const handleCollectionChange = async (val: string) => {
    onAddFieldChange('collection', val);
    if (!val.trim()) return;

    // si c'est un ESDT (pas de nonce ou 0)
    if (!newRow.nonce || newRow.nonce === 0) {
      const dec = await getTokenDecimals(val.trim(), network.apiAddress);
      onAddFieldChange('decimals', dec);
    } else {
      onAddFieldChange('decimals', null);
    }
  };
  const handleCollectionEdit = async (
    id: string,
    val: string,
    nonce: number
  ) => {
    onFieldChange(id, 'collection', val);
    const row = list.find((r) => r.id === id);
    if (!row) return;

    if (!nonce || nonce === 0) {
      const dec = await getTokenDecimals(val.trim(), network.apiAddress);
      onFieldChange(id, 'decimals', dec);
    } else {
      onFieldChange(id, 'decimals', null);
    }
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
      </div>

      <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 mb-4'>
        <h3 className='font-semibold text-blue-800 mb-1 flex items-center gap-2'>
          🎁 Rewards setup
        </h3>
        <p className='leading-relaxed'>
          Rewards define what users can receive when claiming a code. Each
          reward corresponds to an NFT or SFT that will be sent from your
          campaign wallet.
        </p>

        <ul className='list-disc list-inside mt-2 space-y-1'>
          <li>
            <strong>Collection</strong> — the token collection identifier (e.g.{' '}
            <code>DY</code>).
          </li>
          <li>
            <strong>Nonce</strong> — the specific NFT or SFT ID within that
            collection.
          </li>
          <li>
            <strong>Amount / claim</strong> — how many tokens are sent per
            claim.
          </li>
          <li>
            <strong>Supply</strong> — total number of claims available for this
            reward.
          </li>
        </ul>

        <p className='mt-3 italic text-blue-800/90'>
          Once your rewards are set up, click{' '}
          <strong>“Transfer to system wallet”</strong>
          to fund the campaign with the required tokens and cover the necessary
          fees.
        </p>
      </div>

      {error && <div className='text-sm text-red-600'>{error}</div>}

      <div className='rounded-md border overflow-hidden'>
        <div className='overflow-x-auto'>
          {/* <-- NEW */}
          <table className='w-full text-sm min-w-[920px]'>
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
                <th className='px-3 py-2'>Identifier</th>
                {/* <th className='px-3 py-2'>Collection</th> */}
                <th className='px-3 py-2'>Nonce</th>
                <th className='px-3 py-2'>
                  Amount / claim
                  <Tooltip content='Number of SFTs/tokens given to the user when they claim with a code'>
                    <span className='ml-2 cursor-pointer'>ℹ️</span>
                  </Tooltip>
                </th>
                <th className='px-3 py-2'>
                  Supply
                  <Tooltip content='Number of codes that can be claimed with this reward. This includes already claimed and reserved codes. You may increase this value later if needed.'>
                    <span className='ml-2 cursor-pointer'>ℹ️</span>
                  </Tooltip>
                </th>
                <th className='px-2'>System balance</th> {/* 🆕 */}
                <th className='px-3 py-2'>Reserved</th>
                <th className='px-3 py-2'>Claimed</th>
                <th className='px-3 py-2'>Active</th>
                <th className='px-3 py-2 text-right'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!showNew && (
                <tr className='bg-white/70'>
                  <td colSpan={8}></td>
                  <td className='px-3 py-2 text-center'>
                    <button
                      className='px-3 py-1.5 rounded bg-[#4b4bb7] text-white'
                      onClick={() => setShowNew(true)}
                    >
                      + New reward
                    </button>
                  </td>
                </tr>
              )}
              {/* New row */}
              {showNew && (
                <tr className='bg-white/70'>
                  <td className='px-3 py-2 text-gray-500'>
                    <input
                      className='spec-input-code w-full'
                      type='text'
                      placeholder='identifier (ex: DINOVOX-cb2297-1258)'
                      value={newRow.identifier ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        onAddFieldChange('identifier', value);

                        const { collection, nonce } =
                          parseTokenIdentifier(value);
                        onAddFieldChange('nonce', nonce);
                        handleCollectionChange(collection);
                      }}
                    />
                    {/* Liens Explorer */}
                    {newRow.collection && (
                      <div className='mt-1 text-xs text-blue-700'>
                        {newRow.collection &&
                          (() => {
                            const { tokenUrl, collectionUrl, itemUrl } =
                              buildExplorerLinks(
                                newRow.collection!,
                                newRow.nonce ?? 0,
                                network.explorerAddress
                              );

                            // TOKEN (nonce === 0)
                            if (Number(newRow.nonce) === 0 && tokenUrl) {
                              return (
                                <div className='flex items-center gap-2'>
                                  <a
                                    href={tokenUrl}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='underline hover:no-underline'
                                  >
                                    View token
                                  </a>
                                  {newRow.decimals != null && (
                                    <>
                                      <span className='text-sm text-slate-400'>
                                        ·
                                      </span>
                                      <span>
                                        Decimals:{' '}
                                        <strong>{newRow.decimals}</strong>
                                      </span>
                                    </>
                                  )}
                                </div>
                              );
                            }

                            // COLLECTION (+ ITEM si nonce présent et itemUrl disponible)
                            return (
                              <div className='flex items-center gap-2'>
                                {collectionUrl && (
                                  <>
                                    <a
                                      href={collectionUrl}
                                      target='_blank'
                                      rel='noreferrer'
                                      className='underline hover:no-underline'
                                    >
                                      View collection
                                    </a>
                                  </>
                                )}

                                {itemUrl && (
                                  <>
                                    <span className='text-sm text-slate-400'>
                                      ·
                                    </span>
                                    <a
                                      href={itemUrl}
                                      target='_blank'
                                      rel='noreferrer'
                                      className='underline hover:no-underline'
                                    >
                                      Item #{Number(newRow.nonce)}
                                    </a>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                      </div>
                    )}
                  </td>

                  {/* <td className='px-3 py-2'>
                    <input
                      className='spec-input-code w-full'
                      type='text'
                      placeholder='Collection (ex: DYNASFT-d4f18f)'
                      value={newRow.collection ?? ''}
                      onChange={(e) =>
                        onAddFieldChange('collection', e.target.value)
                      }
                    />
                  </td> */}
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
                      min={1}
                      value={newRow.amount_per_claim ?? '1'}
                      onChange={(e) =>
                        onAddFieldChange('amount_per_claim', e.target.value)
                      }
                    />
                  </td>
                  <td className='px-3 py-2'>
                    <input
                      className='spec-input-code w-full'
                      type='number'
                      placeholder='e.g. "100"'
                      value={newRow.supply_total ?? '0'}
                      onChange={(e) =>
                        onAddFieldChange('supply_total', e.target.value)
                      }
                    />
                  </td>
                  <td className='px-3 py-2 text-gray-500'>—</td>
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
                            supply_total: 1,
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
                        {/* Identifier input existing row */}
                        <input
                          className='spec-input-code w-full'
                          type='text'
                          value={
                            r.identifier
                              ? r.identifier
                              : buildTokenIdentifier(r.collection, r.nonce)
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            onFieldChange(r.id, 'identifier', e.target.value);

                            const { collection, nonce } =
                              parseTokenIdentifier(value);

                            onFieldChange(r.id, 'collection', collection);
                            onFieldChange(r.id, 'nonce', nonce);

                            handleCollectionEdit(r.id, collection, nonce);
                          }}
                          disabled={
                            (r.supply_reserved ?? 0) > 0 ||
                            (r.supply_claimed ?? 0) > 0
                          }
                        />
                        {/* Liens Explorer */}
                        {r.collection && (
                          <div className='mt-1 text-xs text-blue-700'>
                            {r.collection &&
                              (() => {
                                const { tokenUrl, collectionUrl, itemUrl } =
                                  buildExplorerLinks(
                                    r.collection,
                                    r.nonce,
                                    network.explorerAddress
                                  );

                                // TOKEN (nonce === 0)
                                if (Number(r.nonce) === 0 && tokenUrl) {
                                  return (
                                    <div className='flex items-center gap-2'>
                                      <a
                                        href={tokenUrl}
                                        target='_blank'
                                        rel='noreferrer'
                                        className='underline hover:no-underline'
                                      >
                                        View token
                                      </a>
                                      {r.decimals != null && (
                                        <>
                                          <span className='text-sm text-slate-400'>
                                            ·
                                          </span>
                                          <span>
                                            Decimals:{' '}
                                            <strong>{r.decimals}</strong>
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  );
                                }

                                // COLLECTION (+ ITEM si nonce présent et itemUrl disponible)
                                return (
                                  <div className='flex items-center gap-2'>
                                    {collectionUrl && (
                                      <>
                                        <a
                                          href={collectionUrl}
                                          target='_blank'
                                          rel='noreferrer'
                                          className='underline hover:no-underline'
                                        >
                                          View collection
                                        </a>
                                      </>
                                    )}

                                    {itemUrl && (
                                      <>
                                        <span className='text-sm text-slate-400'>
                                          ·
                                        </span>
                                        <a
                                          href={itemUrl}
                                          target='_blank'
                                          rel='noreferrer'
                                          className='underline hover:no-underline'
                                        >
                                          Item #{r.nonce}
                                        </a>
                                      </>
                                    )}
                                  </div>
                                );
                              })()}
                          </div>
                        )}
                      </td>
                      {/* Collection input */}
                      {/* <td className='px-3 py-2'>
                        <input
                          className='spec-input-code w-full'
                          type='text'
                          value={r.collection}
                          onChange={(e) =>
                            onFieldChange(r.id, 'collection', e.target.value)
                          }
                          disabled={
                            (r.supply_reserved ?? 0) > 0 ||
                            (r.supply_claimed ?? 0) > 0
                          }
                        />
                      </td> */}
                      <td className='px-3 py-2'>
                        {/* Nonce input */}
                        <input
                          className='spec-input-code w-full'
                          type='number'
                          min={0}
                          inputMode='numeric'
                          onWheel={(e) =>
                            (e.currentTarget as HTMLInputElement).blur()
                          }
                          value={r.nonce}
                          onChange={(e) => {
                            const newNonce = Number(e.target.value);

                            // Mets à jour le champ nonce

                            // Reconstruit l'identifier à partir de la collection + nonce
                            const newIdentifier = buildTokenIdentifier(
                              r.collection,
                              newNonce
                            );
                            onFieldChange(r.id, 'nonce', newNonce);
                            onFieldChange(r.id, 'identifier', newIdentifier);
                            handleCollectionChange(r.collection);
                          }}
                          disabled={
                            (r.supply_reserved ?? 0) > 0 ||
                            (r.supply_claimed ?? 0) > 0
                          }
                        />{' '}
                      </td>
                      <td className='px-3 py-2'>
                        {/* amount_per_claim input */}
                        <input
                          className='spec-input-code w-full'
                          type='number'
                          inputMode='numeric'
                          onWheel={(e) =>
                            (e.currentTarget as HTMLInputElement).blur()
                          }
                          value={r.amount_per_claim}
                          onChange={(e) =>
                            onFieldChange(
                              r.id,
                              'amount_per_claim',
                              e.target.value
                            )
                          }
                          disabled={
                            (r.supply_reserved ?? 0) > 0 ||
                            (r.supply_claimed ?? 0) > 0
                          }
                        />
                      </td>
                      <td className='px-3 py-2'>
                        {/* supply_total input */}
                        <input
                          className='spec-input-code w-full'
                          type='number'
                          inputMode='numeric'
                          onWheel={(e) =>
                            (e.currentTarget as HTMLInputElement).blur()
                          }
                          value={r.supply_total}
                          onChange={(e) => {
                            const raw = (e.target as HTMLInputElement).value;
                            const num = Number(raw === '' ? 0 : raw);
                            const minAllowed =
                              (r.supply_claimed ?? 0) +
                              (r.supply_reserved ?? 0);
                            onFieldChange(
                              r.id,
                              'supply_total',
                              Number.isFinite(num)
                                ? num < minAllowed
                                  ? minAllowed
                                  : num
                                : minAllowed
                            );
                          }}
                        />
                      </td>
                      {/* 🆕 Wallet balance (lecture seule) */}
                      <td className='px-2 py-2'>
                        {(() => {
                          const bal = balanceMap.get(r.id); // balance disponible actuelle (may be undefined)
                          const available =
                            balanceMap.get(r.id)?.available ?? 0;
                          const required = balanceMap.get(r.id)?.required ?? 0;
                          const missing = balanceMap.get(r.id)?.missing ?? 0;

                          // "needed" = quantité réellement nécessaire
                          const needed =
                            required > 0
                              ? required
                              : Math.max(
                                  0,
                                  (r.supply_total ?? 0) -
                                    (r.supply_claimed ?? 0)
                                );

                          const hasBalance = Number.isFinite(available);
                          const isMissing = missing > 0;
                          const isEnough = hasBalance && required >= needed;
                          const excedent = isEnough
                            ? Math.max(0, available - needed)
                            : 0;

                          type Status =
                            | 'insuffisant'
                            | 'suffisant'
                            | 'excédent';
                          let status: Status = 'insuffisant';
                          if (excedent > 0) status = 'excédent';
                          else if (isEnough && !isMissing) status = 'suffisant';

                          const baseBadge =
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs border font-medium';
                          const statusStyle = isDirty
                            ? 'border-gray-200 bg-gray-100 text-gray-700'
                            : status === 'excédent'
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : status === 'suffisant'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-red-200 bg-red-50 text-red-700';

                          return (
                            <div className='flex items-center gap-2'>
                              <span className={`${baseBadge} ${statusStyle}`}>
                                {isDirty ? (
                                  <>
                                    {hasBalance ? `${available}` : '—'} (Save to
                                    refresh)
                                  </>
                                ) : (
                                  <>
                                    <span className='inline-flex items-center gap-1'>
                                      <span>
                                        {hasBalance ? available : '—'}
                                      </span>
                                      <span>/</span>
                                      <span>{required}</span>
                                    </span>
                                    <span className='ml-1 opacity-80'>
                                      {status === 'excédent'
                                        ? '(excédent)'
                                        : status === 'suffisant'
                                        ? '(suffisant)'
                                        : '(insuffisant)'}
                                    </span>
                                  </>
                                )}
                                {!isDirty &&
                                  status === 'excédent' &&
                                  excedent > 0 && (
                                    <button
                                      type='button'
                                      className='h-7 rounded-md px-2 text-xs font-medium border border-blue-200 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 transition'
                                      title='Récupérer le surplus'
                                      about='{excedent} tokens to recover'
                                      onClick={async () => {
                                        handleWithdraw(r.id, excedent);
                                      }}
                                    >
                                      Récupérer
                                    </button>
                                  )}

                                {!isDirty && bal?.tx_hash && (
                                  <span className='ml-2'>
                                    <a
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='flex items-center text-sm hover:underline'
                                      href={
                                        network.explorerAddress +
                                        '/transactions/' +
                                        bal?.tx_hash
                                      }
                                    >
                                      {shortenString(bal?.tx_hash, 4)}
                                    </a>{' '}
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        })()}
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
                              {isDirty && (
                                <>
                                  <button
                                    className='px-3 py-1 rounded border disabled:opacity-50'
                                    disabled={savingRow === r.id || !canSave}
                                    onClick={() => handleCancel(r)}
                                    title={rowError || undefined}
                                  >
                                    {savingRow === r.id ? '' : 'Cancel'}
                                  </button>
                                  {/* <span className='text-xs text-amber-600 flex items-center gap-1'>
                                    <span style={{ fontSize: 10 }}>●</span>{' '}
                                    Unsaved
                                  </span> */}
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
                            className='px-3 py-1 rounded border border-red-500 text-red-600 disabled:opacity-50'
                            disabled={
                              deletingRow === r.id ||
                              r.supply_claimed! > 0 ||
                              (balanceMap.get(r.id)?.available ?? 0) > 0 // can't delete if balance > 0
                            }
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
        </div>
        {/* <-- NEW */}
      </div>
    </div>
  );
};
