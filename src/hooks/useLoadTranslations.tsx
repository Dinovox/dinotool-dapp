import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const useLoadTranslations = (namespace: string) => {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTranslation = async (lang: string) => {
      try {
        const translations = await import(
          `../helpers/translations/${namespace}/i18n.${lang}.json`
        );
        i18n.addResourceBundle(lang, namespace, translations.default);
      } catch (error) {
        console.warn(`⚠️ Traduction (${lang}) introuvable pour ${namespace}.`);
        if (lang !== 'en') {
          await loadTranslation('en');
        } else {
          console.error(
            `❌ Impossible de charger la traduction pour ${namespace}.`
          );
        }
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    loadTranslation(i18n.language || 'en');
  }, [i18n.language, namespace]);

  return loading;
};

export default useLoadTranslations;
