import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <div>
      <button onClick={() => changeLanguage('fr')}>🇫🇷 FR</button>
      <button onClick={() => changeLanguage('en')}>🇬🇧 EN</button>
    </div>
  );
};

export default LanguageSelector;
