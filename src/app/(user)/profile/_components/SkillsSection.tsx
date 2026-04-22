"use client"
import { X } from 'lucide-react';
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
    isAutoFill?: boolean; // Flag to indicate if data is from resume/LinkedIn import
}

const SkillsSection = ({ tempProfile, setTempProfile, isAutoFill = false }: SkillsSectionProps) => {
    const { setProfileData } = useProfileContext();
    const { refreshDashboard } = useDashboard();
    const [newSkill, setNewSkill] = useState<string>("");
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Fetch skills on component mount
    useEffect(() => {
        const fetchSkillsData = async () => {
            try {
                const fetchedSkills = await getSkills();
                setSkills(fetchedSkills);

                const skillNames = fetchedSkills.map(s => s.name);

                // ✅ Update both tempProfile and global context only if data changed
                const currentSkills = tempProfile.skills || [];
                const hasChanged = JSON.stringify(currentSkills.sort()) !== JSON.stringify(skillNames.sort());

                if (hasChanged) {
                    setTempProfile((prev) => ({ ...prev, skills: skillNames }));
                    setProfileData((prev) => {
                        const newProfile = { ...prev, skills: skillNames };
                        logger.info('✅ Updated profile data with skills');
                        return newProfile;
                    });
                }
            } catch (error) {
                logger.error('Failed to fetch skills:', error);
            }
        };

        fetchSkillsData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ✅ Run only once on mount

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

            // ✅ Update both tempProfile and global context using functional updates
            setTempProfile((prev) => ({ ...prev, skills: updatedSkillNames }));
            setProfileData((prev) => {
                const newProfile = { ...prev, skills: updatedSkillNames };
                logger.info('✅ Updated profile data after deleting skill');
                return newProfile;
            });

            // Refresh dashboard with delay to prevent multiple toast notifications
            setTimeout(() => {
                refreshDashboard();
            }, 300);

            toast.success('Skill removed');
        } catch (error) {
            logger.error('Failed to delete skill:', error);
            toast.error('Failed to delete skill');
        }
    };

    // Get filtered skill suggestions based on input and focus state
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
            // Both resume import and manual entry use the same endpoint
            const addedSkill = await addSkillItem({ name: skill }, isAutoFill);
            const updatedSkills = [...skills, addedSkill];
            const updatedSkillNames = updatedSkills.map(s => s.name);

            setSkills(updatedSkills);

            // ✅ Update both tempProfile and global context using functional updates
            setTempProfile((prev) => ({ ...prev, skills: updatedSkillNames }));
            setProfileData((prev) => {
                const newProfile = { ...prev, skills: updatedSkillNames };
                return newProfile;
            });

            // Refresh dashboard with delay to prevent multiple toast notifications
            setTimeout(() => {
                refreshDashboard();
            }, 300);

            setNewSkill(""); // clear input after adding
            setIsFocused(false);
        } catch (error) {
            logger.error('Failed to add skill:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {/* Skills List */}
            <div className="rounded-xl shadow-sm bg-white border border-gray-300  py-6 px-4 mb-3">
                <div className='flex flex-wrap gap-2 my-1'>
                    {skills.map((skill, index) => (
                        <span
                            key={skill.id || index}
                            className="flex bg-gray-100 border border-gray-200 shadow-sm items-center gap-1 px-3 py-1 rounded-lg text-sm"
                        >
                            {skill.name}
                            <button
                                type="button"
                                className="ml-1 text-gray-600  hover:text-black"
                                onClick={() => handleDeleteSkill(index)}
                            >
                                <div className="w-4 h-4 bg-white flex items-center justify-center rounded-full">
                                    <X className="w-3 h-3 cursor-pointer font-bold text-black" />
                                </div>
                            </button>
                        </span>
                    ))}
                </div>

                {/* Input with Suggestions */}
                <div className='flex gap-2 items-center my-4 relative'>
                    <div className='relative w-2/5'>
                        <input
                            type="text"
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
                            placeholder="Add a skill..."
                            className="px-3 py-2 w-full rounded-lg text-sm bg-background border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />

                        {/* Suggestions Dropdown */}
                        {filteredSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 border border-gray-300 rounded mt-1 max-h-48 overflow-y-auto bg-white shadow-lg z-20 text-sm">
                                {filteredSuggestions.map((skill) => (
                                    <div
                                        key={skill}
                                        onMouseDown={() => handleSelectSkill(skill)}
                                        className="px-3 py-2 cursor-pointer hover:bg-blue-100 transition-colors"
                                    >
                                        {skill}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAddSkill}
                        disabled={isLoading || !newSkill.trim()}
                        className='bg-black text-white text-sm rounded-lg cursor-pointer px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {isLoading ? 'Adding...' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SkillsSection
