
// import { jobs } from "../data/jobs";
// import MatchScoreCircle from "../_components/job-cards/MatchScoreCircle";
// interface PageProps {
//   params: Promise<{ id: string }>;
// }

// export default async function JobDetailsPage({ params }: PageProps) {
//   const { id } = await params;

//   const job = jobs.find((j) => j.id === id);

//   if (!job) {
//     return <div className="p-10 text-lg">Job not found</div>;
//   }

//   return (
//    <div>
//     <div className="mb-6 px-3 py-4">
//           <h1 className="text-xl font-semibold">Recommended Jobs for You</h1>
//           <p className="text-sm text-gray-500 mt-1">
//             Personalized opportunities matched to your skills and preferences
//           </p>
//         </div>
//     <div className="flex justify-center py-10">
//       <div className="bg-white w-[760px] rounded-xl border p-8">

//         {/* HEADER */}
//         <div className="flex justify-between items-start mb-6">
//           <div className="flex gap-4">
//             <img
//               src={job.logo}
//               alt={job.company}
//               className="w-14 h-14 rounded"
//             />
//             <div>
//               <h1 className="text-xl font-semibold">{job.title}</h1>
//               <p className="text-gray-600">{job.company}</p>

//               <div className="flex gap-3 text-sm text-gray-500 mt-1">
//                 <span>{job.location}</span>
//                 <span>• {job.type}</span>
//                 <span>• {job.salary}</span>
//               </div>
//             </div>
//           </div>

//           <MatchScoreCircle value={job.matchScore} />
//         </div>

//         {/* META INFO */}
//         <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-6">
//           <div>
//             <span className="font-medium">Experience</span>
//             <p>{job.experience}</p>
//           </div>
//           <div>
//             <span className="font-medium">Apply By</span>
//             <p>{job.applyBy}</p>
//           </div>
//           <div>
//             <span className="font-medium">Salary</span>
//             <p>{job.salary}</p>
//           </div>
//         </div>

//         {/* ABOUT ROLE */}
//         <section className="mb-6">
//           <h2 className="font-semibold mb-2">About the role</h2>
//           <p className="text-gray-700">{job.aboutRole}</p>
//         </section>

//         {/* RESPONSIBILITIES */}
//         {job.responsibilities && (
//           <section className="mb-6">
//             <h2 className="font-semibold mb-2">Key responsibilities</h2>
//             <ul className="list-disc pl-5 text-gray-700 space-y-1">
//               {job.responsibilities.map((item) => (
//                 <li key={item}>{item}</li>
//               ))}
//             </ul>
//           </section>
//         )}

//         {/* REQUIREMENTS */}
//         {job.requirements && (
//           <section className="mb-6">
//             <h2 className="font-semibold mb-2">Requirements</h2>
//             <ul className="list-disc pl-5 text-gray-700 space-y-1">
//               {job.requirements.map((item) => (
//                 <li key={item}>{item}</li>
//               ))}
//             </ul>
//           </section>
//         )}

//         {/* WHO CAN APPLY */}
//         <section className="mb-6">
//           <h2 className="font-semibold mb-2">Who can apply</h2>
//           <p className="text-gray-700">{job.whoCanApply}</p>
//         </section>

//         {/* ABOUT COMPANY */}
//         <section className="mb-8">
//           <h2 className="font-semibold mb-2">About {job.company}</h2>
//           <p className="text-gray-700">{job.aboutCompany}</p>
//         </section>

//         {/* ACTIONS */}
//         <div className="flex justify-center gap-4">
//           <button className="px-5 py-2 border rounded-md">
//             Save this job
//           </button>
//           {/* <button className="px-5 py-2 bg-blue-600 text-white rounded-md">
//             Apply now
//           </button> */}


//           <button
//   onClick={() => setOpenModal(true)}
//   className="px-5 py-2 bg-blue-600 text-white rounded-md"
// >
//   Apply now
// </button>
//         </div>

//       </div>
//     </div>
//     </div>
// );
// }




import { jobs } from "../data/jobs";
import JobDetailsClient from "./JobDetailsClient";
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function JobDetailsPage({ params }: PageProps) {
  const { id } = await params; // ✅ REQUIRED IN NEXT 16

  const job = jobs.find((j) => j.id === id);

  if (!job) {
    return <div className="p-10 text-lg">Job not found</div>;
  }

  return <JobDetailsClient job={job} />;
}











