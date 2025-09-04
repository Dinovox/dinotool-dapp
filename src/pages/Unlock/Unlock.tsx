import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { UnlockPanelManager, useGetLoginInfo } from 'lib';
import { RouteNamesEnum } from 'localConstants';

export const Unlock = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const { isLoggedIn } = useGetLoginInfo();

  // Si la route /unlock est ouverte "par-dessus" une page (background location)
  const { background, returnTo } = (location.state as any) || {};

  const fallback = RouteNamesEnum.home;
  const target = typeof returnTo === 'string' ? returnTo : fallback;

  const close = (replace = true) => {
    // On navigue explicitement vers la page d’origine, pas -1
    navigate(target, { replace }); // <-- retour EXACT à la page d’origine
  };

  // Initialise le manager une seule fois
  const unlockPanelManager = useMemo(
    () =>
      UnlockPanelManager.init({
        loginHandler: () => close(true),
        onClose: () => close(true)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [target] // on ne veut pas réinitialiser le manager à chaque render
  );

  useEffect(() => {
    if (isLoggedIn) {
      close();
      return;
    }

    // Ouvre le portail à l'arrivée sur /unlock
    unlockPanelManager.openUnlockPanel();

    // Cleanup optionnel si ton manager le supporte (sinon retire-le)
    return () => {
      // pas de closeUnlockPanel dans l'API → on laisse le portail gérer sa fermeture via onClose
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return null; // aucun HTML ici : le portail gère l'UI
};
