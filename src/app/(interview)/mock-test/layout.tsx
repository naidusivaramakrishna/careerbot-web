'use client';

import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
});

export default function MockTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${montserrat.variable} antialiased font-montserrat min-h-screen bg-white`}>
      {children}
    </div>
  );
}
