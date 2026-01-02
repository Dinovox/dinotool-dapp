import React, { useState, useEffect } from 'react';
import {
  faBolt,
  faGem,
  faClock,
  faLevelUpAlt,
  faTrophy,
  faHistory,
  faCube,
  faChartLine,
  faShieldAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { Link } from 'react-router-dom'; // keeping imports clean
const btc_level = Math.floor(Math.random() * 100 + 1);
const merch_level = Math.floor(Math.random() * 100 + 1);
const corporate_level = Math.floor(Math.random() * 100 + 1);
const web3_level = Math.floor(Math.random() * 100 + 1);
// -- MOCK DATA --
const MOCK_FAAPU = {
  id: 'DINO-FAAPU #1337',
  name: 'Faapu #1337',
  image: '/faapu_mock.png', // Updated image path
  attributes: {
    rarity: 3, // 1: Classic, 2: Rare, 3: Epic, 4: Legendary
    initial_roll:
      Math.floor(Math.random() * 6 + 1) +
      Math.floor(Math.random() * 6 + 1) +
      Math.floor(Math.random() * 6 + 1),

    btc_level,
    merch_level,
    corporate_level,
    web3_level,

    global_level: btc_level + merch_level + corporate_level + web3_level,

    next_upgrade_timestamp: Date.now() + 1000 * 60 * 60 * 2.5, // 2.5 hours from now

    boost_time_pct: 15,
    boost_cost_pct: -10,
    bonus_levels_pending: 3,
    meteor_proof: true,

    upgrade_count: 154,
    last_bonus_id: 8
  }
};

const RARITY_CONFIG: Record<
  number,
  { label: string; color: string; bg: string; border: string }
> = {
  1: {
    label: 'Classic',
    color: 'text-gray-600',
    bg: 'bg-gray-200',
    border: 'border-gray-300'
  },
  2: {
    label: 'Rare',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-300'
  },
  3: {
    label: 'Epic',
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    border: 'border-purple-300'
  },
  4: {
    label: 'Legendary',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    border: 'border-amber-300'
  }
};

// -- COMPONENTS --

const StatBar = ({
  label,
  value,
  colorClass,
  icon
}: {
  label: string;
  value: number;
  colorClass: string;
  icon: any;
}) => (
  <div className='bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all'>
    <div className='flex justify-between items-center mb-2'>
      <div className='flex items-center gap-2'>
        <div
          className={`p-2 rounded-lg ${colorClass
            .replace('text-', 'bg-')
            .replace('500', '100')}`}
        >
          <FontAwesomeIcon icon={icon} className={`${colorClass}`} />
        </div>
        <span className='text-gray-600 font-bold text-sm uppercase tracking-wide'>
          {label}
        </span>
      </div>
      <span className='text-gray-900 font-black text-lg'>{value}</span>
    </div>
    <div className='h-3 w-full bg-gray-100 rounded-full overflow-hidden'>
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass.replace(
          'text-',
          'bg-'
        )}`}
        style={{ width: `${Math.min(100, (value / 100) * 100)}%` }}
      />
    </div>
  </div>
);

const BonusCard = ({
  label,
  value,
  subtext,
  icon,
  active
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: any;
  active?: boolean;
}) => (
  <div
    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:-translate-y-1 ${
      active
        ? 'border-amber-400 bg-amber-50 shadow-amber-200 shadow-sm'
        : 'border-gray-100 bg-white shadow-sm'
    }`}
  >
    <FontAwesomeIcon
      icon={icon}
      className={`text-2xl mb-2 ${active ? 'text-amber-500' : 'text-gray-300'}`}
    />
    <span className='text-gray-400 text-[10px] uppercase tracking-wider font-bold mb-1'>
      {label}
    </span>
    <span
      className={`text-lg font-black ${
        active ? 'text-gray-800' : 'text-gray-400'
      }`}
    >
      {value}
    </span>
    {subtext && <span className='text-xs text-gray-500 mt-1'>{subtext}</span>}
  </div>
);

