import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Coding Practice — CareerBOT',
  description: 'Practice coding problems in Python, Java, and C++ with instant AI grading and feedback.',
};

export default function CodingTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NEXT_PUBLIC_CODING_TEST_ENABLED !== 'true') {
    redirect('/');
  }
  return <>{children}</>;
}
