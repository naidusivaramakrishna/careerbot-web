import React, { useRef, useEffect, useState } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
import MonthYearPicker from "../MonthYearPicker";
import { RiEdit2Fill } from 'react-icons/ri';
import { Trash2 } from 'lucide-react';
import { LuPlus } from 'react-icons/lu';
import { deleteResumeSectionItem } from "@/api/resumeApi"; // ✅ Import the API
import logger from "@/lib/logger";

interface VolunteeringEntry {
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  _id?: string; // ✅ NEW: Add item ID for backend tracking
}

const emptyVolunteering = (): VolunteeringEntry => ({
  organization: "",
  role: "",
  startDate: "",
  endDate: "",
});

const Volunteering: React.FC = () => {
  const { resumeData, setResumeData } = useResume();

  const {
    errors,
    validateRequired,
    clearError,
    clearSectionIndexErrors,
    reindexErrors,
  } = useValidation();

  const [showTips] = useState(true);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null); // ✅ NEW: Track deleting state

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  const hasValidData = (entry: VolunteeringEntry): boolean => {
    return !!(entry.organization || entry.role || entry.startDate || entry.endDate);
  };

  const [savedEntries, setSavedEntries] = useState<VolunteeringEntry[]>(() => {
    if (resumeData.volunteering && resumeData.volunteering.length) {
      const validEntries = resumeData.volunteering.filter(hasValidData);
      return validEntries;
    }
    return [];
  });

  const [editingEntries, setEditingEntries] = useState<VolunteeringEntry[]>(() => {
    if (savedEntries.length === 0) {
      return [emptyVolunteering()];
    }
    return [];
  });

  useEffect(() => {
    const allEntries = [...savedEntries, ...editingEntries];
    if (JSON.stringify(resumeData.volunteering) !== JSON.stringify(allEntries)) {
      setResumeData({ ...resumeData, volunteering: allEntries });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEntries, editingEntries]);

  const handleChange = <K extends keyof VolunteeringEntry>(
    index: number,
    field: K,
    value: VolunteeringEntry[K]
  ) => {
    const updated = [...editingEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEditingEntries(updated);
    clearError("volunteering", savedEntries.length + index, field as string);
  };

  const addVolunteering = () => {
    const validEditingEntries = editingEntries.filter(hasValidData);

    if (validEditingEntries.length > 0) {
      setSavedEntries((prev) => [...prev, ...validEditingEntries]);
    }

    setEditingEntries([emptyVolunteering()]);
  };

  const addNewEntry = () => {
    setEditingEntries([emptyVolunteering()]);
  };

  // ✅ UPDATED: Delete with API call
  const removeVolunteering = async (index: number) => {
    const resumeId = localStorage.getItem("current_resume_id");
    const volunteeringToDelete = savedEntries[index];
    const itemId = volunteeringToDelete._id;

    // If no resumeId or itemId, just do local deletion
    if (!resumeId || !itemId) {
      logger.warn("⚠️ No resume ID or item ID found, performing local deletion only");
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("volunteering", index);
      reindexErrors("volunteering", index);
      return;
    }

    try {
      setDeletingIndex(index);
      logger.info("🗑️ Deleting volunteering item:", { resumeId, itemId, index });

      // ✅ Call the API to delete the item from backend
      await deleteResumeSectionItem(resumeId, "volunteering", itemId);

      logger.info("✅ Volunteering item deleted from backend successfully");

      // ✅ Update local state after successful API call
      const updated = [...savedEntries];
      updated.splice(index, 1);
      setSavedEntries(updated);
      clearSectionIndexErrors("volunteering", index);
      reindexErrors("volunteering", index);

    } catch (error) {
      logger.error("❌ Failed to delete volunteering item:", error);
      alert("Failed to delete volunteering entry. Please try again.");
    } finally {
      setDeletingIndex(null);
    }
  };

  const editEntry = (index: number) => {
    const entryToEdit = savedEntries[index];
    const updatedSaved = [...savedEntries];
    updatedSaved.splice(index, 1);
    setSavedEntries(updatedSaved);
    setEditingEntries([entryToEdit]);
  };

  function startToLabel(val: string) {
    if (!val) return "";
    const [y, m] = val.split("-");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mIdx = parseInt(m, 10) - 1;
    return `${monthNames[mIdx]} ${y.slice(-2)}`;
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      {/* Saved Entries List with Add Button */}
      {savedEntries.length > 0 && editingEntries.length === 0 && (
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-4">
            {savedEntries.map((volunteering, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex-1 flex flex-col gap-1">
                  {/* Role - Main heading */}
                  <div className="text-base font-bold text-gray-900">
                    {volunteering.role || "No role"}
                  </div>
                  
                  {/* Organization */}
                  {volunteering.organization && (
                    <div className="text-sm text-gray-700">
                      {volunteering.organization}
                    </div>
                  )}
                  
                  {/* Dates */}
                  {(volunteering.startDate || volunteering.endDate) && (
                    <div className="text-xs text-gray-600">
                      {volunteering.startDate ? startToLabel(volunteering.startDate) : ""} 
                      {volunteering.startDate && volunteering.endDate && " - "}
                      {volunteering.endDate ? startToLabel(volunteering.endDate) : ""}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => editEntry(index)}
                    disabled={deletingIndex === index}
                    className="p-2 text-xs hover:bg-[#e5e5e5] rounded-full disabled:opacity-50"
                  >
                    <RiEdit2Fill size={20} className="text-[#595959]"/>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVolunteering(index)}
                    disabled={deletingIndex === index}
                    className={`p-2 text-xs hover:bg-[#e5e5e5] rounded-full ${
                      deletingIndex === index ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Trash2 
                      size={20} 
                      className={`text-[#595959] hover:text-red-500 ${
                        deletingIndex === index ? "animate-pulse" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Button in Entry List */}
          <div className="pt-2">
            <button
              type="button"
              onClick={addNewEntry}
              className="flex w-fit p-3 items-center justify-center text-xs font-semibold bg-[#e5e5e5] hover:bg-[#2557a7] rounded-full transition-colors group"
            >
              <LuPlus size={20} className="text-[#595959] group-hover:text-white"/>
            </button>
          </div>
        </div>
      )}

      {/* Editing Form with Tips Panel */}
      {editingEntries.length > 0 && (
        <div className="flex gap-6 items-start">
          {/* Left Side: Scrollable Form Fields Section */}
          <div 
            ref={formScrollRef}
            className="flex-1 h-[350px] overflow-y-auto mt-6 scrollbar-hide pr-2 "
          >
            <div className="flex flex-col gap-3">
              {editingEntries.map((volunteering, editIndex) => {
                const globalIndex = savedEntries.length + editIndex;
                return (
                  <div key={`edit-${editIndex}`} className="flex flex-col gap-3 pb-4 relative">
                    {/* Organization & Role */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Organization <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={volunteering.organization}
                          placeholder="Organization Name"
                          onChange={(e) => handleChange(editIndex, "organization", e.target.value)}
                          onBlur={() => validateRequired("volunteering", globalIndex, { organization: volunteering.organization })}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
                        />
                        {errors[`volunteering-${globalIndex}-organization`] && (
                          <span className="text-xs text-red-500">
                            {errors[`volunteering-${globalIndex}-organization`]}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">
                          Role
                        </label>
                        <input
                          type="text"
                          value={volunteering.role}
                          placeholder="Volunteer Role"
                          onChange={(e) => handleChange(editIndex, "role", e.target.value)}
                          className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500`}
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">Start date</label>
                        <MonthYearPicker
                          value={volunteering.startDate}
                          onChange={(val) => handleChange(editIndex, "startDate", val)}
                          placeholder="MM/YY"
                        />
                      </div>

                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-semibold text-[#3b3b3b]">End date</label>
                        <MonthYearPicker
                          value={volunteering.endDate}
                          onChange={(val) => handleChange(editIndex, "endDate", val)}
                          placeholder="MM/YY"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Another Button in Editing Form */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={addVolunteering}
                  className="flex w-fit px-2 py-2 items-center justify-center text-xs font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
                >
                  + Add Additional
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Fixed Tips Section */}
          <div className="w-80 flex-shrink-0 sticky top-2">
            {showTips && (
              <div className="bg-[#faf9f8] rounded-lg p-5">
                <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
                <div className="border-t border-gray-300 mb-3"></div>
                <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
                  <p>
                    Volunteer experience demonstrates commitment to community service and transferable skills. Highlight leadership roles, significant contributions, and relevant experience that aligns with your career goals.
                  </p>
                  <p>
                    Include the organization name, your role, and dates of service. Emphasize skills developed, responsibilities held, and impact made through your volunteer work.
                  </p>
                  <p className="text-xs text-gray-500 italic mt-6">
                    *82% of hiring managers value volunteer experience when evaluating candidates.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Volunteering;


