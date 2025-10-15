import { useState } from 'react';
import { Card } from 'components/Card';
import { AuthRedirectWrapper } from 'wrappers';
import classNames from 'classnames';
import { PostCampaignButton } from 'helpers/api/dinoclaim/postCampain';
import { GetCampaigns } from 'helpers/api/dinoclaim/getCampaigns';
import EditCampaign from './EditCampaign';

type CampaignPreview = {
  id: string;
  title: string;
  status: string;
  start_at?: string;
  end_at?: string;
  collection?: string;
  nonce?: number;
  created_at?: string;
  updated_at?: string;
  max_total_sends?: number;
  max_sends_per_wallet?: number;
  daily_send_cap?: number;
  total_sends?: number;
};

export const ClaimAdmin = () => {
  const [editedCampaign, setEditedCampaign] = useState<CampaignPreview | null>(
    null
  );

  return (
    <AuthRedirectWrapper>
      <div>
        <Card
          key='title'
          title='Distribution campaigns'
          description='Create and manage your NFT distribution campaigns'
          reference=''
        >
          {!editedCampaign ? (
            <>
              <PostCampaignButton
                onCreated={(id) => {
                  console.log('Created campaign ID:', id);
                  setEditedCampaign(id);
                }}
              />
              <GetCampaigns
                onEditCampaign={(campaign: CampaignPreview) => {
                  console.log('Selected campaign:', campaign);
                  setEditedCampaign(campaign);
                }}
              />
            </>
          ) : (
            <div>
              <EditCampaign
                campaign={editedCampaign}
                onBack={() => setEditedCampaign(null)}
              />
            </div>
          )}
        </Card>
      </div>
    </AuthRedirectWrapper>
  );
};
