import { RouteNamesEnum } from 'localConstants';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

export function ConnectButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fullPath = location.pathname + location.search + location.hash;
  const isUnlockRoute = location.pathname === RouteNamesEnum.unlock;

  const handleConnect = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isUnlockRoute) {
      return;
    }
    navigate(RouteNamesEnum.unlock, {
      state: { background: location, returnTo: fullPath }
    });
  };

  return (
    <button className='dinoButton' onClick={handleConnect}>
      {t('global:connect')}
    </button>
  );
}
