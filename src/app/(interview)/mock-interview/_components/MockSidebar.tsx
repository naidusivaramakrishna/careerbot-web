"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Play, History, FileText, LogOut, AlertTriangle, ArrowUpRight, X } from "lucide-react";
import { useMockInterview } from "../_context/MockInterviewContext";

export default function MockSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { stageState } = useMockInterview();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const exitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showExitConfirm) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowExitConfirm(false);
      if (event.key === "Tab") {
        const controls = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-exit-dialog] button'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); exitRef.current?.focus(); };
  }, [showExitConfirm]);

  if (pathname === "/mock-interview") return null;
  const items = [
    { href: "/mock-interview/live", label: "Mock Interview", detail: "Your next practice session", Icon: Play },
    { href: "/mock-interview/history", label: "History & Reports", detail: stageState.history_count > 0 ? `${stageState.history_count} sessions` : "Your progress, in one place", Icon: History },
  ];

<<<<<<< HEAD
  return <>
    <aside className="mi-sidebar">
      <button className="mi-logo" onClick={() => router.push("/mock-interview/live")} aria-label="CareerBot mock interview">
        <Image src="/assets/icons/Logo.png" alt="CareerBot" width={36} height={36} priority />
        <span>Career<span>BOT</span></span>
      </button>
      <div className="mi-sidebar-body">
        <p className="mi-nav-caption">INTERVIEW STUDIO</p>
        <nav aria-label="Mock interview navigation">
          {items.map(({ href, label, detail, Icon }, index) => {
            const active = pathname === href || pathname.startsWith(`${href}/`) || (index === 1 && pathname.startsWith("/mock-interview/report/"));
            return <button key={href} onClick={() => router.push(href)} className={`mi-nav-item ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined} aria-label={`${String(index + 1).padStart(2, "0")} ${label}`} title={label}>
              <Icon size={19} /><span><strong>{label}</strong><small>{detail}</small></span>
            </button>;
          })}
        </nav>
        <div className="mi-prep-note"><FileText size={23} /><h2>A little preparation goes a long way.</h2><p>Build your talking points before your next interview.</p><button onClick={() => router.push("/notes/generate")} aria-label="Optional prep notes and practice">Optional Prep <ArrowUpRight size={15} /></button></div>
        <div className="mi-sidebar-bottom"><span className="mi-nav-caption">MAKE EVERY ATTEMPT COUNT</span><button ref={exitRef} onClick={() => setShowExitConfirm(true)} aria-label="Exit mock interview" className="mi-exit"><LogOut size={18} /><span>Back to dashboard</span></button></div>
=======
  return (
    <>
    {showExitConfirm && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">Exit mock interview?</h2>
          <p className="mt-1.5 text-sm text-gray-500">
            Your current session progress may not be saved. Are you sure you want to leave?
          </p>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setShowExitConfirm(false)}
              className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Stay
            </button>
            <button
              type="button"
              onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                router.push("/dashboard");
              }}
              className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    )}
    <aside className="hidden h-full w-[72px] shrink-0 flex-col items-center border-r border-gray-200 bg-white lg:flex">
      <div className="flex h-[72px] w-full items-center justify-center border-b border-gray-100">
        <button
          type="button"
          onClick={() => router.push("/mock-interview/live")}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50"
          aria-label="CareerBot mock interview"
          title="CareerBot Mock Interview"
        >
          <Image src="/assets/icons/Logo.png" alt="CareerBot" width={40} height={40} className="h-10 w-10 object-contain" priority />
        </button>
      </div>

      <nav className="flex w-full flex-1 flex-col items-center gap-2 px-3 py-5" aria-label="Mock interview navigation">
        {stages.map((stage, index) => {
          const isActive = pathname === stage.href || pathname.startsWith(stage.href + "/");
          const Icon = stage.icon;
          const isCompleted = stage.status === "completed";
          const isInProgress = stage.status === "in_progress";

          return (
            <div key={stage.id} className="group relative w-full">
              <button
                type="button"
                onClick={() => { if (!stage.locked) router.push(stage.href); }}
                disabled={stage.locked}
                aria-label={`${String(index + 1).padStart(2, "0")} ${stage.label}`}
                title={stage.label}
                className={`relative flex h-11 w-full items-center justify-center rounded-lg border transition-all duration-150 ${
                  isActive
                    ? "border-[#2557a7]/20 bg-[#2557a7] text-white shadow-sm"
                    : stage.locked
                    ? "cursor-not-allowed border-transparent bg-transparent text-gray-300 opacity-50"
                    : "border-transparent text-gray-500 hover:border-gray-200 hover:bg-white hover:text-[#2557a7] hover:shadow-sm"
                }`}
              >
                {isActive && <span className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r-full bg-[#2557a7]" aria-hidden="true" />}

                <span className={`flex h-8 w-8 items-center justify-center rounded-md ${isActive ? "bg-white/15 text-white" : "bg-gray-50"}`}>
                  {isCompleted && !isActive ? (
                    <CheckCircle2 size={16} className="text-[#2557a7]" />
                  ) : stage.locked ? (
                    <Lock size={15} />
                  ) : (
                    <Icon size={16} />
                  )}
                </span>

                {stage.badge && (
                  <span className="absolute right-1 top-1 min-w-4 rounded-full bg-[#2557a7] px-1 text-[9px] font-bold leading-4 text-white">
                    {stage.badge}
                  </span>
                )}
                {isInProgress && !isActive && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#2557a7]" />}
              </button>

            </div>
          );
        })}
      </nav>

      <div className="flex w-full flex-col items-center gap-3 border-t border-gray-100 px-3 py-5">
        <div className="group relative w-full">
          <button
            type="button"
            onClick={() => router.push("/notes/generate")}
            className="flex h-11 w-full items-center justify-center rounded-lg border border-[#2557a7]/20 bg-[#2557a7]/5 text-[#2557a7] transition-colors hover:bg-[#2557a7]/10"
            aria-label="Optional prep notes and practice"
            title="Optional Prep"
          >
            <FileText size={17} />
          </button>
        </div>

        <div className="group relative w-full">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="flex h-11 w-full items-center justify-center rounded-lg border border-transparent text-gray-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-500"
            aria-label="Exit mock interview"
            title="Exit"
          >
            <LogOut size={17} />
          </button>
        </div>
>>>>>>> e98c6a1336ab533982be55baf515e5d4b6d56a6d
      </div>
    </aside>
    {showExitConfirm && <div className="mi-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="mi-exit-title" data-exit-dialog>
      <div className="mi-modal mi-modal-small"><button className="mi-modal-close" aria-label="Close exit confirmation" onClick={() => setShowExitConfirm(false)}><X size={20} /></button><span className="mi-icon-tile"><AlertTriangle size={24} /></span><h2 id="mi-exit-title">Exit mock interview?</h2><p>Your current session progress may not be saved. Are you sure you want to leave?</p><div className="mi-modal-actions"><button ref={cancelRef} className="mi-button mi-button-secondary" onClick={() => setShowExitConfirm(false)}>Stay</button><button className="mi-button" onClick={() => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); router.push("/dashboard"); }}>Exit</button></div></div>
    </div>}
  </>;
}
