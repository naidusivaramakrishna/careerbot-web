


import { TrendingUp } from "lucide-react";

export default function SalaryInsights() {
  return (
    <div className="bg-white rounded-xl border p-4">
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={16} className="text-green-600" />
        <h3 className="font-semibold text-sm">Salary Insights</h3>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Median for UX Designer in Hyderabad
      </p>

      {/* GRAPH */}
      <div className="flex">
        {/* Y AXIS */}
        <div className="flex flex-col justify-between text-[11px] text-gray-400 mr-3 h-[120px]">
          <span>₹36L</span>
          <span>₹27L</span>
          <span>₹18L</span>
          <span>₹9L</span>
          <span>₹0L</span>
        </div>

        {/* BARS */}
        <div className="flex items-end gap-6 h-[120px]">
          {/* Entry */}
          {/* <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-8 bg-gray-300 rounded-md" />
            <span className="text-[11px] text-gray-500">Entry</span>
          </div> */}


<div className="flex flex-col items-center gap-0.5">
  <div className="w-6 h-8 bg-gray-300 rounded-md" />
  <span className="text-[11px] text-gray-600">Entry</span>
  <span className="text-[10px]  text-gray-400 font-semibold"
  >Freasher- ₹8 LPA</span>
</div>

          {/* Mid */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-14 bg-green-500 rounded-md" />
            <span className="text-[11px] text-gray-500">Mid</span>
          </div>

          {/* Senior */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-20 bg-gray-400 rounded-md" />
            <span className="text-[11px] text-gray-500">Senior</span>
          </div>

          {/* Lead */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-24 bg-gray-400 rounded-md" />
            <span className="text-[11px] text-gray-500">Lead</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <p className="text-sm font-semibold mt-4">
        ₹12.0 LPA
        <span className="text-gray-500 font-normal ml-1">
          Market median
        </span>
      </p>
    </div>
  );
}
