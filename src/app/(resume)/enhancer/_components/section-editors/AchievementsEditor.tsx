"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus, Check } from "lucide-react";
import RichTextEditorField from "./RichTextEditorField";

interface AchievementItemForm {
  title: string;
  date: string;
  description: string;
}

interface Props {
  formData: {
    items: AchievementItemForm[];
    activeIndex: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFormData: (data: any) => void;
}

const EXAMPLE_ACHIEVEMENTS = [
  {
    id: "ach-1",
    text: "Recipient of the Innovation Award for developing a novel approach to problem-solving",
  },
  {
    id: "ach-2",
    text: "Published research paper on advanced technologies in a peer-reviewed journal",
  },
  {
    id: "ach-3",
    text: "Awarded Employee of the Month for outstanding performance and leadership",
  },
  {
    id: "ach-4",
    text: "Ranked top 1% in industry certification exams",
  },
  {
    id: "ach-5",
    text: "Successful completion of advanced professional development program",
  },
  {
    id: "ach-6",
    text: "Recognized for implementing cost-saving initiative that improved operational efficiency",
  },
  {
    id: "ach-7",
    text: "Award-winning project that increased productivity by 40%",
  },
];

const emptyItem: AchievementItemForm = {
  title: "",
  date: "",
  description: "",
};

export default function AchievementsEditor({ formData, setFormData }: Props) {
  const [search, setSearch] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"tips" | "examples">("tips");

  const items =
    formData?.items && formData.items.length > 0
      ? formData.items
      : [emptyItem];

  const activeIndex = formData?.activeIndex ?? 0;
  const current: AchievementItemForm = items[activeIndex] || emptyItem;

  const { title, date, description } = current;

  /* ================= HELPERS ================= */
  const updateCurrent = (patch: Partial<AchievementItemForm>) => {
    const nextItems = [...items];
    nextItems[activeIndex] = { ...current, ...patch };
    setFormData({
      ...formData,
      items: nextItems,
      activeIndex,
    });
  };

  const filteredExamples = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return EXAMPLE_ACHIEVEMENTS;
    return EXAMPLE_ACHIEVEMENTS.filter((ex) =>
      ex.text.toLowerCase().includes(term)
    );
  }, [search]);

  const addExampleDescription = (example: (typeof EXAMPLE_ACHIEVEMENTS)[0]) => {
    const currentText = description.trim();
    const newText = currentText
      ? `${currentText}\n• ${example.text}`
      : `• ${example.text}`;

    updateCurrent({ description: newText });
    setAddedIds((prev) => new Set([...Array.from(prev), example.id]));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* ================= LEFT SIDE ================= */}
      <div className="md:col-span-2 space-y-6">
        {/* Achievement Title */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Achievement Title <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => updateCurrent({ title: e.target.value })}
            placeholder="e.g. Employee of the Month Award"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Date
          </label>
          <input
            value={date}
            onChange={(e) => updateCurrent({ date: e.target.value })}
            placeholder="YYYY or Month YYYY"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            e.g. 2024 or January 2024
          </p>
        </div>

        {/* Achievement Description */}
        <RichTextEditorField
          label="Achievement description"
          value={description}
          onChange={(val) => updateCurrent({ description: val })}
          placeholder="Describe your achievement, what you accomplished, and why it matters..."
          minHeight="140px"
        />
      </div>

      {/* ================= RIGHT SIDE - TIPS & EXAMPLES ================= */}
      <div className="border-l pl-6 h-[500px] flex flex-col">
        {/* TABS */}
        <div className="flex gap-6 text-sm font-medium border-b mb-4 flex-shrink-0">
          <button
            onClick={() => setActiveTab("tips")}
            className={`pb-2 transition-colors ${
              activeTab === "tips"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
          >
            Tips
          </button>

          <button
            onClick={() => setActiveTab("examples")}
            className={`pb-2 transition-colors ${
              activeTab === "examples"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
          >
            Examples
          </button>
        </div>

        {/* ================= TIPS ================= */}
        {activeTab === "tips" && (
          <div className="text-sm text-gray-700 space-y-4 flex-1 overflow-y-auto">
            <p>
              Achievements and awards demonstrate excellence and recognition in
              your field.
            </p>

            <p>
              Highlight specific accomplishments that set you apart from other
              candidates.
            </p>

            <p>
              Include the achievement title, date received, and a brief description
              of its significance. Quantify your achievements with rankings,
              percentages, or competitive metrics whenever possible.
            </p>

            <p className="text-xs text-gray-500 italic">
              *70% of hiring managers value recognition and awards on resumes
            </p>
          </div>
        )}

        {/* ================= EXAMPLES ================= */}
        {activeTab === "examples" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* SEARCH */}
            <div className="relative mb-4 flex-shrink-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search achievements"
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* EXAMPLE LIST */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {filteredExamples.map((item) => {
                const isAdded = addedIds.has(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => addExampleDescription(item)}
                    disabled={isAdded}
                    className={`
                      w-full flex items-start gap-3 px-3 py-3 rounded-lg border text-left
                      ${
                        isAdded
                          ? "bg-blue-50 border-blue-600 text-blue-700 cursor-default"
                          : "bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-600"
                      }
                    `}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isAdded ? (
                        <Check className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Plus className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
