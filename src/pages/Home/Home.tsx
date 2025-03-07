import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './NavigationCards.css';
import cardMain from '../../assets/cards/main.png';
import cardGazette from '../../assets/cards/gazette.png';
import cardLotteries from '../../assets/cards/Lotteries.png';
import cardDrop from '../../assets/cards/drop.png';
import cardFeedback from '../../assets/cards/feedback.png';
import cardWip from '../../assets/cards/wip.png';
import cardSoldGraout from '../../assets/cards/sold.png';

import lotterie from '../../assets/img/lotterie.webp';
import navMain from '../../assets/img/dinoMain.png';
import mintLive from '../../assets/img//dinoGaz.jpeg';
import soldGraout from '../../assets/img/sold_graout.jpg';
import random from '../../assets/img/random.png';
import chest from '../../assets/img/chest.png';
import drop from '../../assets/img/drop.png';

import { environment } from 'config';
import { useGetMintable } from 'pages/Dashboard/widgets/MintGazAbi/hooks';
import BigNumber from 'bignumber.js';

export const Home = () => {
  const [displayText, setDisplayText] = useState('🦖');
  const [isShaking, setIsShaking] = useState(false);
  const mintable = useGetMintable();

  console.log('mintable:', mintable);
  const fullText = '🦖 . . . #GRAOU!';

  // Images are 210px 150px
  const navItems = [
    {
      title: 'Main website',
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
      title: environment === 'mainnet' ? 'Soon' : 'Lotteries',
      link: '/lotteries',
      image: environment === 'mainnet' ? cardWip : cardLotteries,
      blured: environment === 'mainnet'
    },
    {
      title: 'Drop',
      link: '/drop',
      image: cardDrop
    },
    {
      title: 'Soon',
      link: '/chests',
      image: cardWip,
      blured: true
    },
    {
      title: 'Feedback',
      link: 'https://dinovox.com/feedback',
      image: cardFeedback,
      external: true
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
