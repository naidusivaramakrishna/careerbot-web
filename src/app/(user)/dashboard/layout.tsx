import { Metadata } from 'next';
import ClientLayout from './ClientLayout';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Dashboard | CareerBot',
  description: 'Your AI Career Command Center - Track your progress, credits, and next steps',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ClientLayout>
        {children}
        <Toaster richColors position="bottom-right" />
      </ClientLayout>
    </>
  );
}
