// import React, { useEffect, useRef, useState } from "react";

// interface Props {
//   value?: string; // format "YY-MM"
//   onChange: (val: string) => void;
//   placeholder?: string;
//   disabled?: boolean;
// }

// const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// function pad(n: number) {
//   return n < 10 ? `0${n}` : `${n}`;
// }

// export default function MonthYearPicker({ value, onChange, placeholder, disabled }: Props) {
//   const [open, setOpen] = useState(false);
//   const [displayYear, setDisplayYear] = useState<number>(() => {
//     if (value) return 2000 + parseInt(value.split("-")[0], 10);
//     return new Date().getFullYear();
//   });
//   const [mode, setMode] = useState<"year" | "month">("year"); // toggle between year select and month select
//   const ref = useRef<HTMLDivElement | null>(null);

//   const selectedMonth = value ? parseInt(value.split("-")[1], 10) - 1 : null;
//   const selectedYear = value ? 2000 + parseInt(value.split("-")[0], 10) : null;

//   useEffect(() => {
//     function onDoc(e: MouseEvent) {
//       if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
//     }
//     document.addEventListener("mousedown", onDoc);
//     return () => document.removeEventListener("mousedown", onDoc);
//   }, []);

//   useEffect(() => {
//     if (value) {
//       setDisplayYear(2000 + parseInt(value.split("-")[0], 10));
//     }
//   }, [value]);

//   const handleMonthClick = (mIndex: number) => {
//     const shortYear = (displayYear % 100).toString().padStart(2, "0");
//     const val = `${shortYear}-${pad(mIndex + 1)}`;
//     onChange(val);
//     setOpen(false);
//   };

//   const handleYearClick = (year: number) => {
//     setDisplayYear(year);
//     setMode("month");
//   };

//   const clear = (e?: React.MouseEvent) => {
//     e?.stopPropagation();
//     onChange("");
//     setOpen(false);
//   };

//   const currentYear = new Date().getFullYear();
//   const startYear = Math.floor(displayYear / 12) * 12;
//   const yearsToShow = Array.from({ length: 12 }, (_, i) => startYear + i);

//   return (
//     <div ref={ref} className="relative inline-block w-full">
//       <button
//         type="button"
//         disabled={disabled}
//         onClick={() => {
//           setOpen(!open);
//           setMode("year");
//         }}
//         className="w-full text-left px-3 py-2 border-b border-gray-300 focus:outline-none focus:border-b-2 focus:border-blue-500 rounded-none bg-white"
//       >
//         <div className={`text-sm ${value ? "text-black" : "text-gray-500"}`}>
//           {value
//             ? `${monthNames[(selectedMonth ?? 0)]} ${selectedYear}`
//             : placeholder || "Select month"}
//         </div>
//       </button>

//       {open && (
//         <div
//           className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg p-3"
//           style={{ minWidth: 220 }}
//         >
//           {/* Header */}
//           <div className="flex items-center justify-between mb-2">
//             <button
//               type="button"
//               onClick={() => {
//                 if (mode === "month") setMode("year");
//                 else setDisplayYear(displayYear - 12);
//               }}
//               className="p-1 text-gray-600 hover:text-gray-900"
//             >
//               ‹
//             </button>
//             <div className="text-sm font-semibold">
//               {mode === "year" ? `${yearsToShow[0]} - ${yearsToShow[yearsToShow.length - 1]}` : displayYear}
//             </div>
//             <button
//               type="button"
//               onClick={() => {
//                 if (mode === "month") setMode("year");
//                 else setDisplayYear(displayYear + 12);
//               }}
//               className="p-1 text-gray-600 hover:text-gray-900"
//             >
//               ›
//             </button>
//           </div>

