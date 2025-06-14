import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './NavigationCards.css';
const cardMain = '/cards/main.png';
const cardGazette = '/cards/gazette.png';
const cardLotteries = '/cards/lotteries.png';
const cardDrop = '/cards/drop.png';
const cardFeedback = '/cards/feedback.png';
const cardWip = '/cards/wip.png';
const cardSoldGraout = '/cards/sold.png';

import { useTranslation } from 'react-i18next';
import useLoadTranslations from '../../hooks/useLoadTranslations';

import { environment } from 'config';
import { useGetMintable } from 'pages/Dashboard/widgets/MintGazAbi/hooks';
import BigNumber from 'bignumber.js';
import { ActionCreateSFT } from '../../helpers/actions/ActionCreateSFT';
export const Home = () => {
  const loading = useLoadTranslations('home');
  const { t } = useTranslation();

  const [displayText, setDisplayText] = useState('🦖');
  const [isShaking, setIsShaking] = useState(false);
  const mintable = useGetMintable();
  const fullText = '🦖 . . . #GRAOU!';

  // Images are 210px 150px
  const navItems = [
    {
      title: t('home:main_title'),
      link: 'https://www.dinovox.com/fr',
      image: cardMain,
      external: true
    },
    {
      title: 'Dinogazette',
      link: '/mint',
      image: mintable?.amount.isGreaterThan(0) ? cardGazette : cardSoldGraout
    },
    {
      title: t('home:lotteries_title'),
      link: '/lotteries',
      image: cardLotteries
    },
    {
      title: t('home:drop'),
      link: '/drop',
      image: cardDrop
    },
    {
      title: t('home:feedback_title'),
      link: 'https://docs.google.com/forms/d/e/1FAIpQLSc1PKfBjGfBSl1pyiSBckAos9xHPOOy1cYEgeLZGR6Ws1923Q/viewform',
      image: cardFeedback,
      external: true
    },
    {
      title: t('home:collections_title'),
      link: '/collections',
      image: cardWip,
      blured: environment == 'devnet' ? false : true
    },
    {
      title: 'Soon',
      link: '/chests',
      image: cardWip,
      blured: true
    }
  ];

  useEffect(() => {
    const characters = Array.from(fullText);
    let index = 0;

    const interval = setInterval(() => {
      if (index < characters.length) {
        randomizeImage();
        setDisplayText(characters.slice(0, index + 1).join(''));
        index++;
      } else {
        // Déclencher l'effet de vibration
        setIsShaking(true);

        setTimeout(() => {
          setIsShaking(false);
          setDisplayText('🦖');
          index = 0;
        }, 2000); // Vibre pendant 2 secondes
      }
    }, 400); //vitesse  de l'animation

    return () => clearInterval(interval);
  }, [fullText]);

  const getRandomFilter = () => {
    const brightness = (Math.random() * 0.6 + 0.7).toFixed(2); // 0.7 à 1.3
    const contrast = (Math.random() * 0.6 + 0.7).toFixed(2);
    const hueRotate = Math.floor(Math.random() * 360); // Rotation des couleurs
    const blur = Math.random() > 0.8 ? '2px' : '0px'; // 20% de chances d'ajouter un flou
    return `brightness(${brightness}) contrast(${contrast}) hue-rotate(${hueRotate}deg) blur(${blur})`;
  };

  const getRandomTransform = () => {
    const rotate = Math.random() * 20 - 10; // Rotation entre -10 et 10 degrés
    const scale = (Math.random() * 0.3 + 0.85).toFixed(2); // Zoom entre 0.85 et 1.15
    return `rotate(${rotate}deg) scale(${scale})`;
  };

  const [filter, setFilter] = useState(getRandomFilter());
  const [transform, setTransform] = useState(getRandomTransform());

  const randomizeImage = () => {
    setFilter(getRandomFilter());
    setTransform(getRandomTransform());
  };
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <AuthRedirectWrapper requireAuth={false}>
      <PageWrapper>
        <div className='dinocard-wrapper  rounded-xl bg-white flex-col-reverse sm:flex-row items-center h-full w-full'>
          <div className='navigation-cards '>
            {navItems.map((item, index) => (
              <div
                className={`nav-card ${item.blured ? 'blured' : ''}`}
                key={index}
              >
                {item.external ? (
                  <a href={item.link} target='_blank' rel='noopener noreferrer'>
                    <div className='nav-card-content'>
                      <img src={item.image} alt={item.title} />
                      <h3>{item.title}</h3>
                    </div>
                  </a>
                ) : (
                  <Link
                    onClick={item.blured ? randomizeImage : undefined}
                    to={item.blured ? '' : item.link}
                  >
                    <div className='nav-card-content'>
                      <img
                        src={item.image}
                        alt={item.title}
                        style={{
                          transition: item?.blured
                            ? '0.5s ease-in-out'
                            : 'none',
                          filter: item.blured ? filter : 'none',
                          transform: item.blured ? transform : 'none'
                        }}
                      />
                      <h3>
                        {item.blured
                          ? item.title
                              .split('')
                              .sort(() => 0.5 - Math.random())
                              .join('')
                          : item.title}
                      </h3>
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
          <div className='mintGazTitle dinoTitle' style={{ width: '340px' }}>
            <a
              href='https://x.com/search?q=%23GRAOU&src=typed_query'
              target='_blank'
              rel='noopener noreferrer'
            >
              <div className={`text-container ${isShaking ? 'shake' : ''}`}>
                {displayText}
              </div>{' '}
            </a>
          </div>
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
