"use client";

import React, { useMemo, useState } from "react";
import { Plus, Check, Search } from "lucide-react";
import RichTextEditorField from "./RichTextEditorField";

export interface ExperienceItemForm {
  company: string;
  role: string;
  location: string;
  client: string;
  years: string;
  duration: string;
  description: string;
}

interface Props {
  formData: {
    items: ExperienceItemForm[];
    activeIndex: number;
  };
  setFormData: (data: { items: ExperienceItemForm[]; activeIndex: number }) => void;
}

/* ================= EXAMPLE DATA ================= */

type ExampleItem = {
  id: string;
  title: string;
  text: string;
};

const EXPERIENCE_EXAMPLES: ExampleItem[] = [
  {
    id: "exp-1",
    title: "Software Engineer",
    text: "Developed custom software solutions for [x] customers.",
  },
  {
    id: "exp-2",
    title: "Software Engineer",
    text: "Performed software testing, provided 24/7 support to clients, and developed plans for future software development.",
  },
  {
    id: "exp-3",
    title: "Software Engineer",
    text: "Designed and implemented a software-as-a-service platform for [x] customers.",
  },
  {
    id: "exp-4",
    title: "Software Engineer",
    text: "Designed and built new business applications, including CRM, ERP, and supply chain software.",
  },
  {
    id: "exp-5",
    title: "Software Engineer",
    text: "Maintained software products including programs, webpages, and databases.",
  },
];

const emptyItem: ExperienceItemForm = {
  company: "",
  role: "",
  location: "",
  client: "",
  years: "",
  duration: "",
  description: "",
};

/* ================= COMPONENT ================= */

