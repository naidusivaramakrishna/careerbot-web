'use client';

// Montserrat via @fontsource-variable, matching how src/app/layout.tsx already
// loads Inter and JetBrains Mono: "bundled in node_modules ... so the build
// never fetches fonts over the network".
//
// This layout was the last one still on next/font/google, which fetches at
// BUILD time. When fonts.gstatic.com was slow the build failed outright --
//   `next/font` error: Failed to fetch `Montserrat` from Google Fonts.
//   [AggregateError: ] { code: 'ETIMEDOUT' }
// -- after Next's 3 retries, reddening `Lint and Build` (a REQUIRED check) on
// unrelated PRs and costing a ~20 minute re-run each time on one shared
// runner. The dependency was already in package.json; only this import was
// left behind.
//
// The font-family is applied through --font-montserrat, scoped to
// [data-mock-test] in globals.css so it overrides the global alias for this
// subtree only -- same effect the removed `montserrat.variable` class had.
import '@fontsource-variable/montserrat';
import { usePathname } from 'next/navigation';
import MockTestSidebar from './_components/MockTestSidebar';

// Whitelist of "browse / configure" routes that get the sidebar.
// Everything else — the test runner ('/mock-test/<companyId>',
// '/mock-test/custom-test') and the results page — hides the sidebar so the
// user owns the full canvas while testing.
const ROUTES_WITH_SIDEBAR = ['browse', 'company', 'custom', 'history', 'leaderboard', 'weak-areas'];

export default function MockTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const segment = pathname.replace('/mock-test', '').replace(/^\//, '').split('/')[0];
  const showSidebar = ROUTES_WITH_SIDEBAR.includes(segment);

  return (
    <div data-mock-test className="antialiased font-montserrat min-h-screen" style={{ background: '#F4F2EC' }}>
      {showSidebar && <MockTestSidebar />}
      <main className={showSidebar ? 'pl-52' : ''}>
        {children}
      </main>
    </div>
  );
}
