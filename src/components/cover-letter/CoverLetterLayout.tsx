import type { ReactNode } from 'react';

interface CoverLetterLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export default function CoverLetterLayout({ sidebar, main }: CoverLetterLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#eef2fb" }}>
      {sidebar}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {main}
      </div>
    </div>
  );
}
