"use client";

import { Star } from "lucide-react";

export default function TopPickCard() {
  return (
    <div>
      <div className="bg-yellow-50 border rounded-xl p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-4">
          <Star size={14} className="text-yellow-500" />
          Top Picks For You
        </h3>

        <div className="space-y-4 text-sm">
          {/* ITEM 1 */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">Sr. UX Designer</p>
              <p className="text-gray-500">Cognizant • Mumbai</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              98% Match
            </span>
          </div>

          {/* ITEM 2 */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">UX Researcher</p>
              <p className="text-gray-500">Deloitte • Pune</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              96% Match
            </span>
          </div>

          {/* ITEM 3 */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">Sr. Product Designer</p>
              <p className="text-gray-500">Infosys • Chennai</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              94% Match
            </span>
          </div>
        </div>
      </div>

      <button className="mt-3 text-sm text-indigo-600">
        View all recommendations →
      </button>
    </div>
  );
}
