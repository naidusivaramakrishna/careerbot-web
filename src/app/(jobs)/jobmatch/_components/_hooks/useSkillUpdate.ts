"use client";

import { useState, useCallback } from "react";
import httpClient from "@/lib/http";

export type SkillType = "technical" | "soft";

export const useSkillUpdate = (
  resumeId: string | null,
  matchResults: any,
  resolveResumeId: () => string | null,
  setMatchResults: (data: any) => void,
  onResumeUpdated?: () => void  // Callback to trigger PDF refetch
) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Get match ID helper
  const getMatchId = useCallback(() => {
    return (
      matchResults?.match_id ||
      matchResults?.data?.match_id ||
      matchResults?.data?.id ||
      null
    );
  }, [matchResults]);

  // ADD SKILL - supports both technical and soft skills
  const handleAddSingleSkill = useCallback(
    async (skill: string, skillType: SkillType = "technical") => {
      if (isUpdating) {
        console.warn("⚠️ Skill operation already in progress, please wait...");
        return;
      }

      try {
        setIsUpdating(true);

        const matchId = getMatchId();

        console.log("🔍 Match data structure:", {
          matchResults,
          extractedMatchId: matchId,
        });

        if (!matchId) {
          console.error("❌ Cannot find match_id");
          throw new Error(
            "Match ID not found - cannot add skill to live match. Please reload and try again."
          );
        }

        console.log(
          `🔄 Adding ${skillType} skill "${skill}" to match ${matchId}...`
        );

        // Use the live matcher endpoint
        const response = await httpClient.post(
          `/matcher/live-update/${matchId}/add-skill`,
          { skill_to_add: skill }
        );

        const matcherData = response.data;
        console.log("✅ Skill added via matcher endpoint", matcherData);

        // Note: Backend parser API doesn't have add-skills endpoint yet
        // The newly added skills will be tracked in matchResults and displayed via frontend template
        console.log(`📝 Skill "${skill}" will be shown in resume via frontend template`);

        // Trigger UI update to force re-render of resume preview
        if (onResumeUpdated) {
          setTimeout(() => {
            console.log("🔄 Triggering resume preview refresh...");
            onResumeUpdated();
          }, 100);
        }

        // Update UI with fresh matcher data
        if (matcherData?.data || matcherData) {
          const responseData = matcherData?.data || matcherData;
          const updatedTechSkills = responseData.updated_technical_skills || {};

          setMatchResults((prev: any) => {
            const prevMatchResult = prev?.data?.match_result || {};
            const techSkills = prevMatchResult.Technical_Skills || {};
            const softSkills = prevMatchResult.Soft_Skills || {};

            // Remove added skill from missing lists
            const filterSkill = (arr: any[]) =>
              (arr || []).filter((s: any) => {
                const skillName = typeof s === "string" ? s : s?.skill;
                return skillName?.toLowerCase() !== skill.toLowerCase();
              });

            // Add to matched list if was in missing
            const addToMatchedIfMissing = (
              matchedArr: any[],
              missingArr: any[]
            ) => {
              const wasInMissing = (missingArr || []).some((s: any) => {
                const skillName = typeof s === "string" ? s : s?.skill;
                return skillName?.toLowerCase() === skill.toLowerCase();
              });
              if (wasInMissing) {
                const alreadyMatched = (matchedArr || []).some((s: any) => {
                  const skillName = typeof s === "string" ? s : s?.skill;
                  return skillName?.toLowerCase() === skill.toLowerCase();
                });
                if (!alreadyMatched) {
                  return [...(matchedArr || []), skill];
                }
              }
              return matchedArr || [];
            };

            // Track newly added skills SEPARATELY for technical and soft
            const prevNewlyAddedTech = prev?.data?.newly_added_skills || [];
            const prevNewlyAddedSoft = prev?.data?.newly_added_soft_skills || [];

            let newlyAddedSkills = prevNewlyAddedTech;
            let newlyAddedSoftSkills = prevNewlyAddedSoft;

            if (skillType === "technical") {
              newlyAddedSkills = prevNewlyAddedTech.includes(skill)
                ? prevNewlyAddedTech
                : [...prevNewlyAddedTech, skill];
            } else {
              newlyAddedSoftSkills = prevNewlyAddedSoft.includes(skill)
                ? prevNewlyAddedSoft
                : [...prevNewlyAddedSoft, skill];
            }

            const newScore =
              responseData.ats_scores?.new || prev?.data?.ats_score;

            const updated = {
              ...prev,
              data: {
                ...prev?.data,
                ats_score: newScore,
                // Separate tracking for technical and soft skills
                newly_added_skills: newlyAddedSkills,
                newly_added_soft_skills: newlyAddedSoftSkills,
                match_result: {
                  ...prevMatchResult,
                  Technical_Skills: {
                    ...techSkills,
                    missing_critical_skills:
                      updatedTechSkills.missing_critical_skills ||
                      filterSkill(techSkills.missing_critical_skills),
                    missing_important_skills:
                      updatedTechSkills.missing_important_skills ||
                      filterSkill(techSkills.missing_important_skills),
                    missing_nice_to_have:
                      updatedTechSkills.missing_nice_to_have ||
                      filterSkill(techSkills.missing_nice_to_have),
                    matched_critical_skills:
                      updatedTechSkills.matched_critical_skills ||
                      addToMatchedIfMissing(
                        techSkills.matched_critical_skills,
                        techSkills.missing_critical_skills
                      ),
                    matched_important_skills:
                      updatedTechSkills.matched_important_skills ||
                      addToMatchedIfMissing(
                        techSkills.matched_important_skills,
                        techSkills.missing_important_skills
                      ),
                    matched_nice_to_have:
                      updatedTechSkills.matched_nice_to_have ||
                      addToMatchedIfMissing(
                        techSkills.matched_nice_to_have,
                        techSkills.missing_nice_to_have
                      ),
                    match_score:
                      updatedTechSkills.match_score || techSkills.match_score,
                    direct_match_score:
                      updatedTechSkills.direct_match_score ||
                      techSkills.direct_match_score,
                    related_match_score:
                      updatedTechSkills.related_match_score ||
                      techSkills.related_match_score,
                  },
                  Soft_Skills: {
                    ...softSkills,
                    missing_skills: filterSkill(softSkills.missing_skills),
                    matched_skills: addToMatchedIfMissing(
                      softSkills.matched_skills,
                      softSkills.missing_skills
                    ),
                  },
                },
              },
              match_id: matchId,
              jd_id: prev?.data?.jd_id || prev?.jd_id,
              duplicate: prev?.duplicate,
            };

            console.log("✅ UI State Updated", {
              new_score: updated.data.ats_score,
              newly_added_skills: updated.data.newly_added_skills,
              newly_added_soft_skills: updated.data.newly_added_soft_skills,
            });

            return updated;
          });
        }

        console.log("🎉 Skill addition completed successfully!");
      } catch (err: unknown) {
        console.error("❌ Add skill failed:", err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [matchResults, isUpdating, setMatchResults, getMatchId, onResumeUpdated]
  );

  // REMOVE SKILL - allows user to undo a skill addition
  const handleRemoveSingleSkill = useCallback(
    async (skill: string, skillType: SkillType = "technical") => {
      if (isUpdating) {
        console.warn("⚠️ Skill operation already in progress, please wait...");
        return;
      }

      try {
        setIsUpdating(true);

        const matchId = getMatchId();

        if (!matchId) {
          console.error("❌ Cannot find match_id");
          throw new Error("Match ID not found - cannot remove skill.");
        }

        console.log(
          `🔄 Removing ${skillType} skill "${skill}" from match ${matchId}...`
        );

        // Call the remove-skill API endpoint
        const response = await httpClient.post(
          `/matcher/live-update/${matchId}/remove-skill`,
          { skill_to_remove: skill }
        );

        const matcherData = response.data;
        console.log("✅ Skill removed via matcher endpoint", matcherData);

        // Note: Backend parser API doesn't have remove-skills endpoint yet
        // The removed skills will be tracked in matchResults and frontend template will update
        console.log(`📝 Skill "${skill}" will be removed from resume preview`);

        // Trigger UI update to force re-render of resume preview
        if (onResumeUpdated) {
          setTimeout(() => {
            console.log("🔄 Triggering resume preview refresh...");
            onResumeUpdated();
          }, 100);
        }

        // Update UI
        if (matcherData?.data || matcherData) {
          const responseData = matcherData?.data || matcherData;

          setMatchResults((prev: any) => {
            const prevMatchResult = prev?.data?.match_result || {};
            const techSkills = prevMatchResult.Technical_Skills || {};
            const softSkills = prevMatchResult.Soft_Skills || {};

            // Remove from newly added lists
            const prevNewlyAddedTech = prev?.data?.newly_added_skills || [];
            const prevNewlyAddedSoft = prev?.data?.newly_added_soft_skills || [];

            let newlyAddedSkills = prevNewlyAddedTech;
            let newlyAddedSoftSkills = prevNewlyAddedSoft;

            if (skillType === "technical") {
              newlyAddedSkills = prevNewlyAddedTech.filter(
                (s: string) => s.toLowerCase() !== skill.toLowerCase()
              );
            } else {
              newlyAddedSoftSkills = prevNewlyAddedSoft.filter(
                (s: string) => s.toLowerCase() !== skill.toLowerCase()
              );
            }

            // Remove from matched lists and add back to missing
            const removeFromMatched = (arr: any[]) =>
              (arr || []).filter((s: any) => {
                const skillName = typeof s === "string" ? s : s?.skill;
                return skillName?.toLowerCase() !== skill.toLowerCase();
              });

            const addBackToMissing = (missingArr: any[], matchedArr: any[]) => {
              const wasInMatched = (matchedArr || []).some((s: any) => {
                const skillName = typeof s === "string" ? s : s?.skill;
                return skillName?.toLowerCase() === skill.toLowerCase();
              });
              if (wasInMatched) {
                const alreadyInMissing = (missingArr || []).some((s: any) => {
                  const skillName = typeof s === "string" ? s : s?.skill;
                  return skillName?.toLowerCase() === skill.toLowerCase();
                });
                if (!alreadyInMissing) {
                  return [...(missingArr || []), skill];
                }
              }
              return missingArr || [];
            };

            const newScore =
              responseData.ats_scores?.new || prev?.data?.ats_score;

            const updated = {
              ...prev,
              data: {
                ...prev?.data,
                ats_score: newScore,
                newly_added_skills: newlyAddedSkills,
                newly_added_soft_skills: newlyAddedSoftSkills,
                match_result: {
                  ...prevMatchResult,
                  Technical_Skills: {
                    ...techSkills,
                    // Remove from matched and add back to missing
                    matched_critical_skills: removeFromMatched(
                      techSkills.matched_critical_skills
                    ),
                    matched_important_skills: removeFromMatched(
                      techSkills.matched_important_skills
                    ),
                    matched_nice_to_have: removeFromMatched(
                      techSkills.matched_nice_to_have
                    ),
                    missing_critical_skills: addBackToMissing(
                      techSkills.missing_critical_skills,
                      techSkills.matched_critical_skills
                    ),
                    missing_important_skills: addBackToMissing(
                      techSkills.missing_important_skills,
                      techSkills.matched_important_skills
                    ),
                    missing_nice_to_have: addBackToMissing(
                      techSkills.missing_nice_to_have,
                      techSkills.matched_nice_to_have
                    ),
                  },
                  Soft_Skills: {
                    ...softSkills,
                    matched_skills: removeFromMatched(softSkills.matched_skills),
                    missing_skills: addBackToMissing(
                      softSkills.missing_skills,
                      softSkills.matched_skills
                    ),
                  },
                },
              },
              match_id: matchId,
              jd_id: prev?.data?.jd_id || prev?.jd_id,
              duplicate: prev?.duplicate,
            };

            console.log("✅ UI State Updated after removal", {
              new_score: updated.data.ats_score,
              newly_added_skills: updated.data.newly_added_skills,
              newly_added_soft_skills: updated.data.newly_added_soft_skills,
            });

            return updated;
          });
        }

        console.log("🎉 Skill removal completed successfully!");
      } catch (err: unknown) {
        console.error("❌ Remove skill failed:", err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [matchResults, isUpdating, setMatchResults, getMatchId, onResumeUpdated]
  );

  return {
    handleAddSingleSkill,
    handleRemoveSingleSkill,
    isUpdating,
  };
};
