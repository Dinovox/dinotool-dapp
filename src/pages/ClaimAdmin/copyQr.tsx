import React, { useMemo, useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';

interface ToQrCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
}

export const ToQrCode: React.FC<ToQrCodeProps> = ({
  value,
  size = 128,
  level = 'M'
}) => <QRCodeCanvas value={value} size={size} level={level} />;

interface QRCodeComponentProps {
  code: string;
  amount: number;
}

export const QRCodeComponent: React.FC<QRCodeComponentProps> = ({
  code,
  amount
}: any) => {
  // const urlx = "https://poxp.xyz/claim/GRAOUTNTV";
  const url = 'https://app.dinovox.com/claim/' + code;
  const urlParts = url.split('/claim/');
  const domain = urlParts[0].replace('https://', '');
  const id = urlParts[1];
  const url_with_style = url + '?s=graou';
  const getRandomUrl = () => {
    const urls = ['https://xport.al/referral/nggqcqggkm'];

    // "https://xport.al/referral/dzoz3ley12",
    // "https://xport.al/referral/sg8vd5ou3j",
    // Return a random URL from the array
    return urls[Math.floor(Math.random() * urls.length)];
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column', // Assure que les éléments enfants sont empilés verticalement
          alignItems: 'center',
          height: '500px',
          backgroundColor: '#f5f5f5',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div
          style={{
            textAlign: 'center',
            border: '1px solid #ddd',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '200px', // Ajuster la largeur pour un QR code plus petit
            transform: 'rotate(180deg)', // Rotation de 180 degrés pour retourner la carte
            height: '250px',
            backgroundColor: 'white'
          }}
        >
          <p style={{ marginTop: '-4px', wordBreak: 'break-all' }}>Claim NFT</p>
          1 - Get xPortal
          <QRCodeCanvas value={getRandomUrl()} size={80} />
          <p
            style={{
              textAlign: 'center',
              padding: '0 20px',
              marginTop: '-20px'
            }}
          >
            <br /> 2 - Visit app.dinovox.com
            <br /> 3 - Connect with xPortal wallet <br />
            {/* Réduire la taille du QR code */}4 - Scan the code
          </p>
        </div>
        <div
          style={{
            textAlign: 'center',
            border: '1px solid #ddd',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '200px', // Ajuster la largeur pour un QR code plus petit
            height: '250px',
            backgroundColor: 'white'
          }}
        >
          {' '}
          <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>{domain}</p>
          <QRCodeCanvas value={url_with_style} size={100} />{' '}
          <p style={{ marginTop: '5px', wordBreak: 'break-all' }}>{id}</p>
          {/* Réduire la taille du QR code */}
          <p style={{ marginTop: '5px', color: '#555' }}>
            {amount > 1 ? (
              <>Each code can be claimed up to {amount} times.</>
            ) : (
              <>
                Code can be <br />
                claimed once.
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
};

type PrintQRCardsProps = {
  items: QRItem[];
  columns?: number; // nb de colonnes (ex: 3)
  gapMm?: number; // espacement entre cartes (mm)
  cardWmm?: number; // largeur carte (mm)
  cardHmm?: number; // hauteur carte (mm)
  showHeader?: boolean; // afficher titre + bouton print
  claimBaseUrl?: string; // ex: https://app.dinovox.com/claim/
};

type QRItem = {
  code: string;
  amount: number;
  styleParam?: string; // ex: s=graou
};

type PrintQRCardsIsolatedProps = {
  items: QRItem[];
  claimBaseUrl?: string; // défaut: https://app.dinovox.com/claim/
  columns?: number; // nb de colonnes (ex: 3)
  gapMm?: number; // écart entre cartes (mm)
  cardWmm?: number; // largeur carte (mm)
  cardHmm?: number; // hauteur carte (mm)
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  pageMarginMm?: number; // marges de page (mm)
  previewHeader?: boolean; // afficher le header/bouton dans ta page
  title?: string; // titre (pour la fenêtre d’impression)
};

function printHtmlIsolated(html: string, css: string, title = 'Print') {
  // crée un iframe caché
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title.replace(
    /[&<>"']/g,
    (s) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        s
      ]!
  )}</title>
  <style>${css}</style>
</head>
<body>${html}</body>
</html>`);
  doc.close();

  const waitReady = async () => {
    // attends les polices et les images
    try {
      await (doc as any).fonts?.ready;
    } catch {}
    const imgs = Array.from(doc.images);
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((res) => {
            if (img.complete) return res();
            img.onload = () => res();
            img.onerror = () => res();
          })
      )
    );
  };

  const doPrint = async () => {
    await waitReady();
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    // retire l’iframe après un petit délai (la boîte de dialogue utilise la fenêtre)
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  if (doc.readyState === 'complete') doPrint();
  else iframe.onload = () => doPrint();
}

export const PrintQRCardsIsolated: React.FC<{
  items: { code: string; amount: number; styleParam?: string }[];
  claimBaseUrl?: string;
  columns?: number;
  gapMm?: number;
  cardWmm?: number;
  cardHmm?: number;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  pageMarginMm?: number;
  title?: string;
}> = ({
  items,
  claimBaseUrl = 'https://app.dinovox.com/claim/',
  columns = 3,
  gapMm = 6,
  cardWmm = 62,
  cardHmm = 90,
  pageSize = 'A4',
  orientation = 'portrait',
  pageMarginMm = 12,
  title = 'Dinovox QR Codes'
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const css = useMemo(
    () => `
    @page { size: ${pageSize} ${orientation}; margin: ${pageMarginMm}mm; }
    html, body { padding:0; margin:0; -webkit-print-color-adjust: exact; print-color-adjust: exact;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial; }
    .qr-grid { display:grid; grid-template-columns: repeat(${columns}, ${cardWmm}mm); gap:${gapMm}mm; justify-content:start; }
    .qr-card { width:${cardWmm}mm; height:${cardHmm}mm; border:0.3mm solid #ddd; border-radius:3mm;
      background:#fff; box-shadow:0 1mm 3mm rgba(0,0,0,.06); display:flex; flex-direction:column; align-items:center;
      padding:6mm 5mm; page-break-inside:avoid; break-inside:avoid; }
    .qr-title { font-weight:700; font-size:12pt; margin:0 0 2mm; text-align:center; }
    .qr-sub { font-size:9pt; color:#444; margin:0 0 3mm; text-align:center; word-break:break-all; }
    .qr-meta { font-size:9pt; color:#555; text-align:center; margin-top:3mm; }
    .qr-steps { font-size:8pt; color:#444; text-align:center; line-height:1.25; margin-top:3mm; white-space:pre-line; }
  `,
    [columns, cardWmm, cardHmm, gapMm, pageSize, orientation, pageMarginMm]
  );

  const handlePrint = () => {
    if (!ref.current) return;
    // clone strict de la zone (le SVG se clone très bien)
    const html = ref.current.outerHTML;
    printHtmlIsolated(html, css, title);
  };

  return (
    <div>
      <div
        className='no-print'
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}
      >
        <h2 style={{ margin: 0 }}>{title}</h2>
        <button
          onClick={handlePrint}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #ccc',
            cursor: 'pointer'
          }}
        >
          🖨️ Print these only
        </button>
      </div>

      <div ref={ref}>
        <div className='qr-grid'>
          {items.map((it, idx) => {
            const url = `${claimBaseUrl}${it.code}`;
            const urlWithStyle = it.styleParam
              ? `${url}?${it.styleParam}`
              : url;
            const host =
              url.replace(/^https?:\/\//, '').split('/')[0] ||
              'app.dinovox.com';
            const id = url.split('/claim/')[1] || it.code;

            return (
              <div className='qr-card' key={`${it.code}-${idx}`}>
                <div className='qr-title'>{host}</div>
                <div className='qr-sub'>{id}</div>
                <QRCodeSVG value={urlWithStyle} size={140} level='M' />
                <div className='qr-meta'>
                  {it.amount > 1
                    ? `Each code can be claimed up to ${it.amount} times.`
                    : 'Code can be claimed once.'}
                </div>
                <div className='qr-steps'>{`1) Visit app.dinovox.com/claim
2) Connect with xPortal
3) Scan this code`}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
