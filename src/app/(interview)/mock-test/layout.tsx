'use client';

import { Montserrat } from 'next/font/google';
import { usePathname } from 'next/navigation';
import MockTestSidebar from './_components/MockTestSidebar';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
});

const NO_SIDEBAR_ROUTES = ['results'];

export default function MockTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const segment = pathname.replace('/mock-test', '').replace(/^\//, '').split('/')[0];
  const showSidebar = !NO_SIDEBAR_ROUTES.includes(segment);

  return (
    <div className={`${montserrat.variable} antialiased font-montserrat min-h-screen`} style={{ background: '#F4F2EC' }}>
      {showSidebar && <MockTestSidebar />}
      <main className={showSidebar ? 'pl-52' : ''}>
        {children}
      </main>
    </div>
  );
}
