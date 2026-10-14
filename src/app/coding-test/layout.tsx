import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coding Practice — CareerBOT',
  description: 'Practice coding problems in Python, Java, and C++ with instant AI grading and feedback.',
};

export default function CodingTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
