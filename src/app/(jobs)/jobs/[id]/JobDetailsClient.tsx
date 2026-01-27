"use client";

import { useState } from "react";
import MatchScoreCircle from "../_components/job-cards/MatchScoreCircle";
import JobApplicationModal from "../_components/JobApplicationModal"; // ✅ CORRECT

export default function JobDetailsClient({ job }: any) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div>
        <div className="mb-6 px-3 py-4">
          <h1 className="text-xl font-semibold">Recommended Jobs for You</h1>
          <p className="text-sm text-gray-500 mt-1">
            Personalized opportunities matched to your skills and preferences
          </p>
        </div>

        <div className="flex justify-center py-10">
          <div className="bg-white w-[760px] rounded-xl border p-8">
            {/* HEADER */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <img src={job.logo} className="w-14 h-14 rounded" />
                {/* <div>
                  <h1 className="text-xl font-semibold">{job.title}</h1>
                  <p className="text-gray-600">{job.company}</p>
                </div> */}


                <div>
  <h1 className="text-xl font-semibold">{job.title}</h1>
  <p className="text-gray-600 mb-2">{job.company}</p>

  {/* DETAILS PILLS (JOB DETAILS PAGE ONLY) */}
  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
    <span className="px-2 py-1 bg-gray-100 rounded-md">
      📍 {job.location}
    </span>

    <span className="px-2 py-1 bg-gray-100 rounded-md">
      🕒 Immediate
    </span>

    <span className="px-2 py-1 bg-gray-100 rounded-md">
      💰 {job.salary}
    </span>

    <span className="px-2 py-1 bg-gray-100 rounded-md">
      🧑‍💼 {job.experience}
    </span>

    <span className="px-2 py-1 bg-gray-100 rounded-md">
      📅 Apply by {job.applyBy}
    </span>
  </div>
</div>

              </div>
              <MatchScoreCircle value={job.matchScore} />
            </div>

            {/* CONTENT (UNCHANGED) */}
            {/* ... keep all your sections exactly same ... */}


            {/* ABOUT ROLE */}
<section className="mb-6">
  <h2 className="font-semibold mb-2">About the role</h2>
  <p className="text-gray-700">{job.about}</p>
</section>

{/* RESPONSIBILITIES */}
{job.responsibilities && (
  <section className="mb-6">
    <h2 className="font-semibold mb-2">Key responsibilities</h2>
    <ul className="list-disc pl-5 text-gray-700 space-y-1">
      {job.responsibilities.map((item: string) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </section>
)}

{/* REQUIREMENTS */}
{job.requirements && (
  <section className="mb-6">
    <h2 className="font-semibold mb-2">Requirements</h2>
    <ul className="list-disc pl-5 text-gray-700 space-y-1">
      {job.requirements.map((item: string) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </section>
)}

{/* WHO CAN APPLY */}
<section className="mb-6">
  <h2 className="font-semibold mb-2">Who can apply</h2>
  <p className="text-gray-700">
    Only those candidates can apply who have minimum 5 years of experience.
  </p>
</section>

{/* ABOUT COMPANY */}
{job.aboutCompany && (
  <section className="mb-6">
    <h2 className="font-semibold mb-1">About {job.company}</h2>

    {/* {/* WEBSITE LINk /*} */}
    <a
  href={
    job.company === "Google"
      ? "https://www.google.com"
      : job.company === "Microsoft"
      ? "https://apply.careers.microsoft.com"
      : job.company === "Swiggy"
      ? "https://www.swiggy.com"
      : job.company === "CRED"
      ? "https://cred.club"
      : "#"
  }
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm text-blue-600 hover:underline inline-block mb-2"
>
  Website
</a>

    <p className="text-gray-700">{job.aboutCompany}</p>
  </section>
)}


            {/* ACTIONS */}
            <div className="flex justify-center gap-4">
              <button className="px-5 py-2 border rounded-md">
                Save this job
              </button>

              <button
                onClick={() => setOpen(true)}
                className="px-5 py-2 bg-blue-600 text-white rounded-md"
              >
                Apply now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {/* {open && <JobApplicationModal onClose={() => setOpen(false)} />} */}


      {open && (
  <JobApplicationModal
    job={job}
    onClose={() => setOpen(false)}
  />
)}
    </>
  );
}





