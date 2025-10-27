import React, { useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { dino_claim_url } from 'config';

const THEME = {
  aquaLight: '#CFF4F6',
  aqua: '#A6E7EB',
  textDark: '#1F3A3D',
  badgeBg: 'rgba(255,255,255,.75)',
  innerStroke: 'rgba(255,255,255,.65)',
  accentYellow: '#FFE762',
  borderBack: '#D9F0F2'
};

type QRItem = { code: string; amount: number; styleParam?: string };

type Props = {
  items: QRItem[];
  claimBaseUrl?: string;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;
  gapMm?: number; // écart entre *paires*
  foldGapMm?: number; // espace entre recto et verso (ligne de pli)
};

export const PrettyQRCardsPrintFold: React.FC<Props> = ({
  items,
  claimBaseUrl = dino_claim_url,
  pageSize = 'A4',
  orientation = 'portrait',
  marginMm = 7,
  gapMm = 3,
  foldGapMm = 2 // petit espace pour le pli
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [withBack, setWithBack] = React.useState(true);
  // const [filterStatus, setFilterStatus] = React.useState(true);

  // const filtered_items = filterStatus
  //   ? items.filter((c: any) => c.status === 'open')
  //   : items;

  // --- layout page & grille (carte FIXE 50×65 mm) ---
  const layout = useMemo(() => {
    const map = { A4: { w: 210, h: 297 }, Letter: { w: 216, h: 279 } };
    const base = map[pageSize];
    const isLandscape = orientation === 'landscape';
    const w = isLandscape ? base.h : base.w;
    const h = isLandscape ? base.w : base.h;
    const innerW = w - 2 * marginMm;
    const innerH = h - 2 * marginMm;

    const cardW = 50; // 5 cm
    const cardH = 65; // 6.5 cm (un peu plus haut pour respirer)

    // Une *paire* = recto + foldGap + verso => hauteur slot
    const pairH = cardH * 2 + foldGapMm;

    const cols = Math.max(1, Math.floor((innerW + gapMm) / (cardW + gapMm)));
    const rows = withBack
      ? Math.max(1, Math.floor((innerH + gapMm) / (pairH + gapMm)))
      : Math.max(1, Math.floor((innerH + gapMm) / (cardH + gapMm)));
    const perPage = cols * rows;

    return { w, h, innerW, innerH, cols, rows, perPage, cardW, cardH, pairH };
  }, [
    pageSize,
    orientation,
    marginMm,
    gapMm,
    foldGapMm,
    withBack
    // filterStatus
  ]);

  // util mm → px (≈ 96dpi)
  const mm2px = (mm: number) => Math.round(mm * 3.78);
  const qrSizePx = mm2px(30); // QR de 30 mm carré

  const css = useMemo(
    () => `
    @page { size: ${pageSize} ${orientation}; margin: ${marginMm}mm; }
    html, body {
      padding:0; margin:0;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
      font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
    }

    .sheet { width:${
      layout.innerW
    }mm; margin:0 auto; page-break-after: always; }

    /* Grille de PAIRES (chaque cellule contient recto+pli+verso) */
    .grid {
      display:grid;
      grid-template-columns: repeat(${layout.cols}, ${layout.cardW}mm);
      grid-template-rows: repeat(${layout.rows}, ${
        withBack ? layout.pairH : layout.cardH
      }mm);
      gap:${gapMm}mm;
      justify-content:start; align-content:start;
    }

    /* La paire verticalement : recto puis verso */
    .pair {
      width:${layout.cardW}mm; height:${
        withBack ? layout.pairH : layout.cardH
      }mm;
      display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
      page-break-inside:avoid; break-inside:avoid; box-sizing:border-box;
    }
    .fold-gap {
      height:${foldGapMm}mm; width:100%;
      border-top: 0.2mm dashed #c8dadd;  /* marque de pliage discrète */
      border-bottom: 0.2mm dashed #c8dadd;
      box-sizing:border-box;
      margin: 0.2mm 0;
    }

    .card, .back-card {
      width:${layout.cardW}mm; height:${layout.cardH}mm;
      border-radius:4mm; position:relative; overflow:hidden;
      display:flex; flex-direction:column; align-items:center;
      padding:3mm 3mm 2.5mm; box-sizing:border-box;
    }

    /* --- RECTO --- */
    .card {
      background: linear-gradient(180deg, ${THEME.aquaLight} 0%, ${
        THEME.aqua
      } 100%);
      box-shadow: 0 1mm 3mm rgba(0,0,0,.10);
    }
    .card::after {
      content:''; position:absolute; inset:1.2mm;
      border:0.5mm solid ${
        THEME.innerStroke
      }; border-radius:3mm; pointer-events:none;
    }

    .tape {
      background: ${THEME.accentYellow};
      color: ${THEME.textDark};
      font-weight: 800;
      font-size: 9pt;
      letter-spacing: .2px;
      padding: 1mm 3mm;
      border-radius: 1mm;
      box-shadow: 0 .6mm 1.8mm rgba(0,0,0,.08);
      transform: rotate(-1.5deg);
      margin-bottom: 2mm; /* espace sous le bandeau */
    }

    .qr-wrap { background:#fff; border-radius:2mm; padding:1.2mm; box-shadow:0 .6mm 2mm rgba(0,0,0,.06); }
    .code-badge {
      margin: 1.6mm 0 1.2mm;
      font-weight:800; font-size:10pt; color:${THEME.textDark};
      background: ${THEME.badgeBg}; padding: 1mm 2.4mm; border-radius: 1.8mm;
      text-align:center; word-break: break-all; max-width: 100%;
    }
    .meta {
      font-size:8.5pt; color:${THEME.textDark}; text-align:center;
      background: ${THEME.badgeBg}; padding:1mm 2mm; border-radius:1.6mm;
      max-width:100%;
    }

    /* --- VERSO --- */
    .back-card {
      background:#fff; border:0.4mm solid ${THEME.borderBack};
      transform: rotate(180deg); /* clé: verso retourné */
    }
    .back-title { font-weight:800; color:${
      THEME.textDark
    }; font-size:10pt; margin:0 0 2mm; text-align:center; }
    .back-qr-wrap { background:#fff; border:0.6mm dashed ${
      THEME.aqua
    }; border-radius:2mm; padding:0mm; }
    .back-steps { font-size:8.2pt; color:${
      THEME.textDark
    }; text-align:center; line-height:1.25; margin-top:0mm; white-space:pre-line; }

    @media print { .no-print { display:none !important; } .card { box-shadow:none; } }
  `,
    [pageSize, orientation, marginMm, gapMm, foldGapMm, layout]
  );

  // pagination par PAIRES
  const pages: QRItem[][] = [];
  for (let i = 0; i < items.length; i += layout.perPage) {
    pages.push(items.slice(i, i + layout.perPage));
  }

  const handlePrint = () => {
    if (!ref.current) return;
    printHtmlIsolated(ref.current.innerHTML, css);
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '12px',
            background: '#f8fafc',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}
        >
          <button
            onClick={handlePrint}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              background: '#fff',
              fontWeight: 500
            }}
          >
            🖨️ Imprimer
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <input
              id='print-instructions'
              type='checkbox'
              checked={withBack}
              onChange={() => setWithBack(!withBack)}
            />
            <label htmlFor='print-instructions' style={{ cursor: 'pointer' }}>
              Avec instructions au verso
            </label>
          </div>

          {/* <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <input
              id='filter-status'
              type='checkbox'
              checked={filterStatus}
              onChange={() => setFilterStatus(!filterStatus)}
            />
            <label htmlFor='filter-status' style={{ cursor: 'pointer' }}>
              Filtrer les codes consommés
            </label>
          </div> */}
        </div>
      </div>

      <div ref={ref} className='hidden'>
        {pages.map((slice, p) => (
          <div className='sheet' key={`page-${p}`}>
            <div className='grid'>
              {slice.map((it, idx) => {
                const url = `${claimBaseUrl}/${it.code}`;
                const urlWithStyle = it.styleParam
                  ? `${url}?${it.styleParam}`
                  : url;
                const host =
                  url.replace(/^https?:\/\//, '').split('/')[0] ||
                  'app.dinovox.com';
                const id = url.split('/claim/')[1] || it.code;
                const xPortalUrl = 'https://xport.al/referral/nggqcqggkm';

                return (
                  <div className='pair' key={`${it.code}-${idx}`}>
                    {/* RECTO */}
                    <div className='card'>
                      <div className='tape'>{host}</div>
                      <div className='qr-wrap'>
                        <QRCodeSVG
                          value={urlWithStyle}
                          size={qrSizePx}
                          level='M'
                        />
                      </div>
                      <div className='code-badge'>{id}</div>
                      <div className='meta'>
                        {it.amount > 1
                          ? `Chaque code peut être réclamé ${it.amount} fois.`
                          : 'Code utilisable une seule fois.'}
                      </div>
                    </div>

                    {/* ESPACE DE PLI */}
                    {withBack && <div className='fold-gap' />}

                    {/* VERSO (retourné) */}
                    {withBack && (
                      <div className='back-card'>
                        <div className='back-title'>Instructions</div>
                        <div className='back-qr-wrap'>
                          <QRCodeSVG
                            value={xPortalUrl}
                            size={qrSizePx}
                            level='M'
                          />
                        </div>
                        <div className='back-steps'>{`
                    1) Installez xPortal
                      2) Visitez app.dinovox.com
                      3) Connectez-vous via xPortal
                      4) Scannez le code`}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* Impression isolée via iframe (inchangé) */
function printHtmlIsolated(html: string, css: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const esc = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (m) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        })[m]!
    );

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>${css}</style>
</head>
<body>${html}</body>
</html>`);
  doc.close();

  const run = async () => {
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
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    setTimeout(() => document.body.removeChild(iframe), 1200);
  };
  if (doc.readyState === 'complete') run();
  else iframe.onload = () => run();
}
