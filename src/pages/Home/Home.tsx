import { Outlet } from 'react-router-dom';
import { PageWrapper } from 'wrappers';
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

import { useGetAccount } from 'lib';

export const Home = () => {
  const loading = useLoadTranslations('home');
  const { t } = useTranslation();

  const [displayText, setDisplayText] = useState('🦖');
  const [isShaking, setIsShaking] = useState(false);
  const mintable = useGetMintable();
  const fullText = '🦖 . . . #GRAOU!';

  const { address } = useGetAccount();

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
      title: t('home:collections_title'),
      link: '/collections',
      image: cardWip
    },
    {
      title: t('home:feedback_title'),
      link: 'https://docs.google.com/forms/d/e/1FAIpQLSc1PKfBjGfBSl1pyiSBckAos9xHPOOy1cYEgeLZGR6Ws1923Q/viewform',
      image: cardFeedback,
      external: true
    },
    {
      title: 'NFT Locker',
      link: '/locker',
      image: cardWip,
      blured: environment == 'devnet' ? false : true
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
                    {' '}
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
                        transition: item?.blured ? '0.5s ease-in-out' : 'none',
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
        </div>{' '}
        <div className='mintGazTitle dinoTitle' style={{ width: '340px' }}>
          {' '}
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
        {/* <ActionESDTNFTTransfer
            receiver='erd1qqqqqqqqqqqqqpgq4jt6guxqpvurrkyhx99ung0dcvuxf9xccn0qt3af33'
            batch={[
              { collection: 'DINOCARDS-46ceea', nonce: 18, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 19, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 20, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 21, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 22, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 23, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 24, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 25, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 26, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 27, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 28, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 29, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 30, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 31, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 32, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 33, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 34, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 35, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 36, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 37, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 38, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 39, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 40, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 41, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 42, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 43, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 44, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 45, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 46, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 47, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 48, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 49, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 50, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 51, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 52, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 53, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 54, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 55, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 56, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 57, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 58, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 59, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 60, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 61, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 62, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 63, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 64, quantity: 40 },
              { collection: 'DINOCARDS-46ceea', nonce: 65, quantity: 38 },
              { collection: 'DINOCARDS-46ceea', nonce: 66, quantity: 38 },
              { collection: 'DINOCARDS-46ceea', nonce: 67, quantity: 38 },
              { collection: 'DINOCARDS-46ceea', nonce: 68, quantity: 38 },
              { collection: 'DINOCARDS-46ceea', nonce: 69, quantity: 38 },
              { collection: 'DINOCARDS-46ceea', nonce: 70, quantity: 28 },
              { collection: 'DINOCARDS-46ceea', nonce: 71, quantity: 38 }
            ]}
          /> */}
        {/* {[
            'erd1yfxtk0s7eu9eq8zzwsvgsnuq85xrj0yysjhsp28tc2ldrps25mwqztxgph',
            'erd10p0ke87tg4g2wnpah6ngmqmmlv604avfqwrlw7f3a7xpl8p3ugws7t3828'
          ].includes(address) && (
            <ActionMultiESDTNFTTransfer
              receiver='erd1qqqqqqqqqqqqqpgqsn6kmkhfkcldc0h3p7slc3chxy30n4pzuzesp9g6rp'
              batch={[
                { collection: 'DINOCARDS-46ceea', nonce: 18, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 19, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 20, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 21, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 22, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 23, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 24, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 25, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 26, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 27, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 28, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 29, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 30, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 31, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 32, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 33, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 34, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 35, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 36, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 37, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 38, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 39, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 40, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 41, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 42, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 43, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 44, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 45, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 46, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 47, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 48, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 49, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 50, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 51, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 52, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 53, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 54, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 55, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 56, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 57, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 58, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 59, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 60, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 61, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 62, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 63, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 64, quantity: 40 },
                { collection: 'DINOCARDS-46ceea', nonce: 65, quantity: 38 },
                { collection: 'DINOCARDS-46ceea', nonce: 66, quantity: 38 },
                { collection: 'DINOCARDS-46ceea', nonce: 67, quantity: 38 },
                { collection: 'DINOCARDS-46ceea', nonce: 68, quantity: 38 },
                { collection: 'DINOCARDS-46ceea', nonce: 69, quantity: 38 },
                { collection: 'DINOCARDS-46ceea', nonce: 70, quantity: 28 },
                { collection: 'DINOCARDS-46ceea', nonce: 71, quantity: 38 }
              ]}
              method='addCards'
            />
          )} */}
        <Outlet />
      </div>
    </PageWrapper>
  );
};
