import React from "react";

const JobSkeleton = () => {
  return (
    <>
      <style>{`
        @keyframes cb-shimmer {
          0% { background-position: -800px 0; }
          100% { background-position: 800px 0; }
        }
        .cb-shimmer {
          background: linear-gradient(90deg, #ececec 25%, #e0e0e2 50%, #ececec 75%);
          background-size: 1600px 100%;
          animation: cb-shimmer 1.6s ease-in-out infinite;
        }
      `}</style>
      <div className="bg-white rounded-2xl border border-gray-100/80 shadow-[0_1px_4px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.02)] pl-5 pr-4 pt-4 pb-3.5 overflow-hidden flex">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex gap-4 px-0 pt-0 pb-0">
            {/* Logo placeholder */}
            <div className="w-11 h-11 cb-shimmer rounded-xl shrink-0" />

            <div className="flex-1 min-w-0">
              {/* Time + menu row */}
              <div className="flex items-start justify-between gap-2">
                <div className="h-3 cb-shimmer rounded-lg w-20" />
                <div className="w-7 h-7 cb-shimmer rounded-lg shrink-0" />
              </div>
              {/* Title */}
              <div className="h-4.5 cb-shimmer rounded-lg w-2/3 mt-2" />
              {/* Company */}
              <div className="h-3.5 cb-shimmer rounded-lg w-1/3 mt-1.5" />
            </div>
          </div>

          {/* Metadata grid */}
          <div className="mt-3 px-0 grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="h-3 cb-shimmer rounded-lg w-full" />
            <div className="h-3 cb-shimmer rounded-lg w-3/4" />
            <div className="h-3 cb-shimmer rounded-lg w-2/3" />
            <div className="h-3 cb-shimmer rounded-lg w-full" />
          </div>

          {/* Skill chips */}
          <div className="flex gap-2 mt-3">
            <div className="h-6 cb-shimmer rounded-full w-16" />
            <div className="h-6 cb-shimmer rounded-full w-20" />
            <div className="h-6 cb-shimmer rounded-full w-14" />
            <div className="h-6 cb-shimmer rounded-full w-18" />
          </div>

          <div className="flex-1" />

          {/* Action row */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100/80 bg-[#f9fafb] -mx-5 px-5 -mb-3.5 pb-3">
            <div className="h-3.5 cb-shimmer rounded-lg w-24" />
            <div className="flex gap-2">
              <div className="h-8 w-8 cb-shimmer rounded-xl" />
              <div className="h-8 cb-shimmer rounded-xl w-24" />
              <div className="h-8 cb-shimmer rounded-xl w-20" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobSkeleton;
