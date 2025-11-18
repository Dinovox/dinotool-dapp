import React from 'react';
import { QRCode, Button } from 'antd';

type DinoQrProProps = {
  value: string;
  size?: number; // taille visuelle (px)
  iconSrc?: string; // logo centré
  iconRatio?: number; // 0.15–0.25 recommandé
  quietZone?: number; // marge blanche autour (px)
  plate?: boolean; // plaque blanche sous le logo
  plateRadius?: number; // arrondi de la plaque
  plateBorder?: string; // ex: '1px solid rgba(0,0,0,0.08)'
  type?: 'canvas' | 'svg'; // canvas pour export PNG
  showDownload?: boolean; // bouton download
  filename?: string; // nom du fichier export
  retinaScale?: number; // facteur d’export PNG (2–3)
  className?: string;
};

const DinoQrPro: React.FC<DinoQrProProps> = ({
  value,
  size = 192,
  iconSrc = '/assets/img/qr-dino-tr.png',
  iconRatio = 0.2,
  quietZone = 16,
  plate = true,
  plateRadius = 10,
  plateBorder = '1px solid rgba(0,0,0,0.08)',
  type = 'canvas',
  showDownload = false,
  filename = value.split('/').pop() + '.png' || 'qrcode.png',
  retinaScale = 3,
  className
}) => {
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const iconSize = Math.round(size * Math.max(0.12, Math.min(iconRatio, 0.28)));
  const platePad = Math.round(size * 0.02);

  const handleDownload = () => {
    if (type !== 'canvas') return;
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;

    // Export HD : redessine sur un canvas hors écran à échelle supérieure
    const exportSize = size * retinaScale;
    const out = document.createElement('canvas');
    out.width = exportSize;
    out.height = exportSize;
    const ctx = out.getContext('2d');
    if (!ctx) return;

    // peindre fond blanc
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportSize, exportSize);

    // dessiner le QR (source canvas) en HD
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, exportSize, exportSize);

    // plaque blanche (si activée)
    if (plate) {
      const px = iconSize * retinaScale;
      const pad = platePad * retinaScale;
      const w = px + pad * 2;
      const h = px + pad * 2;
      const x = exportSize / 2 - w / 2;
      const y = exportSize / 2 - h / 2;

      // arrondi
      const r = plateRadius * retinaScale;
      ctx.save();
      ctx.beginPath();
      const rr = (
        xx: number,
        yy: number,
        ww: number,
        hh: number,
        rr: number
      ) => {
        const r2 = Math.min(rr, ww / 2, hh / 2);
        ctx.moveTo(xx + r2, yy);
        ctx.arcTo(xx + ww, yy, xx + ww, yy + hh, r2);
        ctx.arcTo(xx + ww, yy + hh, xx, yy + hh, r2);
        ctx.arcTo(xx, yy + hh, xx, yy, r2);
        ctx.arcTo(xx, yy, xx + ww, yy, r2);
      };
      rr(x, y, w, h, r);
      ctx.clip();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x, y, w, h);
      ctx.restore();

      // bord fin
      if (plateBorder) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = Math.max(1, Math.round(retinaScale)); // 1px @1x
        ctx.beginPath();
        rr(
          x + ctx.lineWidth / 2,
          y + ctx.lineWidth / 2,
          w - ctx.lineWidth,
          h - ctx.lineWidth,
          r
        );
        ctx.stroke();
        ctx.restore();
      }
    }

    // dessiner le logo (si présent)
    if (iconSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const px = iconSize * retinaScale;
        const x = exportSize / 2 - px / 2;
        const y = exportSize / 2 - px / 2;
        ctx.drawImage(img, x, y, px, px);

        const url = out.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      };
      img.src = iconSrc;
    } else {
      const url = out.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  return (
    <div className={className}>
      {/* Quiet zone via padding + fond blanc */}
      <div
        ref={wrapRef}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          background: '#fff',
          padding: quietZone,
          borderRadius: 12
        }}
      >
        {/* Pile QR + plaque + logo */}
        <div style={{ position: 'relative', width: size, height: size }}>
          <QRCode
            value={value}
            type={type}
            size={size}
            errorLevel='H'
            bordered={false}
            // On laisse antd dessiner le QR brut (contraste max)
            // On superpose plaque + logo nous-mêmes pour un rendu constant
          />

          {plate && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: iconSize + platePad * 2,
                height: iconSize + platePad * 2,
                transform: 'translate(-50%, -50%)',
                background: '#fff',
                borderRadius: plateRadius,
                border: plateBorder,
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
                width: iconSize,
                height: iconSize,
                transform: 'translate(-50%, -50%)',
                objectFit: 'contain',
                pointerEvents: 'none'
              }}
            />
          )}
        </div>

        {showDownload && type === 'canvas' && (
          <Button size='small' onClick={handleDownload}>
            Download PNG
          </Button>
        )}
      </div>
    </div>
  );
};

export default DinoQrPro;
