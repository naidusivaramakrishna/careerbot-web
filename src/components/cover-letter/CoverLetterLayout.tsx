import type { ReactNode } from 'react';

interface CoverLetterLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export default function CoverLetterLayout({ sidebar, main }: CoverLetterLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {sidebar}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {main}
      </div>
    </div>
  );
}