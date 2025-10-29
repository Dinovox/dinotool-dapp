import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { dinoclaim_api } from 'config';
import { useGetLoginInfo, useGetPendingTransactions } from 'lib';
import CodesList from './CodesList';
import { useGetNftInformations } from 'pages/LotteryList/Transaction/helpers/useGetNftInformation';
import FileDisplay from 'pages/LotteryList/FileDisplay';
import notFound from 'pages/LotteryList/esdtnotfound.svg';
import { ActionTransfert } from './ActionTransfert';
import ShortenedAddress from 'helpers/shortenedAddress';
import { t } from 'i18next';
import { CampaignRewardsManager } from './CampaignRewardsManager';
import { Tooltip } from 'components/Tooltip';

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

type EditCampaignProps = {
  campaign: CampaignPreview;
  onBack: () => void;
  onSaved?: (updated: CampaignPreview) => void;
};

const EditCampaign: React.FC<EditCampaignProps> = ({
  campaign,
  onBack,
  onSaved
}) => {
  const { tokenLogin } = useGetLoginInfo();
  const transactions = useGetPendingTransactions();
  const hasPendingTransactions = transactions.length > 0;
  // état éditable (on part de la prop fournie)
  const [editedCampaign, setEditedCampaign] =
    useState<CampaignPreview>(campaign);

  // champs contrôlés
  const [title, setTitle] = useState(campaign.title ?? '');
  const [collection, setCollection] = useState(campaign.collection ?? '');
  const [nonce, setNonce] = useState<number>(campaign.nonce ?? 0);
  const [maxTotalSends, setMaxTotalSends] = useState<string>(
    typeof campaign.max_total_sends === 'number'
      ? String(campaign.max_total_sends)
      : ''
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean>(false);
  const [rewardsSaved, setRewardsSaved] = useState<boolean>(false);
  const [baseline, setBaseline] = useState({
    title: campaign.title ?? '',
    collection: campaign.collection ?? '',
    nonce: campaign.nonce ?? 0,
    maxTotalSends:
      typeof campaign.max_total_sends === 'number'
        ? String(campaign.max_total_sends)
        : ''
  });
  const [hasUnsavedRewards, setHasUnsavedRewards] = useState<boolean>(false);

  // 🔁 resync quand la prop campaign change (réouverture)

  // resync quand la prop change (réouverture)
  useEffect(() => {
    setEditedCampaign(campaign);
    setTitle(campaign.title ?? '');
    setCollection(campaign.collection ?? '');
    setNonce(campaign.nonce ?? 0);
    setMaxTotalSends(
      typeof campaign.max_total_sends === 'number'
        ? String(campaign.max_total_sends)
        : ''
    );
    // 🔁 maj baseline aussi
    setBaseline({
      title: campaign.title ?? '',
      collection: campaign.collection ?? '',
      nonce: campaign.nonce ?? 0,
      maxTotalSends:
        typeof campaign.max_total_sends === 'number'
          ? String(campaign.max_total_sends)
          : ''
    });
  }, [campaign]);

  // dirty check pour éviter les saves inutiles
  // header version
  const isDirty = useMemo(() => {
    const norm = (v: any) => (v === undefined || v === null ? '' : String(v));
    return (
      norm(title) !== norm(baseline.title) ||
      norm(collection) !== norm(baseline.collection) ||
      norm(nonce) !== norm(baseline.nonce) ||
      norm(maxTotalSends) !== norm(baseline.maxTotalSends)
    );
  }, [title, collection, nonce, maxTotalSends, baseline]);

  // validations simples
  const validationError = useMemo(() => {
    if (!title.trim()) return 'Title requis';
    if (nonce !== null && (isNaN(nonce) || nonce < 0)) {
      return 'Nonce doit être un entier ≥ 0';
    }
    if (
      maxTotalSends.trim() &&
      (!/^\d+$/.test(maxTotalSends) || Number(maxTotalSends) < 0)
    ) {
      return 'Max total sends doit être un entier ≥ 0';
    }
    return null;
  }, [title, nonce, maxTotalSends]);

  const handleSave = async () => {
    if (!tokenLogin?.nativeAuthToken) {
      setError('Non authentifié');
      return;
    }
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isDirty) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        collection: collection.trim() || null,
        nonce: nonce ? nonce : null,
        max_total_sends: maxTotalSends.trim() ? Number(maxTotalSends) : null
      };

      const { data } = await axios.put(
        `${dinoclaim_api}/campaigns/${campaign.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${tokenLogin.nativeAuthToken}` }
        }
      );

      // on met à jour l'aperçu local à partir du payload (et/ou de la réponse API si elle renvoie la campagne)
      const updated: CampaignPreview = {
        ...campaign,
        ...editedCampaign,
        title: payload.title ?? editedCampaign.title,
        collection: payload.collection ?? editedCampaign.collection,
        nonce:
          payload.nonce === null
            ? 0
            : (payload.nonce as number) ?? editedCampaign.nonce,
        max_total_sends:
          payload.max_total_sends === null
            ? undefined
            : (payload.max_total_sends as number),
        updated_at: new Date().toISOString() // à remplacer si l’API renvoie updated_at
      };

      setEditedCampaign(updated);
      setTitle(updated.title ?? '');
      setCollection(updated.collection ?? '');
      setNonce(updated.nonce ?? 0);
      setMaxTotalSends(
        typeof updated.max_total_sends === 'number'
          ? String(updated.max_total_sends)
          : ''
      );

      // 🟩 baseline = nouvelles valeurs -> isDirty repasse à false
      setBaseline({
        title: updated.title ?? '',
        collection: updated.collection ?? '',
        nonce: updated.nonce ?? 0,
        maxTotalSends:
          typeof updated.max_total_sends === 'number'
            ? String(updated.max_total_sends)
            : ''
      });

      setSaved(true);
      onSaved?.(updated);
      // refléter les nouveaux champs dans les inputs (utile si l’API normalise)
      setTitle(updated.title ?? '');
      setCollection(updated.collection ?? '');
      setNonce(updated.nonce ?? 0);
      setMaxTotalSends(
        typeof updated.max_total_sends === 'number'
          ? String(updated.max_total_sends)
          : ''
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Erreur lors de l’enregistrement';
      setError(msg);
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 1800);
    }
  };

  // Fetch campaign details by ID (GET /campaigns/:id)
  const [loading, setLoading] = useState(false);
  const [balanceTested, setBalanceTested] = useState<any>(null);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      if (
        !tokenLogin?.nativeAuthToken ||
        !campaign.id ||
        hasPendingTransactions
      )
        return;
      //pas de test sur collection/nonce, sinon on rate le fetch initial avec le wallet id
      setLoading(true);
      setError(null);
      setRewardsSaved(false);
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${tokenLogin.nativeAuthToken}`
          }
        };
        //test balance retourne aussi les infos de wallet
        const { data } = await axios.get(
          `${dinoclaim_api}/campaigns/${campaign.id}/testbalance`,
          config
        );
        console.log('Fetched campaign details:', data);
        setBalanceTested(data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            'Erreur lors de la récupération de la campagne'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    campaign.id,
    tokenLogin?.nativeAuthToken,
    saved,
    rewardsSaved,
    hasPendingTransactions
  ]);
  return (
    <div>
      {/* Bloc 1 == return to list  */}
      <div
        style={{
          float: 'right',
          marginTop: '20px',
          marginRight: '20px'
        }}
      >
        {' '}
        <button onClick={onBack}>{t('lotteries:return')}</button>
      </div>
      <h2 className='text-xl font-bold mb-2'>
        {' '}
        Distribution campaign details{' '}
      </h2>{' '}
      {/* Métadonnées (lecture seule) */}
      <div className='mb-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm'>
        <div>
          <span className='font-semibold'>Status:</span>{' '}
          {editedCampaign.status
            ? editedCampaign.status.charAt(0).toUpperCase() +
              editedCampaign.status.slice(1)
            : '-'}
        </div>
        <div>
          <span className='font-semibold'>Campaign wallet: </span>
          <ShortenedAddress address={balanceTested?.wallet?.address} />
        </div>

        <div>
          <span className='font-semibold'>ID:</span> {editedCampaign.id}
        </div>
        <div>
          <span className='font-semibold'>Created at:</span>{' '}
          {editedCampaign.created_at
            ? new Date(editedCampaign.created_at).toLocaleString()
            : '-'}
        </div>
        <div>
          <span className='font-semibold'>Updated at:</span>{' '}
          {editedCampaign.updated_at
            ? new Date(editedCampaign.updated_at).toLocaleString()
            : '-'}
        </div>
        <div>
          <span className='font-semibold'>
            Maximum claims{' '}
            <Tooltip content='Maximum number of claim codes allowed for this campaign.'>
              <span className='ml-2 cursor-pointer'>ℹ️</span>
            </Tooltip>
          </span>{' '}
          {editedCampaign.max_total_sends ?? '-'}
        </div>
      </div>
      {/* Formulaire éditable */}
      <div className='grid grid-cols-2 gap-4'>
        <label className='flex flex-col gap-1'>
          <span className='text-sm font-semibold'>Title</span>
          <input
            className='spec-input-code'
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='My cool campaign'
          />
        </label>

        {/* <label className='flex flex-col gap-1'>
          <span className='text-sm font-semibold'>Collection (identifier)</span>
          <input
            className='spec-input-code'
            type='text'
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            placeholder='COLLECT-abcdef'
          />
        </label> */}

        {/* <label className='flex flex-col gap-1'>
          <span className='text-sm font-semibold'>Nonce</span>
          <input
            className='spec-input-code'
            type='number'
            inputMode='numeric'
            min={0}
            value={nonce}
            onChange={(e) => setNonce(Number(e.target.value))}
            placeholder='0'
            onWheel={(e) => e.currentTarget.blur()}
          />
        </label> */}

        {/* <label className='flex flex-col gap-1'>
          <span className='text-sm font-semibold'>Max total sends</span>
          <input
            className='spec-input-code'
            type='number'
            inputMode='numeric'
            min={1}
            value={maxTotalSends}
            max={100}
            onChange={(e) => setMaxTotalSends(e.target.value)}
            placeholder='100'
            onWheel={(e) => e.currentTarget.blur()}
          />
        </label> */}
        {/* Actions */}
        <div className='flex items-center gap-3 pt-4'>
          {saving && <span>Saving...</span>}
          {validationError && (
            <span className='text-red-600'>{validationError}</span>
          )}
          {isDirty && <span className='text-yellow-600'>Unsaved changes</span>}
          <button
            className='px-4 py-2 rounded bg-[#4b4bb7] text-white disabled:opacity-50'
            onClick={handleSave}
            disabled={saving || !!validationError || !isDirty}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>

          {saved && <span className='text-sm text-green-700'>Saved ✔</span>}

          {error && <span className='text-sm text-red-600'>{error}</span>}
        </div>

        <div className='col-span-2'>
          <CampaignRewardsManager
            campaignId={editedCampaign.id}
            hostedWalletAddress={balanceTested?.wallet?.address}
            testedBalance={balanceTested}
            onEvent={(e) => {
              if (
                e.type === 'updated' ||
                e.type === 'created' ||
                e.type === 'deleted'
              ) {
                // ex: rafraîchir un résumé, activer un bouton, toaster, etc.
                setRewardsSaved(true);
              }
              if (e.type === 'dirty-change') {
                setHasUnsavedRewards(e.dirtyIds.length > 0);
              }
            }}
          />
        </div>

        {balanceTested && !hasUnsavedRewards && (
          <ActionTransfert
            egld_amount={
              balanceTested?.wallet?.egld?.missingWei
                ? balanceTested.wallet?.egld?.missingWei
                : 0
            }
            rewards={balanceTested?.wallet?.rewards || []}
            receiver_address={balanceTested?.wallet?.address}
          />
        )}
      </div>
      <CodesList campaignId={editedCampaign.id} />
    </div>
  );
};

export default EditCampaign;
