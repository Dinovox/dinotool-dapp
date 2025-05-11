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
  Profile
} from 'pages';
import { RouteType } from 'types';
import { useTranslation } from 'react-i18next';
interface RouteWithTitleType extends RouteType {
  title: string;
}
export const useRoutesWithTranslation = (): RouteWithTitleType[] => {
  const { t } = useTranslation();

  return [
    {
      path: RouteNamesEnum.home,
      title: t('home'),
      component: Home
    },
    // {
    //   path: RouteNamesEnum.disclaimer,
    //   title: t('disclaimer'),
    //   component: Disclaimer
    // },
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
      component: Quiz
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
      component: Vouchers
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
      component: Profile
    }
  ];
};
