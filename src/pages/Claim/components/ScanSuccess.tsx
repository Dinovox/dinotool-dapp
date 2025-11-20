import { useGetAccountInfo, useGetLoginInfo, useGetNetworkConfig } from 'lib';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { dinoclaim_api } from 'config';
import { Button } from 'components';
import shortenString from 'helpers/ShortenString';
import { UAParser } from 'ua-parser-js';
import { useGetNftInformations } from 'pages/LotteryList/Transaction/helpers/useGetNftInformation';
import FileDisplay from 'pages/LotteryList/FileDisplay';
import notFound from 'pages/LotteryList/esdtnotfound.svg';
import bigToHex from 'helpers/bigToHex';
import BigNumber from 'bignumber.js';
import { bigNumToHex } from 'helpers/bigNumToHex';
const parser = new UAParser();
const result = parser.getResult();
const deviceType = result.device.type;
type CodeWithCampaign = {
  id: string;
  status: string;
  tx_hash: string;
  collection: string;
  nonce: string;
  amount_per_claim: string;
  updated_at: string;
  claimed_at: string | null;
  campaign: Campaign;
};
type Campaign = {
  id: string;
  network: string;
  start_at: string;
  end_at: string;
  status: string;
};

const statusStyles: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  failed: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  reserved: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
};