//           {/* Year or Month Grid */}
//           {mode === "year" ? (
//             <div className="grid grid-cols-3 gap-2">
//               {yearsToShow.map((y) => {
//                 const isSelected = selectedYear === y;
//                 return (
//                   <button
//                     key={y}
//                     type="button"
//                     onClick={() => handleYearClick(y)}
//                     className={`text-sm py-2 rounded ${
//                       isSelected ? "bg-gray-800 text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"
//                     }`}
//                   >
//                     {y}
//                   </button>
//                 );
//               })}
//             </div>
//           ) : (
//             <div className="grid grid-cols-3 gap-2">
//               {monthNames.map((m, i) => {
//                 const isSelected = selectedMonth === i && selectedYear === displayYear;
//                 return (
//                   <button
//                     key={m}
//                     type="button"
//                     onClick={() => handleMonthClick(i)}
//                     className={`text-sm py-2 rounded ${
//                       isSelected ? "bg-gray-800 text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"
//                     }`}
//                   >
//                     {m}
//                   </button>
//                 );
//               })}
//             </div>
//           )}

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
//                 const shortYear = (now.getFullYear() % 100).toString().padStart(2, "0");
//                 onChange(`${shortYear}-${pad(now.getMonth() + 1)}`);
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


// import React, { useEffect, useRef, useState } from "react";

// interface Props {
//   value?: string; // format "YYYY-MM"
//   onChange: (val: string) => void;
//   placeholder?: string;
//   disabled?: boolean;
// }

// const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// function pad(n: number) {
//   return n < 10 ? `0${n}` : `${n}`;
// }

// export default function MonthYearPicker({ value, onChange, placeholder, disabled }: Props) {
//   const [open, setOpen] = useState(false);
//   const [view, setView] = useState<"month" | "year">("month"); // month or year view
//   const [displayYear, setDisplayYear] = useState<number>(() => {
//     if (value) return parseInt(value.split("-")[0], 10);
//     return new Date().getFullYear();
//   });
//   const ref = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     function onDoc(e: MouseEvent) {
//       if (ref.current && !ref.current.contains(e.target as Node)) {
//         setOpen(false);
//         setView("month");
//       }
//     }
//     document.addEventListener("mousedown", onDoc);
//     return () => document.removeEventListener("mousedown", onDoc);
//   }, []);

//   useEffect(() => {
//     if (value) {
//       setDisplayYear(parseInt(value.split("-")[0], 10));
//     }
//   }, [value]);

//   const handleMonthClick = (mIndex: number) => {
//     const val = `${displayYear}-${pad(mIndex + 1)}`;
//     onChange(val);
//     setOpen(false);
//     setView("month");
//   };

//   const handleYearClick = (year: number) => {
//     setDisplayYear(year);
//     setView("month");
//   };

//   const clear = (e?: React.MouseEvent) => {
//     e?.stopPropagation();
//     onChange("");
//     setOpen(false);
//     setView("month");
//   };

//   const selectedMonth = value ? parseInt(value.split("-")[1], 10) - 1 : null;
//   const selectedYear = value ? parseInt(value.split("-")[0], 10) : null;

//   // Generate year grid (current year - 10 to current year + 10)
// //   const currentYear = new Date().getFullYear();
//   const yearGridStart = Math.floor(displayYear / 20) * 20;
//   const years = Array.from({ length: 20 }, (_, i) => yearGridStart + i);

//   return (
//     <div ref={ref} className="relative inline-block w-full">
//       <button
//         type="button"
//         disabled={disabled}
//         onClick={() => setOpen(!open)}
//         className="w-full text-left px-3 py-3.5 bg-[#faf9f8] focus:outline-none focus:border-b-2 focus:border-[#2557a7] rounded-none"
//       >
//         <div className={`text-sm ${value ? "text-black" : "text-gray-500"}`}>
//           {value ? `${monthNames[(selectedMonth ?? 0)]} ${selectedYear ? String(selectedYear).slice(-2) : ""}` : (placeholder || "Select month")}
//         </div>
//       </button>

//       {open && (
//         <div
//           className="absolute z-50 mt-2 w-48 bg-white rounded-lg shadow-lg p-3"
//           style={{ minWidth: 220 }}
//         >
//           {view === "month" ? (
//             <>
//               <div className="flex items-center justify-between mb-2">
//                 <button
//                   type="button"
//                   onClick={() => setDisplayYear(displayYear - 1)}
//                   className="p-1 text-gray-600 hover:text-gray-900"
//                 >
//                   ‹
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setView("year")}
//                   className="text-sm font-semibold text-[#2557a7] cursor-pointer"
//                 >
//                   {displayYear}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setDisplayYear(displayYear + 1)}
//                   className="p-1 text-gray-600 hover:text-gray-900"
//                 >
//                   ›
//                 </button>
//               </div>