export default function ExperienceEditor({ formData, setFormData }: Props) {
  const [activeTab, setActiveTab] = useState<"tips" | "examples">("tips");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [durationMode, setDurationMode] = useState<"text" | "date">("text");

  const items =
    formData?.items && formData.items.length > 0
      ? formData.items
      : [emptyItem];

  const activeIndex = formData?.activeIndex ?? 0;
  const current: ExperienceItemForm = items[activeIndex] || emptyItem;

  const { company, role, location, client, years, duration, description } = current;

  const [search, setSearch] = useState(role || "");

  /* ---------- HELPERS ---------- */
  const updateCurrent = (patch: Partial<ExperienceItemForm>) => {
    const nextItems = [...items];
    nextItems[activeIndex] = { ...current, ...patch };
    setFormData({
      ...formData,
      items: nextItems,
      activeIndex,
    });
  };

  /* ---------- FORMAT MONTH TO READABLE ---------- */
  const formatMonth = (monthValue: string) => {
    if (!monthValue) return "";
    const [year, month] = monthValue.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  /* ---------- FILTER BY ROLE / SEARCH ---------- */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return EXPERIENCE_EXAMPLES;
    return EXPERIENCE_EXAMPLES.filter(
      (e) =>
        e.title.toLowerCase().includes(term) ||
        e.text.toLowerCase().includes(term)
    );
  }, [search]);

  /* ---------- ADD BULLET LINE ---------- */
  const addExample = (item: ExampleItem) => {
    if (addedIds.has(item.id)) return;

    const currentText = description.trim();
    const bullet = `• ${item.text}`;
    const updated =
      currentText.length > 0 ? `${currentText}\n${bullet}` : bullet;

    updateCurrent({ description: updated });
    setAddedIds((prev) => new Set([...Array.from(prev), item.id]));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* ================= LEFT ================= */}
      <div className="md:col-span-2 space-y-4">
        {/* Company/Organization */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block text-gray-700">
            Company / Organization
          </label>
          <input
            value={company}
            onChange={(e) => updateCurrent({ company: e.target.value })}
            placeholder="e.g., Google, Microsoft, Acme Inc."
            className="w-full px-4 py-2.5 rounded-xl bg-gray-100 text-gray-900 border border-transparent focus:outline-none focus:border-[#2557a7] focus:ring-0 transition-colors"
          />
        </div>

        {/* Role + Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-1.5 block text-gray-700">
              Role or job title
            </label>
            <input
              value={role}
              onChange={(e) => updateCurrent({ role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-100 text-gray-900 border border-transparent focus:outline-none focus:border-[#2557a7] focus:ring-0 transition-colors"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block text-gray-700">
              Location
            </label>
            <input
              value={location}
              onChange={(e) =>
                updateCurrent({ location: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-gray-100 text-gray-900 border border-transparent focus:outline-none focus:border-[#2557a7] focus:ring-0 transition-colors"
            />
          </div>
        </div>

        {/* Client + Years */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-1.5 block text-gray-700">
              Client (optional)
            </label>
            <input
              value={client}
              onChange={(e) => updateCurrent({ client: e.target.value })}
              placeholder="e.g., Amazon, Netflix"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-100 text-gray-900 border border-transparent focus:outline-none focus:border-[#2557a7] focus:ring-0 transition-colors"
            />
          </div>

        </div>

        {/* Duration */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-gray-700">Duration</label>
            <button
              type="button"
              onClick={() => setDurationMode(durationMode === "text" ? "date" : "text")}
              className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              {durationMode === "text" ? "Use Dates" : "Use Text"}
            </button>
          </div>

          {durationMode === "date" ? (
            // Date Range Mode
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="month"
                  onChange={(e) => {
                    const startFormatted = formatMonth(e.target.value);
                    const parts = duration?.split(" - ") || [];
                    const end = parts[1] || "";
                    updateCurrent({ duration: startFormatted + (end ? " - " + end : "") });
                  }}
                  placeholder="Start Date"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-100 text-gray-900 border border-transparent focus:outline-none focus:border-[#2557a7] focus:ring-0 transition-colors"
                />
              </div>
              <div className="relative">
                <input
                  type="month"
                  onChange={(e) => {
                    const parts = duration?.split(" - ") || [];
                    const start = parts[0] || "";
                    const endFormatted = formatMonth(e.target.value);
                    updateCurrent({ duration: start + " - " + endFormatted });
                  }}
                  placeholder="End Date"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-100 text-gray-900 border border-transparent focus:outline-none focus:border-[#2557a7] focus:ring-0 transition-colors"
                />
              </div>
            </div>
          ) : (
            // Text Duration Mode
            <input
              type="text"
              value={duration}
              onChange={(e) => updateCurrent({ duration: e.target.value })}
              placeholder="e.g., 2 years, 3.5 years, Jan 2022 - Present"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-100 text-gray-900 border border-transparent focus:outline-none focus:border-[#2557a7] focus:ring-0 transition-colors"
            />
          )}

          <p className="text-xs text-gray-500 mt-2">
            {durationMode === "date"
              ? "Select start and end dates"
              : "Type duration like '2 years' or date range like 'Jan 2022 - Present'"}
          </p>
        </div>

        {/* Description editor */}
        <RichTextEditorField
          label="Work description"
          value={description}
          onChange={(val) => updateCurrent({ description: val })}
          placeholder="Describe your responsibilities, achievements, and impact..."
          minHeight="160px"
        />
      </div>

      {/* ================= RIGHT ================= */}
      <div className="pl-4 border-l border-gray-200">
        {/* Tabs */}
        <div className="flex gap-6 text-sm font-semibold border-b border-gray-200 mb-3">
          <button
            onClick={() => setActiveTab("tips")}
            className={`pb-2 transition-colors ${
              activeTab === "tips"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Tips
          </button>

          <button
            onClick={() => setActiveTab("examples")}
            className={`pb-2 transition-colors ${
              activeTab === "examples"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Examples
          </button>
        </div>

        {/* Tips side */}
        {activeTab === "tips" && (
          <div className="text-sm text-gray-700 space-y-3">
            <p>
              Show that you create value with your work by listing
              responsibilities and quantifiable achievements in this section.
            </p>
            <p className="text-xs text-gray-400">
              *Indeed survey conducted with Lucid, N=2661 employers among 10
              industries.
            </p>
          </div>
        )}

        {/* Examples side */}
        {activeTab === "examples" && (
          <>
            {/* Search box */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job titles"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Example cards */}
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {filtered.map((item) => {
                const isAdded = addedIds.has(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addExample(item)}
                    className={`w-full text-left flex gap-2.5 items-start px-3 py-2.5 rounded-lg border transition-colors ${
                      isAdded
                        ? "bg-blue-50 border-blue-600 text-blue-700 cursor-default"
                        : "bg-white border-gray-300 cursor-pointer hover:bg-blue-50 hover:border-blue-600"
                    }`}
                  >
                    {isAdded ? (
                      <Check className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Plus className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                    )}

                    <p className="text-sm leading-5">{item.text}</p>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
