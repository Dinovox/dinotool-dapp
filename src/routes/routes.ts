import { RouteNamesEnum } from 'localConstants';
import {
  Home,
  Mint,
  Drop,
  Quiz,
  LotteryList,
  LotteryDetail,
  Vouchers,
  Collections,
  CollectionDetail,
  CollectionIdentifier,
  Profile,
  Locker,
  Unlock
} from 'pages';
import { RouteType } from 'types';
import { useTranslation } from 'react-i18next';
import { Route } from 'react-router-dom';
interface RouteWithTitleType extends RouteType {
  title: string;
  authenticatedRoute?: boolean;
  children?: RouteWithTitleType[];
}
export const useRoutesWithTranslation = (): RouteWithTitleType[] => {
  const { t } = useTranslation();

  return [
    {
      path: RouteNamesEnum.home,
      title: t('home'),
      component: Home,
      children: [
        {
          path: RouteNamesEnum.unlock,
          title: 'Unlock',
          component: Unlock
        }
      ]
    },
    {
      path: RouteNamesEnum.mint,
      title: t('mint'),
      component: Mint
    },
    {
      path: RouteNamesEnum.drop,
      title: 'Drop',
      component: Drop
    },
    {
      path: RouteNamesEnum.quiz,
      title: 'Quiz',
      component: Quiz,
      authenticatedRoute: true
    },
    {
      path: RouteNamesEnum.lotteries,
      title: t('lotteries'),
      component: LotteryList
    },
    {
      path: `${RouteNamesEnum.lotteries}/:id`,
      title: t('lottery'),
      component: LotteryDetail
    },
    {
      path: RouteNamesEnum.vouchers,
      title: t('vouchers'),
      component: Vouchers,
      authenticatedRoute: true
    },
    {
      path: RouteNamesEnum.collections,
      title: t('collections'),
      component: Collections
    },
    {
      path: `${RouteNamesEnum.collections}/:id`,
      title: t('collection'),
      component: CollectionDetail
    },
    {
      path: `${RouteNamesEnum.nfts}/:id`,
      title: t('collection'),
      component: CollectionIdentifier
    },
    {
      path: RouteNamesEnum.profile,
      title: t('profil'),
      component: Profile,
      authenticatedRoute: true
    },
    {
      path: RouteNamesEnum.locker,
      title: t('locker'),
      component: Locker
    }
  ];
};
