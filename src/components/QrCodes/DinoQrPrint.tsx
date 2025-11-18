import React from 'react';
import { QRCode } from 'antd';

type DinoQrPrintProps = {
  value: string;
  size?: number;
  iconSrc?: string;
  iconRatio?: number;
  quietZone?: number;
  className?: string;
};

export const DinoQrPrint: React.FC<DinoQrPrintProps> = ({
  value,
  size = 160,
  iconSrc = '/assets/img/dino-icon-tr.png',
  iconRatio = 0.2,
  quietZone = 4,
  className
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'inline-block',
        background: '#fff',
        padding: quietZone,
        borderRadius: 6
      }}
    >
      <QRCode
        value={value}
        type='svg' // ✅ SVG = vectoriel, net à l'impression
        size={size}
        errorLevel='H'
        bordered={false}
        icon={iconSrc}
        iconSize={Math.round(size * iconRatio)}
      />
    </div>
  );
};

export default DinoQrPrint;
