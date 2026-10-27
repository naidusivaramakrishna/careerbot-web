"use client";
import { Check, ChevronDown, LayoutGrid, List } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type ViewMode = "card" | "list";

const OPTIONS: { value: ViewMode; label: string; icon: typeof List }[] = [
  { value: "card", label: "Card view", icon: LayoutGrid },
  { value: "list", label: "List view", icon: List },
];

const ViewModeSelect = ({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];
  const CurrentIcon = current.icon;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Change view"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-[#e3e9f2] bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <CurrentIcon className="w-4 h-4 text-[#1d4fa8]" />
        {current.label}
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 z-40 w-44 bg-white border border-gray-200 rounded-xl p-1.5"
          style={{ boxShadow: "0 12px 32px -8px rgba(0,0,0,0.18)" }}
        >
          {OPTIONS.map(({ value: v, label, icon: Icon }) => (
            <button
              key={v}
              type="button"
              role="option"
              aria-selected={v === value}
              onClick={() => { onChange(v); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                v === value ? "bg-[#eef3fa] text-[#1d4fa8]" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{label}</span>
              {v === value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewModeSelect;
