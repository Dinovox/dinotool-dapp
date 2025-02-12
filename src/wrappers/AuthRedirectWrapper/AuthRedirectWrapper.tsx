import { PropsWithChildren, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RouteNamesEnum } from 'localConstants';
import { useGetIsLoggedIn } from '../../hooks';

interface AuthRedirectWrapperPropsType extends PropsWithChildren {
  requireAuth?: boolean;
}

export const AuthRedirectWrapper = ({
  children,
  requireAuth = true
}: AuthRedirectWrapperPropsType) => {
  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();
  const location = useLocation(); // Permet d'obtenir la page actuelle
  const isUnlockPage = location.pathname === RouteNamesEnum.unlock;

  useEffect(() => {
    //Pas co et pas sur la page de déverrouillage
    //on garde la page actuelle avant la redirection
    if (!isLoggedIn && !isUnlockPage) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      // console.log('redirectAfterLogin', location.pathname);
    }

    //pas co et besoin d'authentification
    //on redirige vers la page de déverrouillage
    if (!isLoggedIn && requireAuth) {
      navigate(RouteNamesEnum.unlock);
    }

    //co et sur la page de déverrouillage
    //on récupère la page stockée et on redirige l'utilisateur
    //Mais la page Unlock onLogin aura le contrôle de la redirection
    if (isLoggedIn && isUnlockPage) {
      // Récupérer la page stockée et rediriger l'utilisateur
      const previousPage =
        sessionStorage.getItem('redirectAfterLogin') || RouteNamesEnum.mint;
      navigate(previousPage);
    }
  }, [isLoggedIn, location]);

  return <>{children}</>;
};
