import { Card } from 'components/Card';
import { AuthRedirectWrapper } from 'wrappers';
import { ScanMessage } from './ScanMessage';
import classNames from 'classnames';
import { PostCampaignButton } from 'helpers/api/dinoclaim/postCampain';
import { GetCampaigns } from 'helpers/api/dinoclaim/getCampaigns';
import { PutCampaignIDButton } from 'helpers/api/dinoclaim/putCampaignID';

export const Claim = () => {
  return (
    <AuthRedirectWrapper>
      <div
        className={classNames('flex flex-col gap-6 max-w-3xl w-full spec-0')}
      >
        <Card
          key={'title'}
          title={'Claim NFT'}
          description={'Claim your sft/nft with a code'}
          reference={''}
        >
          <ScanMessage />
        </Card>
      </div>
    </AuthRedirectWrapper>
  );
};
