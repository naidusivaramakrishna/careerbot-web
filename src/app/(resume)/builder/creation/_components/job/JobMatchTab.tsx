"use client";
import React from "react";
import { CheckCircle, Calendar } from "lucide-react";
import { FaFileAlt, FaBriefcase } from "react-icons/fa";
import { useResume } from "../../_context/ResumeContext";

const JobMatchTab: React.FC = () => {
  const { lastUpdated } = useResume();

  const formattedDate = lastUpdated
    ? lastUpdated.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not updated yet";

  return (
    <div className="p-2 text-center bg-gradient-to-br from-gray-50 to-white min-h-[500px] flex flex-col justify-center">
      <div className="mb-4">
        <div className="w-12 h-12 mx-auto  bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
          <FaBriefcase className="h-8 w-8 text-white" />
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
        Find Jobs That Match Your Resume
      </h2>
      <p className="text-gray-600 text-xs leading-relaxed mb-8 max-w-sm mx-auto">
        Based on your resume, we will suggest opportunities tailored to your skills.
      </p>

      {/* Resume Card */}
      <div className="mb-8 bg-white shadow-lg hover:shadow-xl rounded-2xl p-2 flex gap-4 transition-all duration-300 border border-gray-100 hover:border-gray-200">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md">
          <FaFileAlt className="text-white h-6 w-6" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-semibold text-gray-900 text-base">Your Resume is Ready</p>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex gap-2 mb-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <p className="text-sm text-gray-500">
              Last updated: {formattedDate}
            </p>
          </div>
          {/* <button className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:shadow-sm">
            Preview Resume
          </button> */}
        </div>
      </div>

      {/* Stats or Benefits */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1">500+</div>
          <div className="text-xs text-gray-500 font-medium">Job Matches</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">95%</div>
          <div className="text-xs text-gray-500 font-medium">Match Accuracy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">24h</div>
          <div className="text-xs text-gray-500 font-medium">Response Time</div>
        </div>
      </div>

      {/* Job Match CTA */}
      <button className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 hover:from-blue-600 hover:via-blue-500 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]">
        {/* <Briefcase className="h-5 w-5" /> */}
        Match Me With Jobs
      </button>

      <p className="text-sm text-gray-500 mt-4 leading-relaxed">
        Clicking this will take you to the Job Portal with your resume attached.
      </p>
    </div>
  );
};

export default JobMatchTab;