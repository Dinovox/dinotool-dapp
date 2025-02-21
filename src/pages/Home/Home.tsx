import { AuthRedirectWrapper, PageWrapper } from 'wrappers';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './NavigationCards.css';
import lotterie from '../../assets/img/lotterie.webp';
import navMain from '../../assets/img/navMain.webp';
import dinogazette from '../../assets/img/sold_graout.jpg';
import drop from '../../assets/img/drop.png';
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
      image: lotterie
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

          <div className='navigation-cards'>
            {navItems.map((item, index) => (
              <div className='nav-card' key={index}>
                {item.external ? (
                  <a href={item.link} target='_blank' rel='noopener noreferrer'>
                    <div className='nav-card-content'>
                      <img src={item.image} alt={item.title} />
                      <h3>{item.title}</h3>
                    </div>
                  </a>
                ) : (
                  <Link to={item.link}>
                    <div className='nav-card-content'>
                      <img src={item.image} alt={item.title} />
                      <h3>{item.title}</h3>
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
