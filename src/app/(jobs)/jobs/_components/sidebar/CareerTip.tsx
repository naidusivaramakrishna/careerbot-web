
// "use client";

// export default function CareerTip() {
//   return (
//     <div className="bg-white rounded-xl  p-4 space-y-5">
//       <h3 className="font-semibold">Career Tips</h3>

//       <div className="border  rounded-lg p-3">
//         <p className="text-sm font-medium text-indigo-600">
//           Improve Skill
//         </p>
//         <p className="text-sm text-gray-500">
//           Adding “Figma Prototyping” could increase your match by 15%.
//         </p>
//       </div>

//       <div className="border rounded-lg p-4">
//         <p className="text-sm font-medium text-green-600">
//           Market Trend
//         </p>
//         <p className="text-sm text-gray-500">
//           Fintech companies are hiring 20% more designers this month.
//         </p>
//       </div>
//     </div>
//   );
// }


"use client";

import { Lightbulb, BarChart3 } from "lucide-react";

export default function CareerTip() {
  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <h3 className="font-semibold">Career Tips</h3>

      <div className="border rounded-lg p-3">
        <p className="flex items-center gap-2 text-sm font-medium text-indigo-600">
          <Lightbulb size={14} />
          Improve Skill
        </p>
        <p className="text-sm text-gray-500">
          Adding “Figma Prototyping” could increase your match by 15%.
        </p>
      </div>

      <div className="border rounded-lg p-3">
        <p className="flex items-center gap-2 text-sm font-medium text-green-600">
          <BarChart3 size={14} />
          Market Trend
        </p>
        <p className="text-sm text-gray-500">
          Fintech companies are hiring 20% more designers this month.
        </p>
      </div>
    </div>
  );
}
