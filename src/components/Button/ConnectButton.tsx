import { RouteNamesEnum } from 'localConstants';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

export function ConnectButton() {
  const location = useLocation();
  const { t } = useTranslation();

  const fullPath = location.pathname + location.search + location.hash;

  return (
    <Link
      className='dinoButton'
      to={RouteNamesEnum.unlock}
      state={{ background: location, returnTo: fullPath }}
    >
      {t('global:connect')}
    </Link>
  );
}
