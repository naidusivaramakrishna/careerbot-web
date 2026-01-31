"use client";

import React, { useState, useCallback, useMemo } from "react";
import ListSection from "./ListSection";
import { MissingTechnicalSkillsCardProps, MatchedMap } from "../_types";

const MissingTechnicalSkillsCard: React.FC<MissingTechnicalSkillsCardProps> = ({
  className = "",
  criticalSkills = [],
  importantSkills = [],
  niceToHaveSkills = [],
  onAddSkill,
  onRemoveSkill,
}) => {
  const [matchedCritical, setMatchedCritical] = useState<MatchedMap>({});
  const [matchedImportant, setMatchedImportant] = useState<MatchedMap>({});
  const [matchedNice, setMatchedNice] = useState<MatchedMap>({});

  // Track all skills that have been added to keep them visible
  const [addedCritical, setAddedCritical] = useState<string[]>([]);
  const [addedImportant, setAddedImportant] = useState<string[]>([]);
  const [addedNice, setAddedNice] = useState<string[]>([]);

  const toggleCritical = useCallback(
    (skill: string) => {
      const isCurrentlyMatched = matchedCritical[skill];
      if (isCurrentlyMatched) {
        return; // Don't allow toggle off via this button, use remove instead
      }

      setMatchedCritical((prev) => ({ ...prev, [skill]: true }));
      // Add to our tracking list to keep it visible
      if (!addedCritical.includes(skill)) {
        setAddedCritical((prev) => [...prev, skill]);
      }

      if (onAddSkill) {
        onAddSkill(skill).catch((err) => {
          // // console.error("Failed to add skill:", err);
          setMatchedCritical((p) => ({ ...p, [skill]: false }));
          // Remove from tracking if API failed
          setAddedCritical((prev) => prev.filter((s) => s !== skill));
        });
      }
    },
    [onAddSkill, matchedCritical, addedCritical]
  );

  const removeCritical = useCallback(
    (skill: string) => {
      if (onRemoveSkill) {
        onRemoveSkill(skill)
          .then(() => {
            setMatchedCritical((prev) => ({ ...prev, [skill]: false }));
            // Remove from our tracking list
            setAddedCritical((prev) => prev.filter((s) => s !== skill));
          })
          .catch((err) => {
            // // console.error("Failed to remove skill:", err);
          });
      } else {
        // Fallback: just update local state if no API handler
        setMatchedCritical((prev) => ({ ...prev, [skill]: false }));
        setAddedCritical((prev) => prev.filter((s) => s !== skill));
      }
    },
    [onRemoveSkill]
  );

  const toggleImportant = useCallback(
    (skill: string) => {
      const isCurrentlyMatched = matchedImportant[skill];
      if (isCurrentlyMatched) {
        return;
      }

      setMatchedImportant((prev) => ({ ...prev, [skill]: true }));
      if (!addedImportant.includes(skill)) {
        setAddedImportant((prev) => [...prev, skill]);
      }

      if (onAddSkill) {
        onAddSkill(skill).catch((err) => {
          // // console.error("Failed to add skill:", err);
          setMatchedImportant((p) => ({ ...p, [skill]: false }));
          setAddedImportant((prev) => prev.filter((s) => s !== skill));
        });
      }
    },
    [onAddSkill, matchedImportant, addedImportant]
  );

  const removeImportant = useCallback(
    (skill: string) => {
      if (onRemoveSkill) {
        onRemoveSkill(skill)
          .then(() => {
            setMatchedImportant((prev) => ({ ...prev, [skill]: false }));
            setAddedImportant((prev) => prev.filter((s) => s !== skill));
          })
          .catch((err) => {
            // // console.error("Failed to remove skill:", err);
          });
      } else {
        setMatchedImportant((prev) => ({ ...prev, [skill]: false }));
        setAddedImportant((prev) => prev.filter((s) => s !== skill));
      }
    },
    [onRemoveSkill]
  );

  const toggleNice = useCallback(
    (skill: string) => {
      const isCurrentlyMatched = matchedNice[skill];
      if (isCurrentlyMatched) {
        return;
      }

      setMatchedNice((prev) => ({ ...prev, [skill]: true }));
      if (!addedNice.includes(skill)) {
        setAddedNice((prev) => [...prev, skill]);
      }

      if (onAddSkill) {
        onAddSkill(skill).catch((err) => {
          // // console.error("Failed to add skill:", err);
          setMatchedNice((p) => ({ ...p, [skill]: false }));
          setAddedNice((prev) => prev.filter((s) => s !== skill));
        });
      }
    },
    [onAddSkill, matchedNice, addedNice]
  );

  const removeNice = useCallback(
    (skill: string) => {
      if (onRemoveSkill) {
        onRemoveSkill(skill)
          .then(() => {
            setMatchedNice((prev) => ({ ...prev, [skill]: false }));
            setAddedNice((prev) => prev.filter((s) => s !== skill));
          })
          .catch((err) => {
            // // console.error("Failed to remove skill:", err);
          });
      } else {
        setMatchedNice((prev) => ({ ...prev, [skill]: false }));
        setAddedNice((prev) => prev.filter((s) => s !== skill));
      }
    },
    [onRemoveSkill]
  );

  // Merge prop skills with locally added skills to keep them visible
  const mergedCritical = useMemo(() => {
    const merged = new Set([...criticalSkills, ...addedCritical]);
    return Array.from(merged);
  }, [criticalSkills, addedCritical]);

  const mergedImportant = useMemo(() => {
    const merged = new Set([...importantSkills, ...addedImportant]);
    return Array.from(merged);
  }, [importantSkills, addedImportant]);

  const mergedNice = useMemo(() => {
    const merged = new Set([...niceToHaveSkills, ...addedNice]);
    return Array.from(merged);
  }, [niceToHaveSkills, addedNice]);

  const totalSelected = useMemo(() => {
    return (
      Object.values(matchedCritical).filter(Boolean).length +
      Object.values(matchedImportant).filter(Boolean).length +
      Object.values(matchedNice).filter(Boolean).length
    );
  }, [matchedCritical, matchedImportant, matchedNice]);

  const totalSkills = mergedCritical.length + mergedImportant.length + mergedNice.length;

  return (
    <div className={`bg-white rounded-2xl p-6 border border-slate-200 space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-10 bg-orange-400 rounded-full"></div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Missing Technical Skills</h3>
            <p className="text-xs text-slate-500 font-medium">
              Click to add skills • Click ✕ to remove
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
          <span className="text-sm font-bold text-slate-700">
            {totalSelected} / {totalSkills} added
          </span>
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {mergedCritical.length > 0 && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <ListSection
              title="🔴 Critical Skills"
              items={mergedCritical}
              matchedMap={matchedCritical}
              onToggle={toggleCritical}
              onRemove={removeCritical}
            />
          </div>
        )}

        {mergedImportant.length > 0 && (
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <ListSection
              title="🟡 Important Skills"
              items={mergedImportant}
              matchedMap={matchedImportant}
              onToggle={toggleImportant}
              onRemove={removeImportant}
            />
          </div>
        )}

        {mergedNice.length > 0 && (
          <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
            <ListSection
              title="🔵 Nice to Have"
              items={mergedNice}
              matchedMap={matchedNice}
              onToggle={toggleNice}
              onRemove={removeNice}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MissingTechnicalSkillsCard;
