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

const parser = new UAParser();
const result = parser.getResult();
const deviceType = result.device.type;
type CodeWithCampaign = {
  id: string;
  status: string;
  tx_hash: string;
  updated_at: string;
  claimed_at: string | null;
  campaign: Campaign;
};
type Campaign = {
  id: string;
  collection: string;
  nonce: string;
  network: string;
  start_at: string;
  end_at: string;
  status: string;
};
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
      if (data.data.campaign) setCodeWithCampaign(data.data);
      if (data.error) setError(data.error);
      if (data.message) setMessage(data.message);
    } catch (err: any) {
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
    code_info?.campaign?.collection ? code_info?.campaign?.collection : '',
    code_info?.campaign?.nonce ? code_info?.campaign?.nonce : ''
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
    <div className='flex flex-col gap-6'>
      CODE SUBMITED
      <div className='flex flex-col w-[calc(100%-50px)] spec-result'>
        <div>
          {error && <div className='text-red-500'>Error: {error}</div>}
          {message && <div>{message}</div>}
          {code_info?.status && (
            <div>
              Status:{' '}
              {code_info?.status
                ? code_info.status.charAt(0).toUpperCase() +
                  code_info.status.slice(1)
                : ''}
            </div>
          )}
          {code_info?.campaign?.collection && (
            <div>Collection: {code_info.campaign.collection}</div>
          )}
          {code_info?.campaign?.nonce ? (
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
              width='168px'
              height='168px'
            />
          ) : (
            <></>
            // <FileDisplay
            //   source={
            //     prize_esdt_information?.assets?.svgUrl
            //       ? prize_esdt_information?.assets?.svgUrl
            //       : prize_esdt_information?.media?.length
            //       ? prize_esdt_information?.media[0]?.svgUrl
            //       : notFound
            //   }
            //   fileType={
            //     prize_esdt_information?.media?.length
            //       ? prize_esdt_information?.media[0]?.fileType
            //       : ''
            //   }
            //   width='168px'
            //   height='168px'
            // />
          )}
          {code_info && code_info?.tx_hash != '' && (
            <a
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center text-sm hover:underline'
              href={
                network.explorerAddress + '/transactions/' + code_info?.tx_hash
              }
            >
              {shortenString(code_info.tx_hash, 14)}
            </a>
          )}
          {code_info?.status === 'reserved' && (
            <div>
              <Button
                className='dinoButton'
                onClick={handleConsume}
                disabled={isConsuming}
              >
                {isConsuming ? 'Consuming...' : 'Consume'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
