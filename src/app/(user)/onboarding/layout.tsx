import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome | CareerBot',
  description: 'Complete your profile setup and start your career journey',
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Minimal layout without sidebar for focused onboarding experience
  return <div className="min-h-screen">{children}</div>;
}
