"use client";

import {
  Briefcase,
  User,
  FileText,
  Search,
  Bookmark,
  Bot,
} from "lucide-react";

export default function LeftSidebar() {
  return (
    <div className="h-screen w-[72px] bg-white border-r flex flex-col items-center py-4 gap-6">
      {/* HEADER (LOGO + TITLE) */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
          <Bot/>
          
        </div>
        <span className="text-[11px] font-semibold text-gray-800">
          CareerBot
        </span>
      </div>

      {/* MENU */}
      <nav className="flex flex-col gap-5 mt-6">
        <SidebarItem icon={<User size={18} />} label="Profile" />
        <SidebarItem icon={<FileText size={18} />} label="Resume" />
        <SidebarItem icon={<Search size={18} />} label="ATS Scan" />
        <SidebarItem
          icon={<Briefcase size={18} />}
          label="Jobs"
          active
        />
        <SidebarItem icon={<Bookmark size={18} />} label="Job Match" />
      </nav>
    </div>
  );
}

/* 🔹 Reusable Sidebar Item */
function SidebarItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer">
      <div
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition
          ${
            active
              ? "bg-indigo-50 text-indigo-600"
              : "text-gray-500 hover:bg-gray-100"
          }`}
      >
        {icon}
      </div>

      <span
        className={`text-[11px] leading-none ${
          active ? "text-indigo-600 font-medium" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}





