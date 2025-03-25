import { RouteNamesEnum } from 'localConstants';
import {
  Disclaimer,
  Home,
  Mint,
  Drop,
  Quiz,
  LotteryList,
  LotteryDetail,
  Vouchers
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
    {
      path: RouteNamesEnum.disclaimer,
      title: t('disclaimer'),
      component: Disclaimer
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
    }
  ];
};
