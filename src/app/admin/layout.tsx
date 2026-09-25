import { ReactNode } from 'react';

export const metadata = {
  title: 'Admin Portal',
  description: 'CareerBot Admin Portal',
};

// Prevent caching of admin pages for security
// This ensures that after logout, the browser won't show cached admin pages
export const revalidate = 0;

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return children;
}
