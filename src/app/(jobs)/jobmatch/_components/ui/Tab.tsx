"use client";

import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Tab = ({ label, icon, active, onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`h-9 px-4 rounded-lg inline-flex items-center gap-2 font-medium transition-all ${
      active
        ? "bg-[#2557A7] text-white shadow-sm text-label"
        : "text-[#475467] hover:text-[#344054] hover:bg-gray-50 text-label"
    }`}
  >
    {icon}
    {label}
  </button>
);

export default Tab;
