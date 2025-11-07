"use client";
import { useState } from "react";
import { Palette, Pencil, Trash2 } from "lucide-react";
import { ProfileData } from "../_types/ProfileData";
interface HobbiesSectionProps {
  tempProfile: ProfileData;
  setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}

const HobbiesSection = ({ tempProfile, setTempProfile }: HobbiesSectionProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<NonNullable<ProfileData["hobbies"]>[number]>({});
  const [showForm, setShowForm] = useState(false);
  return (
    <div>
      {showForm || editingIndex !== null ? (
        <div className="mb-4 border border-neutral-200 rounded-lg p-4 flex flex-col gap-2">
          <div className="flex flex-col">
            <label className="text-sm font-medium">Hobby</label>
            <input
              type="text"
              name="name"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
              className="border border-neutral-200 p-2.5 text-sm  rounded-lg bg-white outline-neutral-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
              className="border border-neutral-200 p-2.5 text-sm  rounded-lg bg-white outline-neutral-500"
            />
          </div>
          <div className="col-span-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                const updated = [...(tempProfile.hobbies || [])];
                if (editingIndex !== null && editingIndex < updated.length) {
                  updated[editingIndex] = form;
                } else {
                  updated.push(form);
                }
                setTempProfile({ ...tempProfile, hobbies: updated });
                setForm({});
                setEditingIndex(null);
                setShowForm(false);
              }}
              className="bg-[#155DFC]  text-white px-4 py-1.5 cursor-pointer rounded"
            >
              Save
            </button>
            <button
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
          {(tempProfile.hobbies?.length ?? 0) === 0 ? (
            <div className="mb-4 bg-neutral-50 border border-gray-300 rounded-xl py-6 shadow-sm px-4">
              <p className="text-sm text-gray-600 mb-2">
                Add Hobbies like Singing, Dancing , Reading etc.
              </p>
              <button
                type="button"
                onClick={() => {
                  setForm({});
                  setShowForm(true);
                }}
                className="bg-[#155DFC] text-white text-sm cursor-pointer flex gap-2 items-center px-4 py-2 rounded-lg "
              >
                <Palette className="w-4 h-4" />
                <span>Add Hobby</span>
              </button>
            </div>
          ) : (
            <>
              {(tempProfile.hobbies || []).map((hobby, index) => (
                <div key={index} className="mb-4 bg-neutral-50 border border-gray-300 flex items-start justify-between rounded-xl py-6 shadow-sm px-4 gap-2">
                  <div>
                    <h3 className="font-semibold">{hobby.name}</h3>
                    <p className="text-sm">{hobby.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setForm(hobby);
                        setEditingIndex(index);
                      }}
                      className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...(tempProfile.hobbies || [])];
                        updated.splice(index, 1);
                        setTempProfile({ ...tempProfile, hobbies: updated });
                      }}
                      className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
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
                  setEditingIndex(tempProfile.hobbies?.length || 0);
                }}
                className="bg-[#155DFC] text-white text-sm cursor-pointer flex gap-2 items-center px-4 py-2 rounded-lg "
              >
                <Palette className="w-4 h-4" />
                <span>Add Hobby</span>
              </button>
            </>
          )}
        </>
      )}
    </div >
  );
};

export default HobbiesSection;
