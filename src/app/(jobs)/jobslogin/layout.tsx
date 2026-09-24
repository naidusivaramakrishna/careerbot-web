import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import "./jobs-premium.css";

export default function JobsLoginLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="jobs-premium-theme flex h-screen overflow-hidden bg-white" style={{ "--header-h": "56px" } as React.CSSProperties}>
      {/* LEFT SIDEBAR */}
      <aside
        className="shrink-0 bg-white transition-[width] duration-300"
        style={{ width: "var(--sidebar-width, 64px)" }}
      >
        <Sidebar />
      </aside>

      {/* PAGE CONTENT */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="min-w-0 flex-1 overflow-hidden" style={{ paddingTop: "var(--header-h)" }}>{children}</main>
      </div>
    </div>
  );
}
