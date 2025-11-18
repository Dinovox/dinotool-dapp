import React from 'react';
import { QRCodeSVG, QRCodeCanvas } from '@rc-component/qrcode';

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

type DinoQrCodeProps = {
  value: string;
  size?: number;
  level?: ErrorCorrectionLevel;
  bgColor?: string;
  fgColor?: string;
  includeMargin?: boolean;

  /** 'svg' (par défaut) ou 'canvas' */
  type?: 'svg' | 'canvas';

  /** Logo centré */
  iconSrc?: string;
  /** Taille du logo en ratio du QR (0.12–0.30 recommandé) */
  logoRatio?: number;
  /** Creuse une fenêtre blanche sous le logo */
  excavate?: boolean;
  /** Rayon d’arrondi de la fenêtre (px) */
  excavateRadius?: number;

  className?: string;
  style?: React.CSSProperties;
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

const DinoQrCode: React.FC<DinoQrCodeProps> = ({
  value,
  size = 160,
  level = 'H',
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  includeMargin = false,
  type = 'svg',
  iconSrc = '/svg/dino-icon.svg',
  logoRatio = 0.22,
  excavate = true,
  excavateRadius = 8,
  className,
  style
}) => {
  const ratio = clamp(logoRatio, 0.12, 0.3);
  const logoPx = Math.round(size * ratio);
  const pad = Math.round(size * 0.02);

  const QR = type === 'canvas' ? QRCodeCanvas : QRCodeSVG;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: size,
        height: size,
        ...style
      }}
    >
      <QR
        value={value}
        size={size}
        level={level}
        bgColor={bgColor}
        fgColor={fgColor}
        includeMargin={includeMargin}
      />

      {excavate && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: logoPx + pad * 2,
            height: logoPx + pad * 2,
            transform: 'translate(-50%, -50%)',
            background: bgColor,
            borderRadius: excavateRadius,
            pointerEvents: 'none'
          }}
        />
      )}

      {iconSrc && (
        <img
          src={iconSrc}
          alt=''
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: logoPx,
            height: logoPx,
            transform: 'translate(-50%, -50%)',
            objectFit: 'contain',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
};

export default DinoQrCode;
