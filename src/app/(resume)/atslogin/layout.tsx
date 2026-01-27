// layout.tsx
import Sidebar from "@/components/layout/Sidebar";

export default function ATSLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-20 overflow-hidden">
        {children}
      </main>
    </div>
  );
}