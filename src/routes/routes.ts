import { RouteNamesEnum } from 'localConstants';
import { Dashboard, Disclaimer, Home, Mint, Drop, Quiz, Lottery } from 'pages';
import { RouteType } from 'types';

interface RouteWithTitleType extends RouteType {
  title: string;
}

export const routes: RouteWithTitleType[] = [
  {
    path: RouteNamesEnum.home,
    title: 'Home',
    component: Home
  },
  {
    path: RouteNamesEnum.dashboard,
    title: 'Dashboard',
    component: Dashboard
  },
  {
    path: RouteNamesEnum.disclaimer,
    title: 'Disclaimer',
    component: Disclaimer
  },
  {
    path: RouteNamesEnum.mint,
    title: 'Mint',
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
    path: RouteNamesEnum.lottery,
    title: 'Lottery',
    component: Lottery
  },
  {
    path: `${RouteNamesEnum.lottery}/:id`,
    title: 'Lottery Detail',
    component: Lottery
  }
];
