import React from 'react';
import { QRCode, Button } from 'antd';

type AntdDinoQrDownloadProps = {
  value: string;
  filename?: string;
  size?: number;
  iconSrc?: string;
};

export const AntdDinoQrDownload: React.FC<AntdDinoQrDownloadProps> = ({
  value,
  filename = value.split('/').pop() + '.png' || 'qrcode.png',
  size = 160,
  iconSrc = '/assets/dino-icon.svg'
}) => {
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div ref={wrapRef} className='inline-flex flex-col items-center gap-2'>
      <QRCode
        value={value}
        type='canvas' // requis pour toDataURL()
        size={size}
        errorLevel='H'
        bordered={false}
        icon={iconSrc}
        iconSize={Math.round(size * 0.2)}
      />
      <Button size='small' onClick={handleDownload}>
        Download PNG
      </Button>
    </div>
  );
};
