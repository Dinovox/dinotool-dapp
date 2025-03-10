import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import ShortenedAddress from 'helpers/shortenedAddress';
import './LotteryWinnerAnimation.css'; // Utiliser le même fichier CSS mis à jour
import useLoadTranslations from 'hooks/useLoadTranslations';
import { useTranslation } from 'react-i18next';

const LotteryWinner = ({ lottery }: any) => {
  const loading = useLoadTranslations('lotteries');
  const { t } = useTranslation();

  const [currentWinner, setCurrentWinner] = useState(
    lottery.winner ||
      'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu'
  );
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (lottery.winner_id > 0) {
      setCurrentWinner(lottery.winner);
      setShowConfetti(true);
    }
  }, [currentWinner, lottery]);

  // Variantes pour l'animation du gagnant
  const winnerVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.8,
      rotate: -10,
      backgroundColor: '#f5f5f5'
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      backgroundColor: '#e0f7e0',
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 12,
        mass: 1,
        duration: 0.8,
        delay: 0.2
      }
    }
  };

  // Variantes pour les confettis (emojis)
  const confettiVariants = {
    hidden: { opacity: 0, y: 0, scale: 0 },
    visible: {
      opacity: [1, 1, 0],
      y: [-100, 200],
      scale: [0, 1.2, 0],
      rotate: [0, 180, 360],
      transition: {
        duration: 10,
        repeat: 20,
        ease: 'linear',
        repeatDelay: 0
      }
    }
  };
  const confettiElements = useMemo(() => {
    const confettiCount = 30;
    const emojis = ['🎉', '🏆', '🦖', '✨', '⭐', '🎈', '🦖', '🌴', '🥥'];

    return Array.from({ length: confettiCount }).map((_, index) => (
      <motion.div
        key={index}
        className='confetti-particle'
        variants={confettiVariants}
        initial='hidden'
        animate={showConfetti ? 'visible' : 'hidden'}
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          fontSize: `${Math.random() * 10 + 20}px`,
          zIndex: 100
        }}
      >
        {emojis[Math.floor(Math.random() * emojis.length)]}
      </motion.div>
    ));
  }, [currentWinner, showConfetti]);

  return (
    <div className='lottery-container'>
      {lottery.winner_id > 0 && (
        <motion.div
          className='lottery-winner-card-enhanced'
          initial='hidden'
          animate='visible'
          variants={winnerVariants}
          whileHover={{
            scale: 1.05,
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className='lottery-winner-subcard-enhanced'>
            <div className='lottery-winner-info-enhanced'>
              {t('lotteries:winner')}
            </div>
          </div>
          <div className='lottery-winner-result'>
            <ShortenedAddress address={currentWinner} />
          </div>
        </motion.div>
      )}
      {showConfetti && confettiElements}{' '}
    </div>
  );
};

export default LotteryWinner;
