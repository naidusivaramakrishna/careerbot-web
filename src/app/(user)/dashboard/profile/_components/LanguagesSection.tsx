"use client";
import { useState } from "react";
import { Languages, Pencil, Trash2 } from "lucide-react";
import { languages } from "@/utils/languages";
import { ProfileData } from "../_types/ProfileData";

const proficiencyLevels = ["Beginner", "Intermediate", "Advanced", "Fluent", "Native"];

interface LanguagesSectionProps {
  tempProfile: ProfileData;
  setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}

const LanguagesSection = ({ tempProfile, setTempProfile }: LanguagesSectionProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<NonNullable<ProfileData["languages"]>[number]>({});
  const [showForm, setShowForm] = useState(false);
  return (
    <div>
      {showForm || editingIndex !== null ? (
        <div className="mb-4 border border-neutral-200 rounded-lg p-4 flex flex-col gap-2">
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col">
              <label className="text-sm font-medium">Language</label>
              <select
                name="language"
                value={form.language || ""}
                onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                className="border border-neutral-200 p-2.5 text-sm  rounded-lg bg-white outline-neutral-500"
              >
                <option value="">Select a language</option>
                {languages.map((lang, index) => (
                  <option key={index} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Proficiency</label>
              <select
                name="proficiency"
                value={form.proficiency || ""}
                onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                className="border border-neutral-200 p-2.5 text-sm  rounded-lg bg-white outline-neutral-500"
              >
                <option value="">Select Proficiency</option>
                {proficiencyLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-span-2 flex gap-2 ">
            <button
              type="button"
              onClick={() => {
                const updated = [...(tempProfile.languages || [])];
                if (editingIndex !== null && editingIndex < updated.length) {
                  updated[editingIndex] = form;
                } else {
                  updated.push(form);
                }
                setTempProfile({ ...tempProfile, languages: updated });
                setForm({});
                setEditingIndex(null);
                setShowForm(false);
              }}
              className="bg-[#155DFC] text-white px-4 py-1.5 cursor-pointer rounded"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setForm({});
                setEditingIndex(null);
                setShowForm(false);
              }}
              className="bg-gray-400 text-white px-3 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {(tempProfile.languages?.length ?? 0) === 0 ? (
            <div className="mb-4 bg-neutral-50 border border-gray-300 rounded-xl py-6 shadow-sm px-4">
              <p className="text-sm text-gray-600 mb-2">
                Add Languages like English,Telugu, Hindi etc.
              </p>
              <button
                type="button"
                onClick={() => {
                  setForm({});
                  setShowForm(true);
                }}
                className="bg-[#155DFC] text-white text-sm cursor-pointer flex gap-2 items-center px-4 py-2 rounded-lg "
              >
                <Languages className="w-4 h-4" />
                <span>Add Language</span>
              </button>
            </div>
          ) : (
            <div className="mb-4 bg-neutral-50 border border-neutral-200 rounded-xl py-4 shadow-sm px-4 gap-2">
              {(tempProfile.languages || []).map((item, index) => (
                <div key={index} className="mb-4 bg-neutral-50 border border-neutral-200 w-2/5  flex items-center justify-between rounded-xl py-2 shadow-sm px-4 gap-2">
                  <span className="text-sm">{item.language} - {item.proficiency}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForm(item);
                        setEditingIndex(index);
                      }}
                      className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...(tempProfile.languages || [])];
                        updated.splice(index, 1);
                        setTempProfile({ ...tempProfile, languages: updated });
                      }}
                      className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setForm({});
                  setEditingIndex(tempProfile.languages?.length || 0);
                }}
                className="bg-[#155DFC] text-white text-sm cursor-pointer flex gap-2 items-center px-4 py-2 rounded-lg "
              >
                <Languages className="w-4 h-4" />
                <span>Add Language</span>
              </button>
            </div>
          )
          }
        </>
      )}
    </div >
  );
};

export default LanguagesSection;