const LabelValue = ({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className='text-sm'>
    <span className='text-slate-500'>{label}: </span>
    <span className='font-medium text-slate-800'>{children}</span>
  </div>
);
export const ScanSuccess = ({ messageToSign }: { messageToSign: string }) => {
  const [signed, setSigned] = useState('');
  const { address } = useGetAccountInfo();
  const { network } = useGetNetworkConfig();
  // const signedMessageInfo = useGetLastSignedMessageSession();
  const { tokenLogin, isLoggedIn } = useGetLoginInfo();
  const sentRef = useRef<string | null>(null); // garde anti-doublons StrictMode

  const [code_info, setCodeWithCampaign] = useState<CodeWithCampaign>();
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  // appel API dès que tokenLogin et messageToSign sont prêts
  useEffect(() => {
    // conditions minimales
    if (!tokenLogin?.nativeAuthToken) return;
    if (!messageToSign) return;

    // déjà envoyé pour ce code ? (évite doubles appels, y compris StrictMode)
    if (sentRef.current === messageToSign) return;

    let cancelled = false; // au cas où le composant se démonte

    (async () => {
      try {
        sentRef.current = messageToSign; // lock tout de suite
        setSigned(messageToSign);

        const { data } = await axios.put(
          dinoclaim_api + '/campaigns/claim',
          { code: messageToSign },
          { headers: { Authorization: `Bearer ${tokenLogin.nativeAuthToken}` } }
        );
        if (data.data?.campaign) {
          setCodeWithCampaign(data.data);
        }
        if (data.error) {
          setError(data.error);
        }
        if (data.message) {
          setMessage(data.message);
        }
        if (cancelled) return; // si démonté, on stoppe là
      } catch (err) {
        // en cas d’erreur, tu peux réinitialiser le lock si tu veux autoriser un retry
        // sentRef.current = null;
        console.error('Unable to call api - RAW', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tokenLogin?.nativeAuthToken, messageToSign]); // déclenche UNIQUEMENT quand ces valeurs changent

  const [isConsuming, setIsConsuming] = useState(false);

  const handleConsume = async () => {
    if (!tokenLogin?.nativeAuthToken || !code_info?.id) return;
    setIsConsuming(true);

    try {
      const { data } = await axios.post(
        `${dinoclaim_api}/campaigns/consume`,
        { reservedId: code_info.id },
        { headers: { Authorization: `Bearer ${tokenLogin.nativeAuthToken}` } }
      );
      if (data.data?.campaign) setCodeWithCampaign(data.data);
      if (data.error) {
        setError(data.error);
      } else {
        setError('');
      }
      if (data.message) setMessage(data.message);
    } catch (err: any) {
      console.error('Unable to consume code:', err?.message || err);
    } finally {
      setIsConsuming(false);
    }
  };

  const openUrl = (url: string) => {
    if (deviceType === 'mobile') {
      window.location.href = `twitter://post?message=${encodeURIComponent(
        url
      )}`;
    } else {
      window.open(
        'https://twitter.com/intent/post?text=' + encodeURIComponent(url),
        '_blank'
      );
    }
  };

  const nft_information = useGetNftInformations(
    code_info?.collection ? code_info?.collection : '',
    code_info?.nonce ? code_info?.nonce : ''
  );

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const fetchTxStatus = async () => {
      if (!code_info?.tx_hash) return;
      try {
        const response = await fetch(
          `${network.apiAddress}/transactions/${code_info.tx_hash}`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch transaction status: ${response.statusText}`
          );
        }
        const txData = await response.json();
        if (
          txData.status &&
          code_info.status === 'pending' &&
          txData.status !== 'pending'
        ) {
          setCodeWithCampaign((prev) =>
            prev ? { ...prev, status: txData.status } : prev
          );
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        // Optionally handle error
      }
    };

    if (code_info?.status === 'pending' && code_info.tx_hash) {
      intervalId = setInterval(fetchTxStatus, 5000);
      fetchTxStatus();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [code_info?.status, code_info?.tx_hash]);

  return (
    <div className='flex flex-col gap-4'>
      <div className='text-xs uppercase tracking-wide text-slate-400'>
        Code submitted
      </div>

      <div className='rounded-xl border border-slate-200 bg-white shadow-sm p-4 md:p-5'>
        {/* Alerts */}
        {error && (
          <div className='mb-3 rounded-md bg-rose-50 text-rose-700 px-3 py-2 text-sm ring-1 ring-rose-200'>
            <div className='font-semibold'>Error</div>
            <div className='mt-0.5 break-words'>{error}</div>
            <div className='mt-2'>{message}</div>
          </div>
        )}

        {message && !error && (
          <div className='mb-3 rounded-md bg-slate-50 text-slate-700 px-3 py-2 text-sm ring-1 ring-slate-200'>
            {message}
          </div>
        )}

        {/* Ligne TX + Status rapprochés */}
        {(code_info?.tx_hash || code_info?.status) && (
          <div className='flex flex-wrap items-center gap-2 mb-3'>
            {code_info?.tx_hash && (
              <a
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:underline text-sm'
                href={
                  network.explorerAddress + '/transactions/' + code_info.tx_hash
                }
                title='View on explorer'
              >
                {shortenString(code_info.tx_hash, 14)}
              </a>
            )}

            {code_info?.status && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  statusStyles[code_info.status.toLowerCase()] ??
                  'bg-slate-100 text-slate-700'
                }`}
              >
                {code_info.status.charAt(0).toUpperCase() +
                  code_info.status.slice(1)}
              </span>
            )}
          </div>
        )}

        {/* Collection : une seule fois */}
        {code_info?.collection && (
          <div className='mb-3'>
            <span className='inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-medium'>
              {code_info.collection}-
              {bigNumToHex(new BigNumber(code_info.nonce))}
            </span>
          </div>
        )}

        {/* Aperçu NFT */}
        {code_info?.nonce ? (
          <div className='mt-2'>
            <div className='rounded-lg border border-slate-200 p-3 bg-slate-50'>
              <div className='aspect-square w-44 overflow-hidden rounded-md mx-auto'>
                <FileDisplay
                  source={
                    nft_information?.media?.length
                      ? nft_information?.media[0]?.url
                      : notFound
                  }
                  fileType={
                    nft_information?.media?.length
                      ? nft_information?.media[0]?.fileType
                      : ''
                  }
                  width='176px'
                  height='176px'
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* CTA consume */}
        {code_info?.status === 'reserved' && (
          <div className='mt-4 flex justify-center'>
            <Button
              className='dinoButton'
              onClick={handleConsume}
              disabled={isConsuming}
            >
              {isConsuming ? 'Collecting…' : 'Collect item'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
