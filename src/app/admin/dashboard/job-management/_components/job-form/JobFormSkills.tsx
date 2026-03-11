import React, { memo } from 'react'

interface JobFormSkillsProps {
    skills: string[]
    skillInput: string
    onSkillInputChange: (value: string) => void
    onAddSkill: () => void
    onRemoveSkill: (index: number) => void
    getFieldError: (field: string) => string | undefined
}

const SkillTag = memo(({ skill, index, onRemove }: { skill: string; index: number; onRemove: (index: number) => void }) => (
    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-2">
        {skill}
        <button
            onClick={() => onRemove(index)}
            className="text-xs hover:text-red-500 transition-colors"
            type="button"
        >
            ✕
        </button>
    </span>
))

SkillTag.displayName = 'SkillTag'

export const JobFormSkills = memo(({
    skills,
    skillInput,
    onSkillInputChange,
    onAddSkill,
    onRemoveSkill,
    getFieldError
}: JobFormSkillsProps) => {
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            onAddSkill()
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <label className="text-lg font-semibold">Skills</label>
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <input
                        value={skillInput}
                        onChange={(e) => onSkillInputChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Add a skill"
                        className={`w-full p-2 bg-gray-100 rounded-md outline-none text-sm ${getFieldError('skills') ? 'border-2 border-red-500' : ''}`}
                    />
                    <button
                        onClick={onAddSkill}
                        type="button"
                        className="py-2 px-4 text-sm bg-white border border-gray-400 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Add
                    </button>
                </div>
                {getFieldError('skills') && (
                    <p className="text-xs text-red-600">{getFieldError('skills')}</p>
                )}
            </div>

            {skills.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                    {skills.map((skill, index) => (
                        <SkillTag
                            key={index}
                            skill={skill}
                            index={index}
                            onRemove={onRemoveSkill}
                        />
                    ))}
                </div>
            )}
        </div>
    )
})

JobFormSkills.displayName = 'JobFormSkills'
