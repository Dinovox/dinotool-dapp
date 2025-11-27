import React from 'react';
import type { UserNft, NftMedia } from './useGetUserNft';
import { useGetNetworkConfig } from 'lib';

type DisplayNftProps = {
  nft: UserNft;
  /**
   * Quantité (pour SFT) – optionnelle.
   */
  amount?: string | number;
  /**
   * URL de base de l’explorer (ex: https://devnet-explorer.multiversx.com).
   * Si fourni, on affiche un lien vers la page NFT.
   */
  explorerBaseUrl?: string;
  /**
   * Classe CSS supplémentaire pour wrapper externe.
   */
  className?: string;
  /**
   * Affiche un petit badge (ex: "FREE", "LOCKED", etc.)
   */
  badgeLabel?: string;
  /**
   * Mode d'affichage: 'card' (défaut) ou 'media-only' (juste l'image/vidéo).
   */
  variant?: 'card' | 'media-only' | 'name-only';
};

const resolveIpfs = (uri: string): string => {
  if (uri.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`;
  }
  return uri;
};

const getPrimaryMedia = (nft: UserNft): NftMedia | null => {
  if (nft.media && nft.media.length > 0) {
    return nft.media[0];
  }

  if (nft.url) {
    return { url: resolveIpfs(nft.url) };
  }

  if (nft.uris && nft.uris.length > 0) {
    return { url: resolveIpfs(nft.uris[0]) };
  }

  return null;
};

const isVideo = (media: NftMedia | null): boolean => {
  if (!media) return false;
  const type = media.fileType?.toLowerCase() || '';
  if (type.startsWith('video/')) return true;

  const url = media.url.toLowerCase();
  return /\.(mp4|webm|ogg)$/i.test(url);
};

export const DisplayNft: React.FC<DisplayNftProps> = ({
  nft,
  amount,
  className = '',
  badgeLabel,
  variant = 'card'
}) => {
  const media = React.useMemo(() => getPrimaryMedia(nft), [nft]);
  const video = isVideo(media);
  const network = useGetNetworkConfig();

  const explorerUrl =
    network.network.explorerAddress && nft.identifier
      ? `${network.network.explorerAddress.replace(/\/$/, '')}/nfts/${
          nft.identifier
        }`
      : undefined;

  const MediaContent = (
    <>
      {badgeLabel && (
        <div className='absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs text-white'>
          {badgeLabel}
        </div>
      )}

      {media ? (
        video ? (
          <video
            key={media.url}
            className='h-full w-full object-cover'
            controls
            muted
            playsInline
            loop
            autoPlay
          >
            <source src={media.url} type={media.fileType || 'video/mp4'} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={media.thumbnailUrl || media.url}
            alt={nft.name || nft.identifier}
            className='h-full w-full object-cover'
          />
        )
      ) : (
        <div className='text-xs text-slate-500'>No media</div>
      )}
    </>
  );

  if (variant === 'media-only') {
    return (
      <div
        className={`relative overflow-hidden bg-slate-100 flex items-center justify-center ${className}`}
      >
        {MediaContent}
      </div>
    );
  }
  if (variant === 'name-only') {
    return <>{nft.name || 'Unnamed NFT'}</>;
  }

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm p-3 ${className}`}
    >
      <div className='relative overflow-hidden rounded-xl bg-slate-100 aspect-square flex items-center justify-center'>
        {MediaContent}
      </div>

      <div className='mt-3 space-y-1 text-sm'>
        <div className='font-semibold truncate'>
          {nft.name || 'Unnamed NFT'}
        </div>
        <div className='text-xs text-slate-500 truncate'>
          {nft.collection} • {nft.identifier}
        </div>

        {(amount || amount === 0) && (
          <div className='text-xs text-slate-600'>
            Amount: <span className='font-medium'>{amount}</span>
          </div>
        )}

        {explorerUrl && (
          <a
            href={explorerUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 text-xs text-blue-600 hover:underline'
          >
            View on explorer
          </a>
        )}
      </div>
    </div>
  );
};

export default DisplayNft;
