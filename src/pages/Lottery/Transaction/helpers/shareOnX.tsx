import React from 'react';
import { useTranslation } from 'react-i18next';

interface TwitterShareButtonProps {
  lottery_id: number;
}

const TwitterShareButton: React.FC<TwitterShareButtonProps> = ({
  lottery_id
}) => {
  const { t } = useTranslation();
  // 🔹 Message personnalisé
  const text = encodeURIComponent(
    t('lotteries:share_on_x_text', { lottery_id })
  );
  const hashtags = encodeURIComponent('Lottery,Crypto,WinBig');
  const via = 'YourTwitterHandle'; // Remplace par ton compte Twitter

  const url = `https://app.dinovox.com/lotteries/${lottery_id}`;

  // 🔹 Construire l'URL de partage Twitter
  const twitterUrl = `https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(
    url
  )}&hashtags=${hashtags}&via=${via}`;

  return (
    <button
      onClick={() => window.open(twitterUrl, '_blank', 'noopener,noreferrer')}
      // href={twitterUrl}
      //   target='_blank'
      //   rel='noopener noreferrer'
      className='dinoButton'
      style={
        {
          // display: 'inline-flex',
          // alignItems: 'center',
          // gap: '8px',
          // textDecoration: 'none',
          // color: '#1DA1F2',
          // fontWeight: 'bold',
          // fontSize: '16px',
          // border: '1px solid #1DA1F2',
          // padding: '8px 12px',
          // borderRadius: '6px',
          // transition: 'background 0.3s ease'
        }
      }
    >
      {t('lotteries:share_on_x')}
    </button>
  );
};

export default TwitterShareButton;
