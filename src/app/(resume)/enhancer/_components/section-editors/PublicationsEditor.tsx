"use client";

import React from "react";

interface PublicationItemForm {
  title: string;
  authors: string;
  publicationName: string;
  date: string;
  url: string;
}

interface Props {
  formData: {
    items: PublicationItemForm[];
    activeIndex: number;
  };
  setFormData: (data: any) => void;
}

const emptyItem: PublicationItemForm = {
  title: "",
  authors: "",
  publicationName: "",
  date: "",
  url: "",
};

export default function PublicationsEditor({ formData, setFormData }: Props) {
  const items =
    formData?.items && formData.items.length > 0
      ? formData.items
      : [emptyItem];

  const activeIndex = formData?.activeIndex ?? 0;
  const current: PublicationItemForm = items[activeIndex] || emptyItem;

  const { title, authors, publicationName, date, url } = current;

  /* ================= HELPERS ================= */
  const updateCurrent = (patch: Partial<PublicationItemForm>) => {
    const nextItems = [...items];
    nextItems[activeIndex] = { ...current, ...patch };
    setFormData({
      ...formData,
      items: nextItems,
      activeIndex,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* ================= LEFT SIDE ================= */}
      <div className="md:col-span-2 space-y-6">
        {/* Publication Title */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Publication Title <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => updateCurrent({ title: e.target.value })}
            placeholder="Title of your publication"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
          />
        </div>

        {/* Authors */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Authors
          </label>
          <input
            value={authors}
            onChange={(e) => updateCurrent({ authors: e.target.value })}
            placeholder="Your name and co-authors"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
          />
        </div>

        {/* Publication Name */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Publication Name <span className="text-red-500">*</span>
          </label>
          <input
            value={publicationName}
            onChange={(e) => updateCurrent({ publicationName: e.target.value })}
            placeholder="Journal, Magazine, or Website name"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
          />
        </div>

        {/* Date & URL */}
        <div className="grid grid-cols-2 gap-4">
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
            <p className="text-xs text-gray-500 mt-1">e.g. 2024 or January 2024</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              URL
            </label>
            <input
              value={url}
              onChange={(e) => updateCurrent({ url: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:border-blue-700 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE - TIPS ================= */}
      <div className="border-l pl-6">
        <h4 className="text-sm font-semibold mb-4 text-gray-900">Tips</h4>

        <div className="text-sm text-gray-700 space-y-4 max-h-[400px] overflow-y-auto">
          <p>
            Publications demonstrate expertise and thought leadership. Include
            peer-reviewed articles, blog posts, whitepapers, and research papers
            you have authored or co-authored.
          </p>

          <p>
            Include the publication title, your name and co-authors, the
            publication venue (journal, magazine, or website), date of
            publication, and a link to access it.
          </p>

          <p className="text-xs text-gray-500 italic">
            *Publications increase credibility and demonstrate
          </p>
        </div>
      </div>
    </div>
  );
}
