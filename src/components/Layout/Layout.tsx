import type { PropsWithChildren } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { AuthRedirectWrapper } from 'wrappers';

export const Layout = ({ children }: PropsWithChildren) => {
  const { search } = useLocation();
  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex flex-grow items-stretch justify-center pt-6 m-auto'>
        <AuthRedirectWrapper>{children}</AuthRedirectWrapper>
      </main>
      <Outlet />
      <Footer />
    </div>
  );
};
