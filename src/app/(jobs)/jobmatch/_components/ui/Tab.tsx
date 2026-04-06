"use client";

import React from "react";

const Tab = ({ label, icon, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`h-9 px-4 rounded-lg text-sm inline-flex items-center gap-2 font-medium transition-all ${
      active
        ? "bg-[#2557a7] text-white shadow-sm"
        : "text-[#6B7280] hover:text-[#374151] hover:bg-gray-50"
    }`}
  >
    {icon}
    {label}
  </button>
);

export default Tab;
