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
      </div>
    </aside>
    {showExitConfirm && <div className="mi-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="mi-exit-title" data-exit-dialog>
      <div className="mi-modal mi-modal-small"><button className="mi-modal-close" aria-label="Close exit confirmation" onClick={() => setShowExitConfirm(false)}><X size={20} /></button><span className="mi-icon-tile"><AlertTriangle size={24} /></span><h2 id="mi-exit-title">Exit mock interview?</h2><p>Your current session progress may not be saved. Are you sure you want to leave?</p><div className="mi-modal-actions"><button ref={cancelRef} className="mi-button mi-button-secondary" onClick={() => setShowExitConfirm(false)}>Stay</button><button className="mi-button" onClick={() => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); router.push("/dashboard"); }}>Exit</button></div></div>
    </div>}
  </>;
}
