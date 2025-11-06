import React from "react";
import { Building2 } from "lucide-react";

const hiddenJobMarketItems = ["Stealth FinTech – Junior Backend", "HealthAI – QA Engineer", "EduCloud – Full‑stack Intern"]
const CareerInsightsSection = () => {
  return (
    <div>
      <div className='grid grid-cols-2 gap-4'>
        <div className="bg-white p-4 rounded-xl  my-4 shadow-sm border border-neutral-200">
          <h3 className='my-4'>Resume Strength</h3>
          <div className="w-full h-2 bg-gray-200 rounded-lg mt-1">
            <div className="h-2 bg-black rounded-lg" style={{ width: `60%` }}></div>
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-700">
            <li>Add quantified impact to experience bullets.</li>
            <li>Tailor resume to “Software Engineer – Java”.</li>
            <li>Include 2 recent projects with GitHub links.</li>
          </ul>
          <button className='bg-black shadow-sm mt-4 text-sm cursor-pointer text-white rounded-lg px-3 py-2'>
            Auto-Improve With AI
          </button>
        </div>
        <div className="bg-white p-4 rounded-xl  my-4 shadow-sm border border-neutral-200">
          <h3 className='my-4'>Hidden Job Market</h3>
          <p className="text-sm text-neutral-600">We found 12 unlisted roles that match your profile signals.</p>
          <div className="mt-3 space-y-2 text-sm">
            {hiddenJobMarketItems.map((job, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg bg-neutral-100 p-2">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> {job}
                </span>
                <button className="bg-white rounded-lg px-4 py-1.5 ">Preview</button>
              </div>
            ))}
          </div>
          <button className='bg-black shadow-sm mt-4 text-sm cursor-pointer text-white rounded-lg px-3 py-2'>
            See All Matches
          </button>
        </div>
      </div>
    </div>
  );
};

export default CareerInsightsSection;
