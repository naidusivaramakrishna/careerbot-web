// import React, { useEffect, useRef, useState } from "react";

// interface Props {
//   value?: string; // expected format: "MMM YY" (e.g., "Jun 24")
//   onChange: (val: string) => void;
//   placeholder?: string;
//   disabled?: boolean;
// }

// const monthNames = [
//   "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
// ];

// export default function MonthYearPicker({
//   value = "",
//   onChange,
//   placeholder,
//   disabled,
// }: Props) {
//   const [open, setOpen] = useState(false);
//   const [displayYear, setDisplayYear] = useState<number>(() => {
//     if (value && /^[A-Za-z]{3}\s\d{2}$/.test(value)) {
//       return 2000 + parseInt(value.split(" ")[1]);
//     }
//     if (/^\d{4}-\d{2}$/.test(value)) {
//       return parseInt(value.split("-")[0]);
//     }
//     return new Date().getFullYear();
//   });

//   const ref = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     const onDoc = (e: MouseEvent) => {
//       if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
//     };
//     document.addEventListener("mousedown", onDoc);
//     return () => document.removeEventListener("mousedown", onDoc);
//   }, []);

//   const handleMonthClick = (mIndex: number) => {
//     const formatted = `${monthNames[mIndex]} ${String(displayYear).slice(-2)}`;
//     onChange(formatted);
//     setOpen(false);
//   };

//   const clear = (e?: React.MouseEvent) => {
//     e?.stopPropagation();
//     onChange("");
//     setOpen(false);
//   };

//   const getSelectedMonth = (): number | null => {
//     if (!value) return null;

//     if (/^[A-Za-z]{3}\s\d{2}$/.test(value)) {
//       const monthAbbr = value.split(" ")[0];
//       return monthNames.indexOf(monthAbbr);
//     }

//     if (/^\d{4}-\d{2}$/.test(value)) {
//       const [, m] = value.split("-");
//       return parseInt(m, 10) - 1;
//     }

//     return null;
//   };

//   const selectedMonth = getSelectedMonth();

//   return (
//     <div ref={ref} className="relative inline-block w-full">
//       <button
//         type="button"
//         disabled={disabled}
//         onClick={() => setOpen(!open)}
//         className="w-full text-left px-3 py-3.5 bg-[#faf9f8] focus:outline-none focus:border-b-2 focus:border-[#2557a7] rounded-none"
//       >
//         <div className={`text-sm ${value ? "text-black" : "text-gray-500"}`}>
//           {value || placeholder || "Select month"}
//         </div>
//       </button>

//       {open && (
//         <div
//           className="fixed z-[999] bg-white rounded-lg shadow-lg p-3"
//           style={{
//             minWidth: 220,
//             top: ref.current ? ref.current.getBoundingClientRect().bottom + 8 : 0,
//             left: ref.current ? ref.current.getBoundingClientRect().left : 0
//           }}
//         >
//           <div className="flex items-center justify-between mb-2">
//             <button
//               type="button"
//               onClick={() => setDisplayYear(displayYear - 1)}
//               className="p-1 text-gray-600 hover:text-gray-900"
//             >
//               ‹
//             </button>
//             <span className="text-sm font-semibold text-[#2557a7]">
//               {displayYear}
//             </span>
//             <button
//               type="button"
//               onClick={() => setDisplayYear(displayYear + 1)}
//               className="p-1 text-gray-600 hover:text-gray-900"
//             >
//               ›
//             </button>
//           </div>

//           <div className="grid grid-cols-3 gap-2">
//             {monthNames.map((m, i) => {
//               const isSelected = selectedMonth === i;
//               return (
//                 <button
//                   key={m}
//                   type="button"
//                   onClick={() => handleMonthClick(i)}
//                   className={`text-sm py-2 rounded ${
//                     isSelected
//                       ? "bg-gray-800 text-white"
//                       : "bg-transparent text-gray-700 hover:bg-gray-100"
//                   }`}
//                 >
//                   {m}
//                 </button>
//               );
//             })}
//           </div>

//           <div className="flex items-center justify-between mt-3">
//             <button
//               type="button"
//               onClick={(e) => clear(e)}
//               className="text-xs text-blue-600 hover:underline"
//             >
//               Clear
//             </button>
//             <button
//               type="button"
//               onClick={() => {
//                 const now = new Date();
//                 const formatted = `${monthNames[now.getMonth()]} ${String(
//                   now.getFullYear()
//                 ).slice(-2)}`;
//                 onChange(formatted);
//                 setOpen(false);
//               }}
//               className="text-xs text-blue-600 hover:underline"
//             >
//               This month
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useEffect, useRef, useState } from "react";

