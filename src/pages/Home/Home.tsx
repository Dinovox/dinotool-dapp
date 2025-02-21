import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './NavigationCards.css';
import hello from '../../assets/img/hello.webp';
import navMain from '../../assets/img/navMain.webp';
import dinogazette from '../../assets/img/sold_graout.jpg';
import drop from '../../assets/img/drop.png';
import { environment } from 'config';

export const Home = () => {
  const [displayText, setDisplayText] = useState('🦖');
  const [isShaking, setIsShaking] = useState(false);

  const fullText = '🦖 . . . #GRAOU!';
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  // Images are 210px 150px
  const navItems = [
    {
      title: 'Main website',
      link: 'https://www.dinovox.com/fr',
      image: navMain,
      external: true
    },
    {
      title: 'Dinogazette',
      link: '/mint',
      image: dinogazette
    },
    {
      title: 'Lotteries',
      link: '/lotteries',
      image: hello,
      blured: environment === 'mainnet'
    },
    {
      title: 'Drop',
      link: '/drop',
      image: drop
    }
  ];

  // useEffect(() => {
  //   const characters = Array.from(fullText); //array for emoji..
  //   let index = 0;

  //   const interval = setInterval(() => {
  //     if (index < characters.length) {
  //       setDisplayText(characters.slice(0, index + 1).join(''));
  //       index++;
  //     } else {
  //       index = 0;
  //       setDisplayText('🦖');
  //     }
  //   }, 300);
  //   return () => clearInterval(interval);
  // }, []);

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
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
};
