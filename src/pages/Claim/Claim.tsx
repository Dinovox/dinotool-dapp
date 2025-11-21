import { Card } from 'components/Card';
import { AuthRedirectWrapper } from 'wrappers';
import { ScanMessage } from './ScanMessage';
import classNames from 'classnames';
import { useGetIsLoggedIn } from 'lib';
import { ConnectButton } from 'components/Button/ConnectButton';
import { Breadcrumb } from 'components/ui/Breadcrumb';

export const Claim = () => {
  const isLoggedIn = useGetIsLoggedIn();
  return (
    <AuthRedirectWrapper>
      <div className='flex flex-col w-full max-w-7xl mx-auto'>
        <div className='px-6 pt-6'>
          <Breadcrumb
            items={[{ label: 'Home', path: '/' }, { label: 'Claim' }]}
          />
        </div>
        <div className='flex flex-col items-center justify-center min-h-[80vh] px-4'>
          <Card
            key={'title'}
            title={
              <div className='flex items-center gap-2'>
                <span className='text-xl font-semibold'>🎁 Claim NFT</span>
              </div>
            }
            description={
              <p className='text-sm text-gray-500'>
                Claim your <span className='font-medium'>SFT / NFT</span> with a
                code
              </p>
            }
            reference=''
          >
            <div className='flex flex-col items-center gap-4 p-4'>
              <ScanMessage />

              <p className='text-xs text-gray-400 text-center'>
                Use your QR Code or claim code below
              </p>
            </div>
            {!isLoggedIn ? (
              <>
                <ConnectButton />
              </>
            ) : (
              <div className='flex justify-center'>
                <a
                  href='/claimadmin'
                  className='text-blue-600 hover:underline text-sm'
                >
                  Manage your distribution campaigns
                </a>
              </div>
            )}{' '}
          </Card>
        </div>
      </div>
    </AuthRedirectWrapper>
  );
};
