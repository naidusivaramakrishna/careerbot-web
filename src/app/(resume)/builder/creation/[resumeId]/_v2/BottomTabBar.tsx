"use client";
import React from "react";
import { Bot, Eye, Gauge, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileSurface = "edit" | "preview" | "score" | "ai";

export function BottomTabBar({
  value,
  onChange,
  scoreBadge,
}: {
  value: MobileSurface;
  onChange: (v: MobileSurface) => void;
  scoreBadge?: number;
}) {
  const items: { value: MobileSurface; icon: React.ReactNode; label: string; badge?: number }[] = [
    { value: "edit",    icon: <Pencil className="h-[18px] w-[18px]" />, label: "Edit" },
    { value: "preview", icon: <Eye    className="h-[18px] w-[18px]" />, label: "Preview" },
    { value: "score",   icon: <Gauge  className="h-[18px] w-[18px]" />, label: "Score", badge: scoreBadge },
    { value: "ai",      icon: <Bot    className="h-[18px] w-[18px]" />, label: "AI" },
  ];

  return (
    <nav
      aria-label="Builder navigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur",
        "supports-[backdrop-filter]:bg-white/85 lg:hidden"
      )}
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <ul className="mx-auto flex max-w-[640px] items-stretch">
        {items.map((it) => {
          const active = it.value === value;
          return (
            <li key={it.value} className="flex-1">
              <button
                onClick={() => onChange(it.value)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex w-full flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors bv2-ring-focus",
                  active ? "text-brand-600" : "text-ink-500 hover:text-ink-700"
                )}
              >
                <span className="relative">
                  {it.icon}
                  {typeof it.badge === "number" && it.badge > 0 ? (
                    <span className="absolute -right-2 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm">
                      {it.badge > 99 ? "99+" : it.badge}
                    </span>
                  ) : null}
                </span>
                <span>{it.label}</span>
                {active ? (
                  <span
                    aria-hidden
                    className="absolute -top-px h-[3px] w-9 rounded-b-full bg-brand-500"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
