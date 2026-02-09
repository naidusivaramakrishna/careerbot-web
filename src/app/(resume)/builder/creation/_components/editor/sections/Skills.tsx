"use client";
import React, { useRef } from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";
import TechnologyChipsInput from "../TechnologyChipsInput";
// import { technologies } from "../../../../../../../types/technologies";

const Skills: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const { errors, validateRequired, clearError } = useValidation();

  const containerRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  // Skill categories configuration
  const skillCategories = [
    {
      key: "programming_languages",
      label: "Programming Languages",
      placeholder: "e.g., Python, JavaScript, Java...",
      suggestions: ["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby"]
    },
    {
      key: "frameworks",
      label: "Frameworks & Libraries",
      placeholder: "e.g., React, Django, FastAPI...",
      suggestions: ["React", "Angular", "Vue.js", "Next.js", "Django", "FastAPI", "Flask", "Node.js", "Express.js", "Spring Boot", "ASP.NET", "Laravel"]
    },
    {
      key: "databases",
      label: "Databases",
      placeholder: "e.g., PostgreSQL, MongoDB...",
      suggestions: ["PostgreSQL", "MongoDB", "MySQL", "Redis", "DynamoDB", "Firebase", "Cassandra", "Oracle", "SQL Server", "SQLite"]
    },
    {
      key: "tools",
      label: "Tools & Technologies",
      placeholder: "e.g., Docker, Git, Jenkins...",
      suggestions: ["Docker", "Kubernetes", "Git", "Jenkins", "JIRA", "GitHub", "GitLab", "CircleCI", "Terraform", "Ansible", "Webpack", "Babel"]
    },
    {
      key: "cloud_platforms",
      label: "Cloud Platforms",
      placeholder: "e.g., AWS, Azure, Google Cloud...",
      suggestions: ["AWS", "Azure", "Google Cloud", "Heroku", "DigitalOcean", "Netlify", "Vercel", "IBM Cloud"]
    },
    {
      key: "soft_skills",
      label: "Soft Skills",
      placeholder: "e.g., Leadership, Communication...",
      suggestions: ["Leadership", "Team Collaboration", "Problem Solving", "Communication", "Time Management", "Critical Thinking", "Adaptability", "Creativity"]
    }
  ];

  // Initialize categorized skills if not present
  const categorizedSkills = resumeData.categorizedSkills || {
    programming_languages: [],
    frameworks: [],
    databases: [],
    tools: [],
    cloud_platforms: [],
    soft_skills: []
  };

  // Handle skills change for a specific category
  const handleCategorySkillsChange = (category: string, updatedSkills: string[]) => {
    const newCategorizedSkills = {
      ...categorizedSkills,
      [category]: updatedSkills
    };

    // Flatten all skills into the main skills array for backward compatibility
    const allSkills = Object.values(newCategorizedSkills).flat();

    console.log("🎯 Skills updated:", {
      category,
      updatedSkills,
      allSkills,
      categorizedSkills: newCategorizedSkills
    });

    setResumeData({
      ...resumeData,
      categorizedSkills: newCategorizedSkills,
      skills: allSkills // Keep flattened version for templates
    });

    if (updatedSkills.length > 0) {
      clearError("Skills", 0, category);
    }
  };

  // Validate on blur
  const handleBlur = (category: string) => {
    const categorySkills = categorizedSkills[category as keyof typeof categorizedSkills] || [];
    validateRequired("Skills", 0, { [category]: categorySkills.join(", ") });
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-6 ml-6 mt-3">
      {/* Form with Tips Panel */}
      <div className="flex gap-6 items-start">
        {/* Left Side: Scrollable Form Section */}
        <div 
          ref={formScrollRef}
          className="flex-1 h-[500px] overflow-y-auto mt-6 scrollbar-hide pr-2"
        >
          <div className="flex flex-col gap-6">
            {/* Render each skill category */}
            {skillCategories.map((category) => {
              const categoryKey = `Skills-0-${category.key}`;
              const currentSkills = categorizedSkills[category.key as keyof typeof categorizedSkills] || [];

              return (
                <div key={category.key} className="flex flex-col gap-1 relative">
                  <TechnologyChipsInput
                    label={category.label}
                    selectedTechnologies={currentSkills}
                    onTechnologiesChange={(skills) => handleCategorySkillsChange(category.key, skills)}
                    suggestions={category.suggestions}
                    placeholder={category.placeholder}
                    error={errors[categoryKey]}
                    // layout="vertical"
                  />
                  <div onBlur={() => handleBlur(category.key)} className="hidden" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Fixed Tips Section */}
        <div className="w-80 flex-shrink-0 sticky top-2">
          <div className="bg-[#faf9f8] rounded-lg p-5">
            <h3 className="text-base font-bold text-[#2d2d2d] mb-3">Tips</h3>
            <div className="border-t border-gray-300 mb-3"></div>
            <div className="space-y-4 text-sm text-[#3b3b3b] leading-relaxed">
              <p>
                <strong>Categorize your skills</strong> to make them easy to scan. Group them by Programming Languages, Frameworks, Databases, Tools, Cloud Platforms, and Soft Skills.
              </p>
              <p>
                List relevant technical and soft skills that align with your target role. Prioritize skills mentioned in job descriptions and industry-standard competencies.
              </p>
              <p>
                Use specific, searchable keywords that ATS systems recognize. Include both hard skills (technical) and soft skills (communication, leadership).
              </p>
              <p className="text-xs text-gray-500 italic mt-6">
                *70% of recruiters use ATS to filter candidates based on skills matching.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skills;







