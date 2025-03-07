import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { min } from 'moment';

const savedLang =
  localStorage.getItem('lang') || navigator.language.split('-')[0] || 'en';

i18n.use(initReactI18next).init({
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;

// i18n
//   .use(LanguageDetector) // Détection automatique de la langue du navigateur
//   .use(initReactI18next) // Intégration avec React
//   .init({
//     resources: {
//       en: {
//         translation: {
//           home: 'Home',
//           dashboard: 'Dashboard',
//           lotteries: 'Lotteries',
//           lottery: 'Lottery',
//           vouchers: 'Vouchers',
//           changeLang: 'Change Language',
//           disclaimer: 'Disclaimer',
//           mint: 'Mint'
//         }
//       },
//       fr: {
//         translation: {
//           home: 'Accueil',
//           dashboard: 'Tableau de bord',
//           lotteries: 'Loteries',
//           lottery: 'Loterie',
//           vouchers: 'Bons',
//           changeLang: 'Changer la langue',
//           disclaimer: 'Avertissement',
//           mint: 'Mint'
//         }
//       }
//     },
//     fallbackLng: 'en', // Langue par défaut si aucune n'est détectée
//     interpolation: { escapeValue: false }
//   });

// export default i18n;
