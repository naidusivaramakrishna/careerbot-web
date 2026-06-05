'use client';

import { Montserrat } from 'next/font/google';
import { usePathname } from 'next/navigation';
import MockTestSidebar from './_components/MockTestSidebar';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
});

// Whitelist of "browse / configure" routes that get the sidebar.
// Everything else — the test runner ('/mock-test/<companyId>',
// '/mock-test/custom-test') and the results page — hides the sidebar so the
// user owns the full canvas while testing.
const ROUTES_WITH_SIDEBAR = ['', 'company', 'custom', 'history', 'leaderboard', 'weak-areas'];

export default function MockTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const segment = pathname.replace('/mock-test', '').replace(/^\//, '').split('/')[0];
  const showSidebar = ROUTES_WITH_SIDEBAR.includes(segment);

  return (
    <div data-mock-test className={`${montserrat.variable} antialiased font-montserrat min-h-screen`} style={{ background: '#F4F2EC' }}>
      {showSidebar && <MockTestSidebar />}
      <main className={showSidebar ? 'pl-52' : ''}>
        {children}
      </main>
    </div>
  );
}