interface Props {
  value?: string; // expected format: "MMM YY" (e.g., "Jun 24")
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: string; // same format as value — selection must be >= this
  maxDate?: string; // same format as value — selection must be <= this
}

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Parse "MMM YY" or "YYYY-MM" into a comparable number (YYYYMM)
function toYearMonth(date: string): number | null {
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

export default function MonthYearPicker({
  value = "",
  onChange,
  placeholder,
  disabled,
  minDate,
  maxDate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showYearGrid, setShowYearGrid] = useState(false);
  const [displayYear, setDisplayYear] = useState<number>(() => {
    if (value && /^[A-Za-z]{3}\s\d{2}$/.test(value)) {
      return 2000 + parseInt(value.split(" ")[1]);
    }
    if (/^\d{4}-\d{2}$/.test(value)) {
      return parseInt(value.split("-")[0]);
    }
    return new Date().getFullYear();
  });
  const [yearRangeStart, setYearRangeStart] = useState<number>(() => {
    const base = new Date().getFullYear();
    return base - 7;
  });

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const minYM = toYearMonth(minDate ?? "");
  const maxYM = toYearMonth(maxDate ?? "");

  const isMonthDisabled = (mIndex: number): boolean => {
    const ym = displayYear * 100 + mIndex;
    if (minYM !== null && ym < minYM) return true;
    if (maxYM !== null && ym > maxYM) return true;
    return false;
  };

  const isYearDisabled = (yr: number): boolean => {
    // Disable year if all 12 months are out of range
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

    if (/^[A-Za-z]{3}\s\d{2}$/.test(value)) {
      const monthAbbr = value.split(" ")[0];
      return monthNames.indexOf(monthAbbr);
    }

    if (/^\d{4}-\d{2}$/.test(value)) {
      const [, m] = value.split("-");
      return parseInt(m, 10) - 1;
    }

    return null;
  };

  const selectedMonth = getSelectedMonth();

  return (
    <div ref={ref} className="relative inline-block w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full text-left px-3 py-3.5 bg-[#faf9f8] focus:outline-none focus:border-b-2 focus:border-[#2557a7] rounded-md"
      >
        <div className={`text-sm ${value ? "text-black" : "text-gray-500"}`}>
          {value || placeholder || "Select month"}
        </div>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg p-3"
          style={{ minWidth: 220 }}
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => {
                if (showYearGrid) {
                  setYearRangeStart(s => s - 12);
                } else {
                  setDisplayYear(displayYear - 1);
                }
              }}
              className="p-1 text-gray-600 hover:text-gray-900"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setShowYearGrid(!showYearGrid)}
              className="text-sm font-semibold text-[#2557a7] hover:underline"
            >
              {showYearGrid ? `${yearRangeStart} – ${yearRangeStart + 11}` : displayYear}
            </button>
            <button
              type="button"
              onClick={() => {
                if (showYearGrid) {
                  setYearRangeStart(s => s + 12);
                } else {
                  setDisplayYear(displayYear + 1);
                }
              }}
              className="p-1 text-gray-600 hover:text-gray-900"
            >
              ›
            </button>
          </div>

          {showYearGrid ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((yr) => {
                const disabled = isYearDisabled(yr);
                return (
                  <button
                    key={yr}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (!disabled) {
                        setDisplayYear(yr);
                        setShowYearGrid(false);
                      }
                    }}
                    className={`text-sm py-2 rounded ${
                      yr === displayYear
                        ? "bg-[#2557a7] text-white"
                        : disabled
                        ? "text-gray-300 cursor-not-allowed"
                        : "bg-transparent text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {monthNames.map((m, i) => {
                const isSelected = selectedMonth === i;
                const disabled = isMonthDisabled(i);
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleMonthClick(i)}
                    className={`text-sm py-2 rounded ${
                      isSelected
                        ? "bg-[#2557a7] text-white"
                        : disabled
                        ? "text-gray-300 cursor-not-allowed"
                        : "bg-transparent text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <button
              type="button"
              onClick={(e) => clear(e)}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const formatted = `${monthNames[now.getMonth()]} ${String(
                  now.getFullYear()
                ).slice(-2)}`;
                onChange(formatted);
                setOpen(false);
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              This month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


