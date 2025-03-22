import React from 'react';
import { useTranslation } from 'react-i18next';
// https://github.com/twitter/twemoji/tree/master/assets/svg

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <div className='language-switcher'>
      <button onClick={() => changeLanguage('fr')} className='lang-button'>
        <img src='/svg/1f1eb-1f1f7.svg' alt='FR' className='flag-icon' />
        <span>FR</span>
      </button>
      <button onClick={() => changeLanguage('en')} className='lang-button'>
        <img src='/svg/1f1ec-1f1e7.svg' alt='EN' className='flag-icon' />
        <span>EN</span>
      </button>
    </div>
  );
};

export default LanguageSelector;