//               <div className="grid grid-cols-3 gap-2">
//                 {monthNames.map((m, i) => {
//                   const isSelected = selectedMonth === i && selectedYear === displayYear;
//                   return (
//                     <button
//                       key={m}
//                       type="button"
//                       onClick={() => handleMonthClick(i)}
//                       className={`text-sm py-2 rounded ${isSelected ? "bg-gray-800 text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"}`}
//                     >
//                       {m}
//                     </button>
//                   );
//                 })}
//               </div>

//               <div className="flex items-center justify-between mt-3">
//                 <button
//                   type="button"
//                   onClick={(e) => { clear(e); }}
//                   className="text-xs text-blue-600 hover:underline"
//                 >
//                   Clear
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     const now = new Date();
//                     setDisplayYear(now.getFullYear());
//                     onChange(`${now.getFullYear()}-${pad(now.getMonth()+1)}`);
//                     setOpen(false);
//                   }}
//                   className="text-xs text-blue-600 hover:underline"
//                 >
//                   This month
//                 </button>
//               </div>
//             </>
//           ) : (
//             <>
//               <div className="flex items-center justify-between mb-2">
//                 <button
//                   type="button"
//                   onClick={() => setDisplayYear(displayYear - 20)}
//                   className="p-1 text-gray-600 hover:text-gray-900"
//                 >
//                   ‹
//                 </button>
//                 <div className="text-sm font-semibold text-[#2557a7]">
//                   {yearGridStart} - {yearGridStart + 19}
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => setDisplayYear(displayYear + 20)}
//                   className="p-1 text-gray-600 hover:text-gray-900"
//                 >
//                   ›
//                 </button>
//               </div>

//               <div className="grid grid-cols-4 gap-2">
//                 {years.map((year) => {
//                   const isSelected = selectedYear === year;
//                   return (
//                     <button
//                       key={year}
//                       type="button"
//                       onClick={() => handleYearClick(year)}
//                       className={`text-sm py-2 rounded ${isSelected ? "bg-gray-800 text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"}`}
//                     >
//                       {year}
//                     </button>
//                   );
//                 })}
//               </div>

//               <div className="flex items-center justify-center mt-3">
//                 <button
//                   type="button"
//                   onClick={() => setView("month")}
//                   className="text-xs text-blue-600 hover:underline"
//                 >
//                   Back to Months
//                 </button>
//               </div>
//             </>
//           )}
//         </div>
//       )}
//     </div>
//   );
// } before date issue


import React, { useEffect, useRef, useState } from "react";

interface Props {
  value?: string; // expected format: "MMM YY" (e.g., "Jun 24")
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function MonthYearPicker({
  value = "",
  onChange,
  placeholder,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [displayYear, setDisplayYear] = useState<number>(() => {
    if (value && /^[A-Za-z]{3}\s\d{2}$/.test(value)) {
      return 2000 + parseInt(value.split(" ")[1]);
    }
    if (/^\d{4}-\d{2}$/.test(value)) {
      return parseInt(value.split("-")[0]);
    }
    return new Date().getFullYear();
  });

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handleMonthClick = (mIndex: number) => {
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
        className="w-full text-left px-3 py-3.5 bg-[#faf9f8] focus:outline-none focus:border-b-2 focus:border-[#2557a7] rounded-none"
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
              onClick={() => setDisplayYear(displayYear - 1)}
              className="p-1 text-gray-600 hover:text-gray-900"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-[#2557a7]">
              {displayYear}
            </span>
            <button
              type="button"
              onClick={() => setDisplayYear(displayYear + 1)}
              className="p-1 text-gray-600 hover:text-gray-900"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {monthNames.map((m, i) => {
              const isSelected = selectedMonth === i;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonthClick(i)}
                  className={`text-sm py-2 rounded ${
                    isSelected
                      ? "bg-gray-800 text-white"
                      : "bg-transparent text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

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

