"use client";

import React, { useState, useCallback, useMemo } from "react";
import ListSection from "./ListSection";
import { MissingSoftSkillsCardProps, MatchedMap } from "../_types";

const MissingSoftSkillsCard: React.FC<MissingSoftSkillsCardProps> = ({
  className = "",
  softSkills = [],
  onAddSkill,
  onRemoveSkill,
}) => {
  const [matched, setMatched] = useState<MatchedMap>({});

  // Track all skills that have been added to keep them visible
  const [addedSkills, setAddedSkills] = useState<string[]>([]);

  const toggle = useCallback(
    (skill: string) => {
      const isCurrentlyMatched = matched[skill];
      if (isCurrentlyMatched) {
        return; // Don't allow toggle off via this button, use remove instead
      }

      setMatched((prev) => ({ ...prev, [skill]: true }));
      // Add to our tracking list to keep it visible
      if (!addedSkills.includes(skill)) {
        setAddedSkills((prev) => [...prev, skill]);
      }

      if (onAddSkill) {
        onAddSkill(skill).catch((err) => {
          console.error("Failed to add soft skill:", err);
          setMatched((p) => ({ ...p, [skill]: false }));
          // Remove from tracking if API failed
          setAddedSkills((prev) => prev.filter((s) => s !== skill));
        });
      }
    },
    [onAddSkill, matched, addedSkills]
  );

  const remove = useCallback(
    (skill: string) => {
      if (onRemoveSkill) {
        onRemoveSkill(skill)
          .then(() => {
            setMatched((prev) => ({ ...prev, [skill]: false }));
            // Remove from our tracking list
            setAddedSkills((prev) => prev.filter((s) => s !== skill));
          })
          .catch((err) => {
            console.error("Failed to remove soft skill:", err);
          });
      } else {
        // Fallback: just update local state if no API handler
        setMatched((prev) => ({ ...prev, [skill]: false }));
        setAddedSkills((prev) => prev.filter((s) => s !== skill));
      }
    },
    [onRemoveSkill]
  );

  const totalSelected = useMemo(() => {
    return Object.values(matched).filter(Boolean).length;
  }, [matched]);

  // Merge prop skills with locally added skills to keep them visible
  const mergedSkills = useMemo(() => {
    const merged = new Set([...softSkills, ...addedSkills]);
    return Array.from(merged);
  }, [softSkills, addedSkills]);

  return (
    <div className={`bg-gradient-to-br from-white to-[#f8fbff] rounded-3xl p-6 border border-[#e0eaf5] shadow-lg space-y-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Soft Skills</h3>
          <p className="text-sm text-gray-600 mt-2">
            Click skills to add • Click ✕ to remove
          </p>
        </div>
        <div className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] border border-[#bfdbfe]">
          <span className="text-sm font-bold text-[#2557a7]">
            {totalSelected} / {mergedSkills.length}
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#eff6ff] to-white rounded-2xl p-5 border border-[#bfdbfe] max-h-[450px] overflow-y-auto hover:shadow-md transition-all duration-300">
        <ListSection
          title="Soft Skills"
          titleColor="text-[#2557a7]"
          items={mergedSkills}
          matchedMap={matched}
          onToggle={toggle}
          onRemove={remove}
        />
      </div>
    </div>
  );
};

export default MissingSoftSkillsCard;