export const Faapu = () => {
  const { attributes } = MOCK_FAAPU;
  const rarity = RARITY_CONFIG[attributes.rarity];

  // Timer Mock
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const diff = attributes.next_upgrade_timestamp - Date.now();
      if (diff <= 0) {
        setTimeLeft('Ready!');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='min-h-screen bg-[#bfe3e6] text-gray-900 font-sans pb-20 pt-12 md:pt-24'>
      {' '}
      {/* Light blue bg from image */}
      <div className='max-w-6xl mx-auto px-4 md:px-8 space-y-8'>
        {/* HEADER CARD */}
        <div className='bg-white rounded-3xl p-8 border-4 border-white shadow-xl flex flex-col md:flex-row gap-8 items-center relative overflow-visible mt-12'>
          {/* Floating Island Image - Negative margin to pop out */}
          <div className='w-64 h-64 md:w-96 md:h-96 -mt-20 md:-mt-32 md:-ml-12 shrink-0 relative z-10 drop-shadow-2xl transition-transform hover:scale-105 duration-500'>
            <img
              src={MOCK_FAAPU.image}
              alt='Faapu'
              className='w-full h-full object-contain drop-shadow-sm'
            />
          </div>

          <div className='flex-1 text-center md:text-left space-y-4'>
            <div className='flex flex-col md:flex-row items-center gap-4 justify-center md:justify-start'>
              <h1
                className='text-4xl md:text-6xl font-black text-gray-800 tracking-tighter'
                style={{ fontFamily: 'BitCell, sans-serif' }}
              >
                {MOCK_FAAPU.name}
              </h1>
              <span
                className={`px-4 py-1 rounded-full text-sm font-bold border-2 ${rarity.bg} ${rarity.color} ${rarity.border} uppercase tracking-widest bg-opacity-50`}
              >
                {rarity.label}
              </span>
            </div>

            <p className='text-gray-400 font-bold tracking-widest text-sm uppercase'>
              {MOCK_FAAPU.id}
            </p>

            <div className='flex flex-wrap gap-4 justify-center md:justify-start mt-6'>
              {/* Big Level Display */}
              <div className='flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-2xl border-2 border-gray-100'>
                <div className='w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl'>
                  <FontAwesomeIcon icon={faTrophy} />
                </div>
                <div className='text-left'>
                  <span className='block text-xs font-bold text-gray-400 uppercase'>
                    Global Level
                  </span>
                  <span className='block text-3xl font-black text-gray-800 leading-none'>
                    {attributes.global_level}
                  </span>
                </div>
              </div>

              <div className='flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-2xl border-2 border-gray-100'>
                <div className='w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xl'>
                  <FontAwesomeIcon icon={faCube} />
                </div>
                <div className='text-left'>
                  <span className='block text-xs font-bold text-gray-400 uppercase'>
                    Initial Roll
                  </span>
                  <span className='block text-3xl font-black text-gray-800 leading-none'>
                    {attributes.initial_roll}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* STATS */}
          <div className='lg:col-span-2 space-y-8'>
            <div>
              <h2 className='text-xl font-black text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide'>
                <FontAwesomeIcon icon={faChartLine} className='text-blue-500' />
                Core Attributes
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <StatBar
                  label='BTC Level'
                  value={attributes.btc_level}
                  colorClass='text-orange-500'
                  icon={faCube}
                />
                <StatBar
                  label='Merch Level'
                  value={attributes.merch_level}
                  colorClass='text-purple-500'
                  icon={faGem}
                />
                <StatBar
                  label='Corporate Level'
                  value={attributes.corporate_level}
                  colorClass='text-blue-500'
                  icon={faChartLine}
                />
                <StatBar
                  label='Web3 Level'
                  value={attributes.web3_level}
                  colorClass='text-green-500'
                  icon={faBolt}
                />
              </div>
            </div>

            <div>
              <h2 className='text-xl font-black text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide'>
                <FontAwesomeIcon icon={faGem} className='text-amber-500' />
                Perks & Bonuses
              </h2>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                <BonusCard
                  label='Boost Time'
                  value={`-${attributes.boost_time_pct}%`}
                  icon={faClock}
                  active={true}
                />
                <BonusCard
                  label='Boost Cost'
                  value={`${attributes.boost_cost_pct}%`}
                  icon={faBolt}
                />
                <BonusCard
                  label='Meteor Proof'
                  value={attributes.meteor_proof ? 'YES' : 'NO'}
                  icon={faShieldAlt}
                  active={attributes.meteor_proof}
                />
                <BonusCard
                  label='Last Bonus'
                  value={`#${attributes.last_bonus_id}`}
                  icon={faGem}
                />
              </div>
            </div>
          </div>

          {/* SIDEBAR: PROGRESSION */}
          <div className='space-y-6'>
            <div className='bg-white rounded-3xl p-6 border border-gray-200 shadow-xl relative overflow-hidden group'>
              <div className='absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500' />

              <h3 className='text-xl font-black text-gray-800 mb-6 flex items-center gap-2'>
                Next Upgrade
              </h3>

              <div className='flex flex-col items-center justify-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 mb-6 group-hover:border-blue-300 transition-colors'>
                <span className='text-gray-400 text-xs font-bold uppercase tracking-widest mb-2'>
                  Time Remaining
                </span>
                <span className='text-4xl font-mono font-black text-gray-800 tracking-wider'>
                  {timeLeft}
                </span>
              </div>

              <div className='space-y-4 mb-8'>
                <div className='flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg'>
                  <span className='text-gray-500 font-medium'>
                    Pending Levels
                  </span>
                  <span className='bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-md'>
                    {attributes.bonus_levels_pending}
                  </span>
                </div>
                <div className='flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg'>
                  <span className='text-gray-500 font-medium'>Cost</span>
                  <span className='text-gray-900 font-black'>-- GRAOU</span>
                </div>
              </div>

              <button className='w-full py-4 bg-gray-100 text-gray-400 font-bold rounded-xl border-2 border-gray-200 uppercase tracking-widest cursor-not-allowed hover:bg-gray-200 transition-colors'>
                Upgrade Locked
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
