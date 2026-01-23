"use client";

import React, { useState, useEffect } from "react";
import { CustomSection, CustomField, useResume } from "../../_context/ResumeContext";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  section: CustomSection;
  isOpen: boolean;
  onClose: () => void;
}

const CustomSectionModal: React.FC<Props> = ({ section, isOpen, onClose }) => {
  const { addCustomField, updateCustomFieldValue, deleteCustomField } = useResume();
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomField["fieldType"]>("text");

  if (!isOpen) return null;

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      toast.error("Field name cannot be empty");
      return;
    }
    addCustomField(section.id, newFieldName, newFieldType);
    setNewFieldName("");
    setNewFieldType("text");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white max-w-3xl w-full max-h-[85vh] rounded-lg shadow-lg p-6 overflow-y-auto relative">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600"
          onClick={onClose}
          aria-label="Close modal"
        >
          <Trash2 size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4">{section.sectionName} - Custom Fields</h2>
        <div className="space-y-4">
          {section.fields.map((field) => (
            <div key={field.id}>
              <label className="block mb-1 text-gray-700 font-medium">
                {field.fieldName} ({field.fieldType})
              </label>

              {field.fieldType === "textarea" ? (
                <textarea
                  className="w-full border p-2 rounded"
                  rows={3}
                  value={field.value as string}
                  onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
                />
              ) : field.fieldType === "date" ? (
                <input
                  type="date"
                  className="w-full border p-2 rounded"
                  value={field.value as string}
                  onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
                />
              ) : field.fieldType === "url" ? (
                <input
                  type="url"
                  className="w-full border p-2 rounded"
                  value={field.value as string}
                  onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
                />
              ) : field.fieldType === "list" ? (
                <div className="space-y-2">
                  {(field.value as string[]).map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-1">
                      <input
                        type="text"
                        className="flex-1 border p-2 rounded"
                        value={item}
                        onChange={(e) => {
                          const newList = [...(field.value as string[])];
                          newList[idx] = e.target.value;
                          updateCustomFieldValue(section.id, field.id, newList);
                        }}
                      />
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => {
                          const newList = (field.value as string[]).filter((_, i) => i !== idx);
                          updateCustomFieldValue(section.id, field.id, newList);
                        }}
                        aria-label="Delete list item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() =>
                      updateCustomFieldValue(section.id, field.id, [...(field.value as string[]), ""])
                    }
                  >
                    + Add item
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={field.value as string}
                  onChange={(e) => updateCustomFieldValue(section.id, field.id, e.target.value)}
                />
              )}
              <button
                className="mt-1 text-red-600 hover:text-red-800"
                onClick={() => deleteCustomField(section.id, field.id)}
                aria-label="Delete field"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <input
            type="text"
            className="border p-2 rounded flex-1"
            placeholder="New field name"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
          />
          <select
            className="border p-2 rounded"
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
            onClick={handleAddField}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Field
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomSectionModal;
