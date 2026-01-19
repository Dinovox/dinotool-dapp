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
  Claim,
  ClaimAdmin,
  Marketplace,
  MarketplaceCollections,
  MarketplaceCollectionById,
  MarketplaceListings,
  MarketplaceListingDetail,
  MarketplaceSell,
  Faapu,
  DinoGazette,
  Wallet
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
      component: Home
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
      component: Profile
    },
    {
      path: RouteNamesEnum.locker,
      title: t('locker'),
      component: Locker
    },
    {
      path: RouteNamesEnum.claim,
      title: t('claim'),
      component: Claim
    },
    {
      path: RouteNamesEnum.claimid,
      title: 'claim/:id',
      component: Claim
    },
    {
      path: RouteNamesEnum.claimadmin,
      title: t('claimAdmin'),
      component: ClaimAdmin
    },
    {
      path: RouteNamesEnum.marketplace,
      title: t('marketplace'),
      component: Marketplace
    },
    {
      path: `${RouteNamesEnum.marketplaceCollections}`,
      title: t('collections'),
      component: MarketplaceCollections
    },
    {
      path: `${RouteNamesEnum.marketplaceCollections}/:id`,
      title: t('collection detail'),
      component: MarketplaceCollectionById
    },
    {
      path: `${RouteNamesEnum.marketplace}/listings`,
      title: t('Listings'),
      component: MarketplaceListings
    },
    {
      path: `${RouteNamesEnum.marketplace}/listings/:id`,
      title: t('listing detail'),
      component: MarketplaceListingDetail
    },
    {
      path: `${RouteNamesEnum.marketplace}/sell`,
      title: t('Sell'),
      component: MarketplaceSell
    },
    {
      path: RouteNamesEnum.faapu,
      title: 'Faapu',
      component: Faapu
    },
    {
      path: RouteNamesEnum.dinogazette,
      title: 'DinoGazette',
      component: DinoGazette
    },
    {
      path: RouteNamesEnum.wallet,
      title: 'Mon Wallet',
      component: Wallet
    }
  ];
};
