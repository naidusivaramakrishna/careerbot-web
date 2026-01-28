"use client"
import { Sparkles, X } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import { getSkills, addSkill, deleteSkill, Skill } from '@/api/userApi';
import { toast } from "sonner";
import { useProfileContext } from '../context/ProfileContext';
import { ProfileData } from '../_types/ProfileData';
import logger from '@/lib/logger';

const skill_gap_analysis = ["Cloud", "Docker", "React"]

interface SkillsSectionProps {
    tempProfile: ProfileData;
    setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}

const SkillsSection = ({ tempProfile, setTempProfile }: SkillsSectionProps) => {
    const { setProfileData } = useProfileContext();
    const [newSkill, setNewSkill] = useState<string>("");
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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
                        logger.info('✅ Updated profile data with skills:', newProfile);
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

        setIsLoading(true);
        try {
            const addedSkill = await addSkill(newSkill.trim());
            const updatedSkills = [...skills, addedSkill];
            const updatedSkillNames = updatedSkills.map(s => s.name);

            setSkills(updatedSkills);

            // ✅ Update both tempProfile and global context using functional updates
            setTempProfile((prev) => ({ ...prev, skills: updatedSkillNames }));
            setProfileData((prev) => {
                const newProfile = { ...prev, skills: updatedSkillNames };
                logger.info('✅ Updated profile data after adding skill:', newProfile);
                return newProfile;
            });

            setNewSkill(""); // clear input after adding
            toast.success(`Added skill: ${addedSkill.name}`);
        } catch (error) {
            logger.error('Failed to add skill:', error);
            toast.error('Failed to add skill. Please try again.');
        } finally {
            setIsLoading(false);
        }
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
                logger.info('✅ Updated profile data after deleting skill:', newProfile);
                return newProfile;
            });

            toast.success('Skill removed');
        } catch (error) {
            logger.error('Failed to delete skill:', error);
            toast.error('Failed to delete skill');
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

                {/* Input */}
                <div className='flex gap-2 items-center my-4'>
                    <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                        placeholder="Add a skill..."
                        className="px-3 py-2 w-2/5 rounded-lg text-sm bg-background border border-gray-300"
                    />
                    <button
                        onClick={handleAddSkill}
                        disabled={isLoading || !newSkill.trim()}
                        className='bg-black text-white text-sm rounded-lg cursor-pointer px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {isLoading ? 'Adding...' : 'Add'}
                    </button>
                    <button className='bg-background shadow-sm text-sm cursor-pointer text-black flex items-center gap-1 rounded-lg px-3 py-2'>
                        <Sparkles className='w-4 h-4' />
                        Suggest With AI
                    </button>
                </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
                <div className="bg-white p-4 rounded-xl  my-4 shadow-sm border border-neutral-200">
                    <h3 className='my-4'>Skill Gap Analysis</h3>
                    <span className="text-sm text-neutral-600">
                        For the role <span className="font-medium">Software Engineer</span>, you are missing:
                        <div className='my-4 flex gap-1'>
                            {skill_gap_analysis.map((skill, index) => (
                                <span key={index} className='rounded-lg bg-black text-white  gap-2 px-2 py-1'>
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </span>
                    <button className='rounded-lg border border-neutral-200 cursor-pointer bg-white hover:bg-gray-100 px-4 py-1'>Generate Learning Plan</button>
                </div>
                <div className="bg-white p-4 rounded-xl  my-4 shadow-sm border border-neutral-200">
                    <h3 className='my-4'>Interview Readiness</h3>
                    <p className="text-sm text-neutral-600">Overall</p>
                    <div className="w-full h-2 bg-gray-200 rounded-lg mt-1">
                        <div className="h-2 bg-black rounded-lg" style={{ width: `60%` }}></div>
                    </div>
                    <span className='mt-2 text-xs text-neutral-500'>Based on mock interviews & coding bot results.</span>
                    <button className='bg-black shadow-sm mt-2 text-sm cursor-pointer text-white flex items-center gap-1 rounded-lg px-3 py-2'>
                        <Sparkles className='w-4 h-4' />
                        <span >Practice Interview</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SkillsSection