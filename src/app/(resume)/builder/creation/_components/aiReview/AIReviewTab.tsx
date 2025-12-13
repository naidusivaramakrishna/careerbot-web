"use client";
import React, { useMemo } from "react";
import { useResume } from "../../_context/ResumeContext"; // adjust path if needed
import type { ResumeData } from "../../_context/ResumeContext"; // ✅ import ResumeData type
import { CheckCircle, TrendingUp, Lightbulb, Sparkles } from "lucide-react";
const AIReviewTab: React.FC = () => {
  const { resumeData } = useResume();
  // ✅ Strongly type keys as keyof ResumeData
  const sections: { key: keyof ResumeData; label: string }[] = useMemo(
    () => [
      { key: "personalInfo", label: "Personal Info" },
      { key: "professionalSummary", label: "Professional Summary" },
      { key: "education", label: "Education" },
      { key: "workExperience", label: "Work Experience" },
      { key: "projects", label: "Projects" },
      { key: "skills", label: "Skills" },
      { key: "certifications", label: "Certifications" },
      { key: "achievements", label: "Achievements" },
      { key: "volunteering", label: "Volunteering" },
      { key: "references", label: "References" },
      { key: "internships", label: "Internships" },
      { key: "awards", label: "Awards" },
      { key: "hobbies", label: "Hobbies" },
      { key: "interests", label: "Interests" },
      { key: "languages", label: "Languages" },
      { key: "publications", label: "Publications" },

    ],
    []
  );
  const { filledCount, totalSections, emptySections } = useMemo(() => {
    let count = 0;
    const empties: string[] = [];
    for (const sec of sections) {
      const value = resumeData[sec.key]; // ✅ no TS error now
      let filled = false;
      if (Array.isArray(value)) {
        filled = value.length > 0;
      } else if (typeof value === "object" && value !== null) {
        filled = Object.values(value).some(
          (v) => v && v.toString().trim() !== ""
        );
      } else if (typeof value === "string") {
        filled = value.trim() !== "";
      }
      if (filled) {
        count++;
      } else {
        empties.push(sec.label);
      }
    }
    return {
      filledCount: count,
      totalSections: sections.length,
      emptySections: empties,
    };
  }, [resumeData, sections]);
  const score = Math.round((filledCount / totalSections) * 100);
  return (
    <div className="bg-gradient-to-br mb-4 from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 w-full">
      {/* Premium Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-15 h-10 bg-blue-100 rounded-lg shadow-md">
            <Sparkles className="text-blue-500" size={20} />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-gray-600 bg-clip-text ">
              AI Resume Review
            </h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Intelligent analysis of your resume completeness
            </p>
          </div>
        </div>
      </div>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Completion Progress
          </span>
          <span className="text-sm text-gray-500">
            {filledCount} of {totalSections} sections
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
          <div
            className={`h-3 rounded-full transition-all duration-500 ease-out ${
              score >= 90
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : score >= 75
                ? "bg-gradient-to-r from-blue-400 to-blue-500"
                : score >= 50
                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : "bg-gradient-to-r from-red-400 to-red-500"
            } shadow-sm`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
      {/* Status Message */}
      <div className="mb-6">
        {score === 100 ? (
          <div className="flex items-start bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-lg mr-3 mt-0.5">
              <CheckCircle className="text-emerald-600" size={18} />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-800 mb-1">
                Outstanding Work!
              </h4>
              <p className="text-emerald-700 text-sm leading-relaxed">
                Congratulations! You&#39;ve completed all resume sections. Your
                resume is comprehensive and ready to impress employers.
              </p>
            </div>
          </div>
        ) : score >= 75 ? (
          <div className="flex items-start bg-gray-50 border-2 border-gray-300 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mr-3 mt-0.5">
              <TrendingUp className="text-blue-600" size={18} />
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-1">
                Great Progress!
              </h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                You&#39;re doing well! Adding {totalSections - filledCount} more
                section{totalSections - filledCount > 1 ? "s" : ""} will make
                your resume even stronger.
              </p>
            </div>
          </div>
        ) : score >= 50 ? (
          <div className="flex items-start bg-gray-50 border-2 border-gray-300 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mr-3 mt-0.5">
              <TrendingUp className="text-blue-600" size={18} />
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-1">
                Nice Start!
              </h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                You&#39;re doing well! Adding {totalSections - filledCount} more
                section{totalSections - filledCount > 1 ? "s" : ""} will make
                your resume even stronger.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start border-2 border-gray-300 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mr-3 mt-0.5">
              <Lightbulb className="text-blue-600" size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-1 text-[15px]">
                Let&#39;s Enhance Your Resume
              </h4>
              <p className="text-gray-500 text-[12px] leading-relaxed">
                You&#39;ve filled {filledCount} of {totalSections} sections.
                Complete {totalSections - filledCount} more section
                {totalSections - filledCount > 1 ? "s" : ""} to significantly
                improve your resume&#39;s impact.
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Suggested Sections */}
      {emptySections.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Recommended Sections to Add
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {emptySections.map((label) => (
              <div
                key={label}
                className="group flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 border border-gray-200 hover:border-blue-200 rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer"
              >
                <span className="text-xs font-medium text-gray-700 group-hover:text-gray-800 transition-colors duration-200">
                  {label}
                </span>
              </div>
            ))}
          </div>
          {/* Call to Action */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-600 text-center">
              ⚡<span className="font-bold text-blue-600">Pro Tip :</span>{" "}
              Adding these sections will boost your resume&#39;s effectiveness
              and ATS compatibility
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default AIReviewTab;
