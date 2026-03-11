import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | CareerBot',
  description: 'Choose the perfect plan for your career journey. Start free, upgrade anytime.',
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
