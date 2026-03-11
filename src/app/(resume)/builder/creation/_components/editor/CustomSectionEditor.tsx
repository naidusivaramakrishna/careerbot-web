"use client";

import React, { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { CustomSection, CustomField, useResume } from "../../_context/ResumeContext";

interface Props {
  section: CustomSection;
}

const CustomSectionEditor: React.FC<Props> = ({ section }) => {
  const { addCustomField, updateCustomFieldValue, deleteCustomField } = useResume();
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomField["fieldType"]>("text");

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      toast.error("Field name cannot be empty");
      return;
    }
    addCustomField(section.id, newFieldName.trim(), newFieldType);
    setNewFieldName("");
    setNewFieldType("text");
  };

  return (
    <div className="flex flex-col gap-6 ml-6 mt-3">
      {/* Existing fields */}
      <div className="flex gap-6 items-start">
        <div className="flex-1 flex flex-col gap-4 mt-4">
          {section.fields.length === 0 && (
            <p className="text-sm text-gray-400 italic">No fields yet. Add a field below.</p>
          )}

          {section.fields.map((field) => (
            <div key={field.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  {field.fieldName}
                  <span className="ml-1 text-xs text-gray-400 font-normal">({field.fieldType})</span>
                </label>
                <button
                  type="button"
                  onClick={() => deleteCustomField(section.id, field.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded transition"
                  title="Remove field"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {field.fieldType === "textarea" ? (
                <textarea
                  className="w-full border border-gray-200 rounded-lg bg-[#faf9f8] px-3 py-2 text-sm focus:outline-none focus:border-[#2557a7] resize-none"
                  rows={3}
                  value={field.value as string}
                  onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
                  placeholder={`Enter ${field.fieldName.toLowerCase()}...`}
                />
              ) : field.fieldType === "date" ? (
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg bg-[#faf9f8] px-3 py-2 text-sm focus:outline-none focus:border-[#2557a7]"
                  value={field.value as string}
                  onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
                />
              ) : field.fieldType === "url" ? (
                <input
                  type="url"
                  className="w-full border border-gray-200 rounded-lg bg-[#faf9f8] px-3 py-2 text-sm focus:outline-none focus:border-[#2557a7]"
                  value={field.value as string}
                  onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
                  placeholder="https://..."
                />
              ) : field.fieldType === "list" ? (
                <div className="flex flex-col gap-2">
                  {(field.value as string[]).map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 border border-gray-200 rounded-lg bg-[#faf9f8] px-3 py-2 text-sm focus:outline-none focus:border-[#2557a7]"
                        value={item}
                        onChange={(e) => {
                          const newList = [...(field.value as string[])];
                          newList[idx] = e.target.value;
                          updateCustomFieldValue(section.id, field.id, newList);
                        }}
                        placeholder={`Item ${idx + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newList = (field.value as string[]).filter((_, i) => i !== idx);
                          updateCustomFieldValue(section.id, field.id, newList);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 rounded transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateCustomFieldValue(section.id, field.id, [
                        ...(field.value as string[]),
                        "",
                      ])
                    }
                    className="flex items-center gap-1 text-sm text-[#2557a7] hover:underline w-fit"
                  >
                    <Plus size={13} /> Add item
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg bg-[#faf9f8] px-3 py-2 text-sm focus:outline-none focus:border-[#2557a7]"
                  value={field.value as string}
                  onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
                  placeholder={`Enter ${field.fieldName.toLowerCase()}...`}
                />
              )}
            </div>
          ))}

          {/* Add new field row */}
          <div className="flex gap-2 mt-2 pt-4 border-t border-gray-100">
            <input
              type="text"
              className="flex-1 border border-gray-200 rounded-lg bg-[#faf9f8] px-3 py-2 text-sm focus:outline-none focus:border-[#2557a7]"
              placeholder="New field name"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddField();
              }}
            />
            <select
              className="border border-gray-200 rounded-lg bg-[#faf9f8] px-2 py-2 text-sm focus:outline-none focus:border-[#2557a7]"
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value as CustomField["fieldType"])}
            >
              <option value="text">Text</option>
              <option value="textarea">Long Text</option>
              <option value="date">Date</option>
              <option value="url">URL</option>
              <option value="list">List</option>
            </select>
            <button
              type="button"
              onClick={handleAddField}
              className="flex items-center gap-1 px-3 py-2 bg-[#2557a7] text-white text-sm rounded-lg hover:bg-[#1f4e98] transition"
            >
              <Plus size={14} /> Add Field
            </button>
          </div>
        </div>

        {/* Tips panel */}
        <div className="w-72 flex-shrink-0 sticky top-2 bg-[#faf9f8] rounded-lg p-5 mt-4">
          <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
          <div className="border-t border-gray-300 mb-3"></div>
          <div className="space-y-3 text-sm text-[#3b3b3b] leading-relaxed">
            <p>Add fields that best represent this section&apos;s content.</p>
            <p>Field types available:
              <br /><strong>Text</strong> – single line
              <br /><strong>Long Text</strong> – multi-line paragraph
              <br /><strong>Date</strong> – date picker
              <br /><strong>URL</strong> – web link
              <br /><strong>List</strong> – multiple items
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomSectionEditor;
