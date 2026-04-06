"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import httpClient from "@/lib/http";

export type SkillType = "technical" | "soft";

export const useSkillUpdate = (
  _resumeId: string | null,
  matchResults: any,
  _resolveResumeId: () => string | null,
  setMatchResults: (data: any) => void,
  onResumeUpdated?: () => void
) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const getMatchId = useCallback(() => {
    return (
      matchResults?.match_id ||
      matchResults?.data?.match_id ||
      matchResults?.data?.id ||
      null
    );
  }, [matchResults]);

  /* ── shared helpers ── */
  const filterSkill = (arr: any[], skill: string) =>
    (arr || []).filter((s: any) => {
      const name = typeof s === "string" ? s : s?.skill;
      return name?.toLowerCase() !== skill.toLowerCase();
    });

  const skillInArr = (arr: any[], skill: string) =>
    (arr || []).some((s: any) => {
      const name = typeof s === "string" ? s : s?.skill;
      return name?.toLowerCase() === skill.toLowerCase();
    });

  /* ── build optimistic state after ADD ── */
  const buildAddedState = useCallback(
    (prev: any, skill: string, skillType: SkillType) => {
      const prevData = prev?.data || {};
      const prevMatchResult = prevData.match_result || {};
      const techSkills = prevMatchResult.Technical_Skills || {};
      const softSkills = prevMatchResult.Soft_Skills || {};

      const prevNewlyAddedTech = prevData.newly_added_skills || [];
      const prevNewlyAddedSoft = prevData.newly_added_soft_skills || [];

      const newlyAddedSkills =
        skillType === "technical"
          ? prevNewlyAddedTech.includes(skill)
            ? prevNewlyAddedTech
            : [...prevNewlyAddedTech, skill]
          : prevNewlyAddedTech;

      const newlyAddedSoftSkills =
        skillType === "soft"
          ? prevNewlyAddedSoft.includes(skill)
            ? prevNewlyAddedSoft
            : [...prevNewlyAddedSoft, skill]
          : prevNewlyAddedSoft;

      const addToMatched = (matched: any[], missing: any[]) =>
        skillInArr(missing, skill) && !skillInArr(matched, skill)
          ? [...(matched || []), skill]
          : matched || [];

      return {
        ...prev,
        data: {
          ...prevData,
          newly_added_skills: newlyAddedSkills,
          newly_added_soft_skills: newlyAddedSoftSkills,
          match_result: {
            ...prevMatchResult,
            Technical_Skills: {
              ...techSkills,
              missing_critical_skills: filterSkill(techSkills.missing_critical_skills, skill),
              missing_important_skills: filterSkill(techSkills.missing_important_skills, skill),
              missing_nice_to_have: filterSkill(techSkills.missing_nice_to_have, skill),
              matched_critical_skills: addToMatched(techSkills.matched_critical_skills, techSkills.missing_critical_skills),
              matched_important_skills: addToMatched(techSkills.matched_important_skills, techSkills.missing_important_skills),
              matched_nice_to_have: addToMatched(techSkills.matched_nice_to_have, techSkills.missing_nice_to_have),
            },
            Soft_Skills: {
              ...softSkills,
              missing_skills: filterSkill(softSkills.missing_skills, skill),
              matched_skills: addToMatched(softSkills.matched_skills, softSkills.missing_skills),
            },
          },
        },
      };
    },
    []
  );

  /* ── build optimistic state after REMOVE ── */
  const buildRemovedState = useCallback(
    (prev: any, skill: string, skillType: SkillType) => {
      const prevData = prev?.data || {};
      const prevMatchResult = prevData.match_result || {};
      const techSkills = prevMatchResult.Technical_Skills || {};
      const softSkills = prevMatchResult.Soft_Skills || {};

      const prevNewlyAddedTech = prevData.newly_added_skills || [];
      const prevNewlyAddedSoft = prevData.newly_added_soft_skills || [];

      const newlyAddedSkills =
        skillType === "technical"
          ? prevNewlyAddedTech.filter((s: string) => s.toLowerCase() !== skill.toLowerCase())
          : prevNewlyAddedTech;

      const newlyAddedSoftSkills =
        skillType === "soft"
          ? prevNewlyAddedSoft.filter((s: string) => s.toLowerCase() !== skill.toLowerCase())
          : prevNewlyAddedSoft;

      const removeFromMatched = (arr: any[]) => filterSkill(arr, skill);

      const addBackToMissing = (missing: any[], matched: any[]) =>
        skillInArr(matched, skill) && !skillInArr(missing, skill)
          ? [...(missing || []), skill]
          : missing || [];

      return {
        ...prev,
        data: {
          ...prevData,
          newly_added_skills: newlyAddedSkills,
          newly_added_soft_skills: newlyAddedSoftSkills,
          match_result: {
            ...prevMatchResult,
            Technical_Skills: {
              ...techSkills,
              matched_critical_skills: removeFromMatched(techSkills.matched_critical_skills),
              matched_important_skills: removeFromMatched(techSkills.matched_important_skills),
              matched_nice_to_have: removeFromMatched(techSkills.matched_nice_to_have),
              missing_critical_skills: addBackToMissing(techSkills.missing_critical_skills, techSkills.matched_critical_skills),
              missing_important_skills: addBackToMissing(techSkills.missing_important_skills, techSkills.matched_important_skills),
              missing_nice_to_have: addBackToMissing(techSkills.missing_nice_to_have, techSkills.matched_nice_to_have),
            },
            Soft_Skills: {
              ...softSkills,
              matched_skills: removeFromMatched(softSkills.matched_skills),
              missing_skills: addBackToMissing(softSkills.missing_skills, softSkills.matched_skills),
            },
          },
        },
      };
    },
    []
  );

  /* ── ADD SKILL ── */
  const handleAddSingleSkill = useCallback(
    async (skill: string, skillType: SkillType = "technical") => {
      if (isUpdating) return;

      const matchId = getMatchId();
      if (!matchId) {
        toast.error("Match ID not found. Please reload and try again.");
        return;
      }

      setIsUpdating(true);

      // 1. Optimistic update — always applies immediately
      setMatchResults((prev: any) => buildAddedState(prev, skill, skillType));

      // 2. Trigger PDF refresh
      if (onResumeUpdated) setTimeout(() => onResumeUpdated(), 100);

      // 3. Sync with backend (best-effort — UI update already done)
      try {
        const response = await httpClient.post<any>(
          `/matcher/live-update/${matchId}/add-skill`,
          { skill_to_add: skill }
        );
        const responseData = response.data?.data || response.data;
        const newScore = responseData?.ats_scores?.new;
        if (newScore) {
          setMatchResults((prev: any) => ({
            ...prev,
            data: { ...prev?.data, ats_score: newScore },
          }));
        }
      } catch (err: unknown) {
        const status = (err as any)?.response?.status;
        if (status === 429) {
          toast.error("Too many requests. Please wait before adding another skill.");
        }
        // For 400 / other errors: keep the optimistic update — skill is already in resume
      } finally {
        setIsUpdating(false);
      }
    },
    [matchResults, isUpdating, setMatchResults, getMatchId, onResumeUpdated, buildAddedState]
  );

  /* ── REMOVE SKILL ── */
  const handleRemoveSingleSkill = useCallback(
    async (skill: string, skillType: SkillType = "technical") => {
      if (isUpdating) return;

      const matchId = getMatchId();
      if (!matchId) {
        toast.error("Match ID not found. Please reload and try again.");
        return;
      }

      setIsUpdating(true);

      // 1. Optimistic update
      setMatchResults((prev: any) => buildRemovedState(prev, skill, skillType));

      // 2. Trigger PDF refresh
      if (onResumeUpdated) setTimeout(() => onResumeUpdated(), 100);

      // 3. Sync with backend (best-effort)
      try {
        const response = await httpClient.post<any>(
          `/matcher/live-update/${matchId}/remove-skill`,
          { skill_to_remove: skill }
        );
        const responseData = response.data?.data || response.data;
        const newScore = responseData?.ats_scores?.new;
        if (newScore) {
          setMatchResults((prev: any) => ({
            ...prev,
            data: { ...prev?.data, ats_score: newScore },
          }));
        }
      } catch (err: unknown) {
        const status = (err as any)?.response?.status;
        if (status === 429) {
          toast.error("Too many requests. Please wait before removing another skill.");
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [matchResults, isUpdating, setMatchResults, getMatchId, onResumeUpdated, buildRemovedState]
  );

  return {
    handleAddSingleSkill,
    handleRemoveSingleSkill,
    isUpdating,
  };
};
