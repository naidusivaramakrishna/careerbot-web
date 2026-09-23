import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  value?: string; // expected format: "MMM YY" (e.g., "Jun 24")
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  // Opt out of the "no future dates" cap (e.g. an expected/future graduation date).
  // Only meant for a lone end-date field — the paired start date should keep the default.
  allowFutureDates?: boolean;
}

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Exported so callers (e.g. Education's start/end-date ordering check) can compare
// two "MMM YY" / "YYYY-MM" values without duplicating this parsing.
export function toYearMonth(date: string): number | null {
  if (!date) return null;
  if (/^[A-Za-z]{3}\s\d{2}$/.test(date)) {
    const [mon, yr] = date.split(" ");
    const mIdx = monthNames.findIndex(m => m.toLowerCase() === mon.toLowerCase());
    if (mIdx === -1) return null;
    return (2000 + parseInt(yr)) * 100 + mIdx;
  }
  if (/^\d{4}-\d{2}$/.test(date)) {
    const [y, m] = date.split("-");
    return parseInt(y) * 100 + (parseInt(m) - 1);
  }
  return null;
}

const DROPDOWN_HEIGHT = 240;

function getTodayMonthYear(): string {
  const now = new Date();
  const mn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${mn[now.getMonth()]} ${String(now.getFullYear()).slice(-2)}`;
}

export default function MonthYearPicker({
  value = "",
  onChange,
  placeholder,
  disabled,
  minDate,
  maxDate,
  allowFutureDates = false,
}: Props) {
  // Default param only triggers on `undefined` — callers passing an unset date as ""
  // (e.g. maxDate={education.endDate} before endDate is filled in) would otherwise
  // bypass the "no future dates" cap entirely, so normalize "" here too.
  //
  // allowFutureDates lets a lone field (e.g. an expected/future graduation end date)
  // skip the cap. It never widens a *paired* field's cap beyond today though: if a
  // future-allowed end date is fed in here as this field's maxDate (e.g. the start
  // date field, which is capped by min(endDate, today)), we still clamp to today
  // rather than trust the possibly-future value passed in.
  const todayYM = toYearMonth(getTodayMonthYear())!;
  const passedYM = maxDate ? toYearMonth(maxDate) : null;
  const effectiveMaxDate = allowFutureDates
    ? (maxDate || undefined)
    : (passedYM !== null && passedYM < todayYM ? maxDate : getTodayMonthYear());
  const [open, setOpen] = useState(false);
  const [showYearGrid, setShowYearGrid] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [displayYear, setDisplayYear] = useState<number>(() => {
    if (value && /^[A-Za-z]{3}\s\d{2}$/.test(value)) return 2000 + parseInt(value.split(" ")[1]);
    if (/^\d{4}-\d{2}$/.test(value)) return parseInt(value.split("-")[0]);
    return new Date().getFullYear();
  });
  const [yearRangeStart, setYearRangeStart] = useState(() => new Date().getFullYear() - 7);

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Recalculate fixed position on open/scroll/resize — flips upward if too close to bottom
  useEffect(() => {
    if (!open || !ref.current) return;

    const calculate = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < DROPDOWN_HEIGHT + 8;

      setDropdownStyle({
        position: "fixed",
        left: rect.left,
        width: Math.max(rect.width, 220),
        zIndex: 9999,
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    };

    calculate();
    window.addEventListener("scroll", calculate, true);
    window.addEventListener("resize", calculate);
    return () => {
      window.removeEventListener("scroll", calculate, true);
      window.removeEventListener("resize", calculate);
    };
  }, [open]);

  const minYM = toYearMonth(minDate ?? "");
  const maxYM = toYearMonth(effectiveMaxDate ?? "");

  const isMonthDisabled = (mIndex: number): boolean => {
    const ym = displayYear * 100 + mIndex;
    if (minYM !== null && ym < minYM) return true;
    if (maxYM !== null && ym > maxYM) return true;
    return false;
  };

  const isYearDisabled = (yr: number): boolean => {
    if (maxYM !== null && yr * 100 > maxYM) return true;
    if (minYM !== null && (yr + 1) * 100 - 1 < minYM) return true;
    return false;
  };

  const handleMonthClick = (mIndex: number) => {
    if (isMonthDisabled(mIndex)) return;
    const formatted = `${monthNames[mIndex]} ${String(displayYear).slice(-2)}`;
    onChange(formatted);
    setOpen(false);
  };

  const clear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange("");
    setOpen(false);
  };

  const getSelectedMonth = (): number | null => {
    if (!value) return null;
    if (/^[A-Za-z]{3}\s\d{2}$/.test(value)) return monthNames.indexOf(value.split(" ")[0]);
    if (/^\d{4}-\d{2}$/.test(value)) return parseInt(value.split("-")[1], 10) - 1;
    return null;
  };

  const selectedMonth = getSelectedMonth();

  const dropdown = (
    <div
      className="bg-white rounded-lg shadow-xl border border-gray-100 p-3"
      style={dropdownStyle}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Header: year nav */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => showYearGrid ? setYearRangeStart(s => s - 12) : setDisplayYear(y => y - 1)}
          className="p-1 text-gray-600 hover:text-gray-900 text-lg leading-none"
        >‹</button>
        <button
          type="button"
          onClick={() => setShowYearGrid(v => !v)}
          className="text-sm font-semibold text-[#2557a7] hover:underline"
        >
          {showYearGrid ? `${yearRangeStart} – ${yearRangeStart + 11}` : displayYear}
        </button>
        <button
          type="button"
          onClick={() => showYearGrid ? setYearRangeStart(s => s + 12) : setDisplayYear(y => y + 1)}
          className="p-1 text-gray-600 hover:text-gray-900 text-lg leading-none"
        >›</button>
      </div>

      {showYearGrid ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map(yr => {
            const dis = isYearDisabled(yr);
            return (
              <button
                key={yr}
                type="button"
                disabled={dis}
                onClick={() => { if (!dis) { setDisplayYear(yr); setShowYearGrid(false); } }}
                className={`text-sm py-2 rounded ${
                  yr === displayYear ? "bg-[#2557a7] text-white"
                    : dis ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >{yr}</button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {monthNames.map((m, i) => {
            const isSelected = selectedMonth === i;
            const dis = isMonthDisabled(i);
            return (
              <button
                key={m}
                type="button"
                disabled={dis}
                onClick={() => handleMonthClick(i)}
                className={`text-sm py-2 rounded ${
                  isSelected ? "bg-[#2557a7] text-white"
                    : dis ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >{m}</button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <button type="button" onClick={clear} className="text-xs text-blue-600 hover:underline">
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            const now = new Date();
            onChange(`${monthNames[now.getMonth()]} ${String(now.getFullYear()).slice(-2)}`);
            setOpen(false);
          }}
          className="text-xs text-blue-600 hover:underline"
        >
          This month
        </button>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="relative inline-block w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className="w-full text-left px-3 py-3.5 bg-[#faf9f8] focus:outline-none focus:border-b-2 focus:border-[#2557a7] rounded-md"
      >
        <div className={`text-sm ${value ? "text-black" : "text-gray-500"}`}>
          {value || placeholder || "Select month"}
        </div>
      </button>

      {/* Portal renders into document.body — escapes overflow-y:auto clipping context */}
      {open && mounted && createPortal(dropdown, document.body)}
    </div>
  );
}
