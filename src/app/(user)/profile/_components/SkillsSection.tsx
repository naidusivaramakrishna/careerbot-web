"use client"
import { Plus, X } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import { getSkills, deleteSkill, Skill } from '@/api/userApi';
import { addSkillItem } from '../_utils/autoFillHelper';
import { toast } from "sonner";
import { useProfileContext } from '../context/ProfileContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { ProfileData } from '../_types/ProfileData';
import logger from '@/lib/logger';
import { suggestedSkills } from '../_utils/skillsData';

interface SkillsSectionProps {
    tempProfile: ProfileData;
    setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
    isAutoFill?: boolean;
}

const SkillsSection = ({ tempProfile, setTempProfile, isAutoFill = false }: SkillsSectionProps) => {
    const { setProfileData } = useProfileContext();
    const { refreshDashboard } = useDashboard();
    const [newSkill, setNewSkill] = useState<string>("");
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const fetchSkillsData = async () => {
            try {
                const fetchedSkills = await getSkills();
                setSkills(fetchedSkills);
                const skillNames = fetchedSkills.map(s => s.name);
                const currentSkills = tempProfile.skills || [];
                const hasChanged = JSON.stringify(currentSkills.sort()) !== JSON.stringify(skillNames.sort());
                if (hasChanged) {
                    setTempProfile((prev) => ({ ...prev, skills: skillNames }));
                    setProfileData((prev) => ({ ...prev, skills: skillNames }));
                }
            } catch (error) {
                logger.error('Failed to fetch skills:', error);
            }
        };
        fetchSkillsData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAddSkill = async () => {
        if (newSkill.trim() === "") return;
        await handleSelectSkill(newSkill.trim());
    };

    const handleDeleteSkill = async (index: number) => {
        const skillToDelete = skills[index];
        if (!skillToDelete?.id) return;
        try {
            await deleteSkill(skillToDelete.id);
            const updatedSkills = skills.filter((_, i) => i !== index);
            const updatedSkillNames = updatedSkills.map(s => s.name);
            setSkills(updatedSkills);
            setTempProfile((prev) => ({ ...prev, skills: updatedSkillNames }));
            setProfileData((prev) => ({ ...prev, skills: updatedSkillNames }));
            setTimeout(() => { refreshDashboard(); }, 300);
            toast.success('Skill removed');
        } catch (error) {
            logger.error('Failed to delete skill:', error);
            toast.error('Failed to delete skill');
        }
    };

    const currentSkillNames = skills.map(s => s.name);
    const filteredSuggestions =
        isFocused && newSkill.trim() === ""
            ? suggestedSkills.filter((skill) => !currentSkillNames.includes(skill))
            : newSkill.trim() === ""
                ? []
                : suggestedSkills.filter(
                    (skill) =>
                        skill.toLowerCase().includes(newSkill.toLowerCase()) &&
                        !currentSkillNames.includes(skill)
                );

    const handleSelectSkill = async (skill: string) => {
        setIsLoading(true);
        try {
            const addedSkill = await addSkillItem({ name: skill }, isAutoFill);
            const updatedSkills = [...skills, addedSkill];
            const updatedSkillNames = updatedSkills.map(s => s.name);
            setSkills(updatedSkills);
            setTempProfile((prev) => ({ ...prev, skills: updatedSkillNames }));
            setProfileData((prev) => ({ ...prev, skills: updatedSkillNames }));
            setTimeout(() => { refreshDashboard(); }, 300);
            setNewSkill("");
            setIsFocused(false);
        } catch (error) {
            logger.error('Failed to add skill:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-5 py-5">
            {/* Skill tags */}
            {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {skills.map((skill, index) => (
                        <span
                            key={skill.id || index}
                            className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full"
                        >
                            {skill.name}
                            <button
                                type="button"
                                data-testid={`skill-delete-btn-${index}`}
                                aria-label={`Remove ${skill.name}`}
                                onClick={() => handleDeleteSkill(index)}
                                className="w-4 h-4 bg-white rounded-full flex items-center justify-center hover:bg-red-50 transition shrink-0"
                            >
                                <X className="w-2.5 h-2.5 cursor-pointer text-gray-500 hover:text-red-500" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {skills.length === 0 && (
                <p className="text-xs text-gray-400 mb-4">No skills added yet. Start typing to add one.</p>
            )}

            {/* Input row */}
            <div className="flex gap-2 items-center relative">
                <div className="relative flex-1">
                    <input
                        type="text"
                        data-testid="skill-input"
                        id="new-skill"
                        name="new_skill"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 250)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && newSkill.trim()) {
                                e.preventDefault();
                                handleAddSkill();
                            }
                        }}
                        placeholder="Search or type a skill..."
                        className="w-full border border-gray-200 bg-gray-50 text-sm rounded-lg px-3 py-2.5 outline-none transition
                                   hover:border-gray-300 focus:ring-2 focus:ring-[#2257a7]/20 focus:border-[#2257a7] focus:bg-white"
                    />

                    {/* Suggestions dropdown */}
                    {filteredSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto bg-white shadow-lg z-20 text-sm">
                            {filteredSuggestions.map((skill) => (
                                <div
                                    key={skill}
                                    data-testid={`skill-suggestion-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                                    onMouseDown={() => handleSelectSkill(skill)}
                                    className="px-3 py-2.5 cursor-pointer hover:bg-[#EEF3FB] hover:text-[#2257a7] transition-colors"
                                >
                                    {skill}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    data-testid="add-skill-btn"
                    onClick={handleAddSkill}
                    disabled={isLoading || !newSkill.trim()}
                    className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-white bg-[#2257a7] hover:bg-[#1a4590] px-4 py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    {isLoading ? 'Adding...' : 'Add'}
                </button>
            </div>
        </div>
    );
}

export default SkillsSection
