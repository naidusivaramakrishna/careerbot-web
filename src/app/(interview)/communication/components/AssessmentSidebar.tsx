// 'use client';

// interface Section {
//   id: number;
//   name: string;
//   description: string;
//   isLocked: boolean;
//   isCompleted: boolean;
//   isCurrent: boolean;
// }

// interface AssessmentSidebarProps {
//   sections: Section[];
//   currentSectionId: number;
//   overallProgress: number;
// }

// export default function AssessmentSidebar({
//   sections,
//   currentSectionId,
//   overallProgress,
// }: AssessmentSidebarProps) {
//   return (
//     <div className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto flex-shrink-0">
//       <div className="p-6">
//         {/* Progress Header */}
//         <div className="mb-6">
//           <h2 className="text-lg font-bold text-gray-900 mb-2">
//             Assessment Progress
//           </h2>
//           <div className="flex items-center justify-between mb-2">
//             <span className="text-sm text-gray-600">
//               Section {currentSectionId} of {sections.length}
//             </span>
//             <span className="text-sm font-semibold text-blue-600">
//               {overallProgress}% Complete
//             </span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2">
//             <div
//               className="bg-blue-600 h-2 rounded-full transition-all duration-300"
//               style={{ width: `${overallProgress}%` }}
//             ></div>
//           </div>
//         </div>

//         {/* Sections List */}
//         <div className="space-y-3">
//           {sections.map((section) => (
//             <div
//               key={section.id}
//               className={`relative p-4 rounded-lg border-2 transition-all ${
//                 section.isCurrent
//                   ? 'border-blue-500 bg-blue-50'
//                   : section.isCompleted
//                   ? 'border-gray-200 bg-white'
//                   : 'border-gray-200 bg-white opacity-60'
//               }`}
//             >
//               {/* Section Badge */}
//               <div className="flex items-center justify-between mb-2">
//                 <span
//                   className={`text-xs font-semibold px-2 py-1 rounded ${
//                     section.isCurrent
//                       ? 'bg-blue-600 text-white'
//                       : 'bg-gray-200 text-gray-600'
//                   }`}
//                 >
//                   Section {section.id}
//                 </span>
//                 {section.isLocked && (
//                   <svg
//                     className="w-4 h-4 text-gray-400"
//                     fill="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 )}
//                 {section.isCompleted && (
//                   <svg
//                     className="w-5 h-5 text-green-500"
//                     fill="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 )}
//               </div>

//               {/* Section Content */}
//               <h3
//                 className={`text-sm font-semibold mb-1 ${
//                   section.isCurrent ? 'text-gray-900' : 'text-gray-700'
//                 }`}
//               >
//                 {section.name}
//               </h3>
//               <p className="text-xs text-gray-500 leading-relaxed">
//                 {section.description}
//               </p>

//               {/* Current Section Indicator */}
//               {section.isCurrent && (
//                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-lg"></div>
//               )}
//             </div>
//           ))}
//         </div>

//         {/* Footer Instructions */}
//         <div className="mt-6 pt-6 border-t border-gray-200">
//           <div className="flex items-start gap-2 text-xs text-gray-600 mb-2">
//             <svg
//               className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
//               fill="currentColor"
//               viewBox="0 0 20 20"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             <span>Complete sections in order</span>
//           </div>
//           <div className="flex items-start gap-2 text-xs text-gray-600">
//             <svg
//               className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
//               fill="currentColor"
//               viewBox="0 0 20 20"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             <span>Locked sections will unlock as you progress</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// 'use client';

// import { Lock } from 'lucide-react';

// const sections = [
//   { id: 1, title: 'See & Repeat', desc: 'Test your pronunciation clarity', active: true },
//   { id: 2, title: 'Listen & Repeat', desc: 'Assess your listening accuracy' },
//   { id: 3, title: 'Jumbled Sentence', desc: 'Evaluate sentence structure understanding' },
//   { id: 4, title: 'Sentence Completion', desc: 'Test vocabulary and context understanding' },
//   { id: 5, title: 'Listen & Correct', desc: 'Identify and correct errors' },
//   { id: 6, title: 'Story Listening', desc: 'Evaluate comprehension and retention' },
//   { id: 7, title: 'Situation Explaining', desc: 'Describe the situation' },
// ];

// export default function AssessmentSidebar() {
//   return (
//     <aside className="w-80 bg-white border-r px-4 py-6">
//       <h2 className="text-sm font-semibold text-gray-700 mb-4">
//         Assessment Progress
//       </h2>

//       {/* OVERALL PROGRESS */}
//       <div className="mb-6">
//         <div className="flex justify-between text-xs text-gray-500 mb-1">
//           <span>Section 1 of 7</span>
//           <span className="text-blue-600 font-medium">2% Complete</span>
//         </div>
//         <div className="w-full bg-gray-200 rounded-full h-2">
//           <div className="bg-blue-600 h-2 rounded-full w-[2%]" />
//         </div>
//       </div>

//       {/* SECTIONS */}
//       <ul className="space-y-3">
//         {sections.map((s) => (
//           <li
//             key={s.id}
//             className={`flex items-start justify-between p-3 rounded-lg border ${
//               s.active
//                 ? 'border-blue-500 bg-blue-50'
//                 : 'border-gray-200 bg-gray-50 text-gray-400'
//             }`}
//           >
//             <div>
//               <p className={`text-sm font-semibold ${s.active ? 'text-blue-700' : ''}`}>
//                 Section {s.id}
//               </p>
//               <p className="text-sm">{s.title}</p>
//               <p className="text-xs">{s.desc}</p>
//             </div>

//             <div className="pt-1">
//               {s.active ? (
//                 <span className="w-4 h-4 rounded-full border-2 border-blue-600 block" />
//               ) : (
//                 <Lock size={14} />
//               )}
//             </div>
//           </li>
//         ))}
//       </ul>

//       <p className="text-xs text-gray-400 mt-6">
//         Complete sections in order <br />
//         Locked sections will unlock as you progress
//       </p>
//     </aside>
//   );
// }
// before dynamic 



// 'use client';

// import { Lock, CheckCircle2 } from 'lucide-react';

// interface Section {
//   id: number;
//   title: string;
//   desc: string;
// }

// const sections: Section[] = [
//   { id: 1, title: 'See & Repeat', desc: 'Test your pronunciation clarity' },
//   { id: 2, title: 'Listen & Repeat', desc: 'Repeat what you hear' },
//   { id: 3, title: 'Jumbled Sentence', desc: 'Evaluate sentence structure understanding' },
//   { id: 4, title: 'Sentence Completion', desc: 'Test vocabulary and context understanding' },
//   { id: 5, title: 'Listen & Correct', desc: 'Identify and correct errors' },
//   { id: 6, title: 'Story Listening', desc: 'Evaluate comprehension and retention' },
//   { id: 7, title: 'Situation Explaining', desc: 'Describe the situation clearly' },
// ];

// interface AssessmentSidebarProps {
//   /** Current active section number (1-based) */
//   currentSectionId: number;
// }

// export default function AssessmentSidebar({
//   currentSectionId,
// }: AssessmentSidebarProps) {
//   const totalSections = sections.length;
//   const completedSections = currentSectionId - 1;
//   const progressPercent = Math.round(
//     (completedSections / totalSections) * 100
//   );

//   return (
//     <aside className="w-80 bg-white px-4 py-6">
//       <h2 className="text-sm font-semibold text-gray-700 mb-4">
//         Assessment Progress
//       </h2>

//       {/* OVERALL PROGRESS */}
//       <div className="mb-6">
//         <div className="flex justify-between text-xs text-gray-500 mb-1">
//           <span>
//             Section {currentSectionId} of {totalSections}
//           </span>
//           <span className="text-blue-600 font-medium">
//             {progressPercent}% Complete
//           </span>
//         </div>

//         <div className="w-full bg-gray-200 rounded-full h-2">
//           <div
//             className="bg-blue-600 h-2 rounded-full transition-all"
//             style={{ width: `${progressPercent}%` }}
//           />
//         </div>
//       </div>

//       {/* SECTIONS LIST */}
//       <ul className="space-y-3">
//         {sections.map((section) => {
//           const isCompleted = section.id < currentSectionId;
//           const isActive = section.id === currentSectionId;
//           const isLocked = section.id > currentSectionId;

//           return (
//             <li
//               key={section.id}
//               className={`flex items-start justify-between p-3 rounded-lg border transition ${
//                 isCompleted
//                   ? 'border-green-400 bg-green-50'
//                   : isActive
//                   ? 'border-blue-500 bg-blue-50'
//                   : 'border-gray-200 bg-gray-50 text-gray-400'
//               }`}
//             >
//               <div>
//                 <span
//                   className={`inline-block text-xs font-semibold px-2 py-0.5 rounded mb-1 ${
//                     isCompleted
//                       ? 'bg-green-600 text-white'
//                       : isActive
//                       ? 'bg-blue-600 text-white'
//                       : 'bg-gray-300 text-gray-600'
//                   }`}
//                 >
//                   Section {section.id}
//                 </span>

//                 <p
//                   className={`text-sm font-semibold ${
//                     isActive
//                       ? 'text-blue-700'
//                       : isCompleted
//                       ? 'text-green-700'
//                       : ''
//                   }`}
//                 >
//                   {section.title}
//                 </p>

//                 <p className="text-xs">{section.desc}</p>

//                 {isCompleted && (
//                   <p className="text-xs text-green-600 mt-1">
//                     8 Questions completed
//                   </p>
//                 )}
//               </div>

//               <div className="pt-1">
//                 {isCompleted && (
//                   <CheckCircle2 size={18} className="text-green-600" />
//                 )}

//                 {isActive && (
//                   <span className="w-4 h-4 rounded-full border-2 border-blue-600 block mt-1" />
//                 )}

//                 {isLocked && <Lock size={14} />}
//               </div>
//             </li>
//           );
//         })}
//       </ul>

//       <p className="text-xs text-gray-400 mt-6">
//         Complete sections in order <br />
//         Locked sections will unlock as you progress
//       </p>
//     </aside>
//   );
// }
// before well working but circle for inactive sections



// 'use client';

// import { Lock, CheckCircle2 } from 'lucide-react';

// interface Section {
//   id: number;
//   title: string;
//   desc: string;
// }

// const sections: Section[] = [
//   { id: 1, title: 'See & Repeat', desc: 'Test your pronunciation clarity' },
//   { id: 2, title: 'Listen & Repeat', desc: 'Repeat what you hear' },
//   {
//     id: 3,
//     title: 'Jumbled Sentence',
//     desc: 'Evaluate sentence structure understanding',
//   },
//   {
//     id: 4,
//     title: 'Sentence Completion',
//     desc: 'Test vocabulary and context understanding',
//   },
//   { id: 5, title: 'Listen & Correct', desc: 'Identify and correct errors' },
//   {
//     id: 6,
//     title: 'Story Listening',
//     desc: 'Evaluate comprehension and retention',
//   },
//   {
//     id: 7,
//     title: 'Situation Explaining',
//     desc: 'Describe the situation clearly',
//   },
// ];

// interface AssessmentSidebarProps {
//   /** Current active section number (1-based) */
//   currentSectionId: number;
// }

// export default function AssessmentSidebar({
//   currentSectionId,
// }: AssessmentSidebarProps) {
//   const totalSections = sections.length;
//   const completedSections = currentSectionId - 1;
//   const progressPercent = Math.round(
//     (completedSections / totalSections) * 100
//   );

//   return (
//     <aside className="w-80 bg-white px-4 py-6">
//       <h2 className="text-sm font-semibold text-gray-700 mb-4">
//         Assessment Progress
//       </h2>

//       {/* OVERALL PROGRESS */}
//       <div className="mb-6">
//         <div className="flex justify-between text-xs text-gray-500 mb-1">
//           <span>
//             Section {currentSectionId} of {totalSections}
//           </span>
//           <span className="text-blue-600 font-medium">
//             {progressPercent}% Complete
//           </span>
//         </div>

//         <div className="w-full bg-gray-200 rounded-full h-2">
//           <div
//             className="bg-blue-600 h-2 rounded-full transition-all"
//             style={{ width: `${progressPercent}%` }}
//           />
//         </div>
//       </div>

//       {/* SECTIONS LIST */}
//       <ul className="space-y-3">
//         {sections.map((section) => {
//           const isCompleted = section.id < currentSectionId;
//           const isActive = section.id === currentSectionId;
//           const isLocked = section.id > currentSectionId;

//           return (
//             <li
//               key={section.id}
//               className={`flex items-start justify-between p-3 rounded-lg border transition ${
//                 isCompleted
//                   ? 'border-green-400 bg-green-50'
//                   : isActive
//                   ? 'border-blue-500 bg-blue-50'
//                   : 'border-gray-200 bg-gray-50 text-gray-400'
//               }`}
//             >
//               <div>
//                 {/* SECTION TAG */}
//                 <span
//                   className={`inline-block text-xs font-semibold px-2 py-0.5 rounded mb-1 ${
//                     isCompleted
//                       ? 'bg-green-600 text-white'
//                       : isActive
//                       ? 'bg-blue-600 text-white'
//                       : 'bg-gray-300 text-gray-600'
//                   }`}
//                 >
//                   Section {section.id}
//                 </span>

//                 {/* TITLE */}
//                 <p
//                   className={`text-sm font-semibold ${
//                     isActive
//                       ? 'text-blue-700'
//                       : isCompleted
//                       ? 'text-green-700'
//                       : ''
//                   }`}
//                 >
//                   {section.title}
//                 </p>

//                 {/* DESCRIPTION */}
//                 <p className="text-xs">{section.desc}</p>

//                 {/* COMPLETED TEXT */}
//                 {isCompleted && (
//                   <p className="text-xs text-green-600 mt-1">
//                     8 Questions completed
//                   </p>
//                 )}
//               </div>

//               {/* RIGHT ICON AREA */}
//               <div className="pt-1 flex flex-col items-center gap-1">
//                 {/* COMPLETED */}
//                 {isCompleted && (
//                   <CheckCircle2 size={18} className="text-green-600" />
//                 )}

//                 {/* ACTIVE */}
//                 {isActive && (
//                   <span className="w-4 h-4 rounded-full border-2 border-blue-600 block" />
//                 )}

//                 {/* LOCKED */}
//                 {isLocked && (
//                   <>
//                     <span className="w-4 h-4 rounded-full border-2 border-gray-300 block" />
//                     <Lock size={14} className="text-gray-400 -mt-1" />
//                   </>
//                 )}
//               </div>
//             </li>
//           );
//         })}
//       </ul>

//       <p className="text-xs text-gray-400 mt-6">
//         Complete sections in order <br />
//         Locked sections will unlock as you progress
//       </p>
//     </aside>
//   );
// }
// before scroll


// 'use client';

// import { Lock, CheckCircle2 } from 'lucide-react';

// interface Section {
//   id: number;
//   title: string;
//   desc: string;
// }

// const sections: Section[] = [
//   { id: 1, title: 'See & Repeat', desc: 'Test your pronunciation clarity' },
//   { id: 2, title: 'Listen & Repeat', desc: 'Repeat what you hear' },
//   {
//     id: 3,
//     title: 'Jumbled Sentence',
//     desc: 'Evaluate sentence structure understanding',
//   },
//   {
//     id: 4,
//     title: 'Sentence Completion',
//     desc: 'Test vocabulary and context understanding',
//   },
//   { id: 5, title: 'Listen & Correct', desc: 'Identify and correct errors' },
//   {
//     id: 6,
//     title: 'Story Listening',
//     desc: 'Evaluate comprehension and retention',
//   },
//   {
//     id: 7,
//     title: 'Situation Explaining',
//     desc: 'Describe the situation clearly',
//   },
// ];

// interface AssessmentSidebarProps {
//   currentSectionId: number;
// }

// export default function AssessmentSidebar({
//   currentSectionId,
// }: AssessmentSidebarProps) {
//   const totalSections = sections.length;
//   const completedSections = currentSectionId - 1;
//   const progressPercent = Math.round(
//     (completedSections / totalSections) * 100
//   );

//   return (
//     <aside className="w-80 h-screen bg-white flex flex-col">
//       {/* ================= TOP (STATIC) ================= */}
//       <div className="px-4 py-6">
//         <h2 className="text-sm font-semibold text-gray-700 mb-4">
//           Assessment Progress
//         </h2>

//         {/* OVERALL PROGRESS */}
//         <div>
//           <div className="flex justify-between text-xs text-gray-500 mb-1">
//             <span>
//               Section {currentSectionId} of {totalSections}
//             </span>
//             <span className="text-blue-600 font-medium">
//               {progressPercent}% Complete
//             </span>
//           </div>

//           <div className="w-full bg-gray-200 rounded-full h-2">
//             <div
//               className="bg-blue-600 h-2 rounded-full transition-all"
//               style={{ width: `${progressPercent}%` }}
//             />
//           </div>
//         </div>
//       </div>

//       {/* ================= SCROLLABLE SECTIONS ================= */}
//       <div className="flex-1 overflow-y-auto scrollbar-hide px-4">
//         <ul className="space-y-3 pb-4">
//           {sections.map((section) => {
//             const isCompleted = section.id < currentSectionId;
//             const isActive = section.id === currentSectionId;
//             const isLocked = section.id > currentSectionId;

//             return (
//               <li
//                 key={section.id}
//                 className={`flex items-start justify-between p-3 rounded-lg border transition ${
//                   isCompleted
//                     ? 'border-green-400 bg-green-50'
//                     : isActive
//                     ? 'border-blue-500 bg-blue-50'
//                     : 'border-gray-200 bg-gray-50 text-gray-400'
//                 }`}
//               >
//                 <div>
//                   {/* SECTION TAG */}
//                   <span
//                     className={`inline-block text-xs font-semibold px-2 py-0.5 rounded mb-1 ${
//                       isCompleted
//                         ? 'bg-green-600 text-white'
//                         : isActive
//                         ? 'bg-blue-600 text-white'
//                         : 'bg-gray-300 text-gray-600'
//                     }`}
//                   >
//                     Section {section.id}
//                   </span>

//                   {/* TITLE */}
//                   <p
//                     className={`text-sm font-semibold ${
//                       isActive
//                         ? 'text-blue-700'
//                         : isCompleted
//                         ? 'text-green-700'
//                         : ''
//                     }`}
//                   >
//                     {section.title}
//                   </p>

//                   {/* DESCRIPTION */}
//                   <p className="text-xs">{section.desc}</p>

//                   {/* COMPLETED INFO */}
//                   {isCompleted && (
//                     <p className="text-xs text-green-600 mt-1">
//                       8 Questions completed
//                     </p>
//                   )}
//                 </div>

//                 {/* RIGHT ICON */}
//                 <div className="pt-1 flex flex-col items-center gap-1">
//                   {isCompleted && (
//                     <CheckCircle2 size={18} className="text-green-600" />
//                   )}

//                   {isActive && (
//                     <span className="w-4 h-4 rounded-full border-2 border-blue-600 block" />
//                   )}

//                   {isLocked && (
//                     <>
//                       <span className="w-4 h-4 rounded-full border-2 border-gray-300 block" />
//                       <Lock size={14} className="text-gray-400 -mt-1" />
//                     </>
//                   )}
//                 </div>
//               </li>
//             );
//           })}
//         </ul>
//       </div>

//       {/* ================= FOOTER (STATIC) ================= */}
//       <div className="px-4 py-4">
//         <p className="text-xs text-gray-400">
//           Complete sections in order <br />
//           Locked sections will unlock as you progress
//         </p>
//       </div>
//     </aside>
//   );
// }



// 'use client';

// import { Lock, CheckCircle2 } from 'lucide-react';

// interface Section {
//   id: number;
//   title: string;
//   desc: string;
// }

// const sections: Section[] = [
//   { id: 1, title: 'See & Repeat', desc: 'Test your pronunciation clarity' },
//   { id: 2, title: 'Listen & Repeat', desc: 'Repeat what you hear' },
//   {
//     id: 3,
//     title: 'Jumbled Sentence',
//     desc: 'Evaluate sentence structure understanding',
//   },
//   {
//     id: 4,
//     title: 'Sentence Completion',
//     desc: 'Test vocabulary and context understanding',
//   },
//   { id: 5, title: 'Listen & Correct', desc: 'Identify and correct errors' },
//   {
//     id: 6,
//     title: 'Story Listening',
//     desc: 'Evaluate comprehension and retention',
//   },
//   {
//     id: 7,
//     title: 'Situation Explaining',
//     desc: 'Describe the situation clearly',
//   },
// ];

// interface AssessmentSidebarProps {
//   currentSectionId: number;
// }

// export default function AssessmentSidebar({
//   currentSectionId,
// }: AssessmentSidebarProps) {
//   const totalSections = sections.length;
//   const completedSections = currentSectionId - 1;
//   const progressPercent = Math.round(
//     (completedSections / totalSections) * 100
//   );

//   return (
//     <aside className="w-80 h-screen bg-white flex flex-col">
//       {/* ================= HEADER (STATIC) ================= */}
//       <div className="px-4 py-6 shrink-0">
//         <h2 className="text-sm font-semibold text-gray-700 mb-4">
//           Assessment Progress
//         </h2>

//         <div>
//           <div className="flex justify-between text-xs text-gray-500 mb-1">
//             <span>
//               Section {currentSectionId} of {totalSections}
//             </span>
//             <span className="text-blue-600 font-medium">
//               {progressPercent}% Complete
//             </span>
//           </div>

//           <div className="w-full bg-gray-200 rounded-full h-2">
//             <div
//               className="bg-blue-600 h-2 rounded-full transition-all"
//               style={{ width: `${progressPercent}%` }}
//             />
//           </div>
//         </div>
//       </div>

//       {/* ================= SCROLL AREA (FIXED) ================= */}
//       <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4">
//         <ul className="space-y-3">
//           {sections.map((section) => {
//             const isCompleted = section.id < currentSectionId;
//             const isActive = section.id === currentSectionId;
//             const isLocked = section.id > currentSectionId;

//             return (
//               <li
//                 key={section.id}
//                 className={`flex items-start justify-between p-3 rounded-lg border transition ${
//                   isCompleted
//                     ? 'border-green-400 bg-green-50'
//                     : isActive
//                     ? 'border-blue-500 bg-blue-50'
//                     : 'border-gray-200 bg-gray-50 text-gray-400'
//                 }`}
//               >
//                 <div>
//                   <span
//                     className={`inline-block text-xs font-semibold px-2 py-0.5 rounded mb-1 ${
//                       isCompleted
//                         ? 'bg-green-600 text-white'
//                         : isActive
//                         ? 'bg-blue-600 text-white'
//                         : 'bg-gray-300 text-gray-600'
//                     }`}
//                   >
//                     Section {section.id}
//                   </span>

//                   <p
//                     className={`text-sm font-semibold ${
//                       isActive
//                         ? 'text-blue-700'
//                         : isCompleted
//                         ? 'text-green-700'
//                         : ''
//                     }`}
//                   >
//                     {section.title}
//                   </p>

//                   <p className="text-xs">{section.desc}</p>

//                   {isCompleted && (
//                     <p className="text-xs text-green-600 mt-1">
//                       8 Questions completed
//                     </p>
//                   )}
//                 </div>

//                 <div className="pt-1 flex flex-col items-center gap-1">
//                   {isCompleted && (
//                     <CheckCircle2 size={18} className="text-green-600" />
//                   )}

//                   {isActive && (
//                     <span className="w-4 h-4 rounded-full border-2 border-blue-600 block" />
//                   )}

//                   {isLocked && (
//                     <>
//                       <span className="w-4 h-4 rounded-full border-2 border-gray-300 block" />
//                       <Lock size={14} className="text-gray-400 -mt-1" />
//                     </>
//                   )}
//                 </div>
//               </li>
//             );
//           })}
//         </ul>
//       </div>

//       {/* ================= FOOTER (STATIC, NO GAP) ================= */}
//       <div className="px-4 py-4 shrink-0">
//         <p className="text-xs text-gray-400">
//           Complete sections in order <br />
//           Locked sections will unlock as you progress
//         </p>
//       </div>
//     </aside>
//   );
// }
// before lock icon



'use client';

import { Lock, CheckCircle2 } from 'lucide-react';

interface Section {
  id: number;
  title: string;
  desc: string;
}

const sections: Section[] = [
  { id: 1, title: 'See & Repeat', desc: 'Test your pronunciation clarity' },
  { id: 2, title: 'Listen & Repeat', desc: 'Repeat what you hear' },
  {
    id: 3,
    title: 'Jumbled Sentence',
    desc: 'Evaluate sentence structure understanding',
  },
  {
    id: 4,
    title: 'Sentence Completion',
    desc: 'Test vocabulary and context understanding',
  },
  { id: 5, title: 'Listen & Correct', desc: 'Identify and correct errors' },
  {
    id: 6,
    title: 'Story Listening',
    desc: 'Evaluate comprehension and retention',
  },
  {
    id: 7,
    title: 'Situation Explaining',
    desc: 'Describe the situation clearly',
  },
];

interface AssessmentSidebarProps {
  currentSectionId: number;
}

export default function AssessmentSidebar({
  currentSectionId,
}: AssessmentSidebarProps) {
  const totalSections = sections.length;
  const completedSections = currentSectionId - 1;
  const progressPercent = Math.round(
    (completedSections / totalSections) * 100
  );

  return (
    <aside className="w-80 h-screen bg-white flex flex-col">
      {/* ================= HEADER ================= */}
      <div className="px-4 py-6 shrink-0">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Assessment Progress
        </h2>

        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              Section {currentSectionId} of {totalSections}
            </span>
            <span className="text-blue-600 font-medium">
              {progressPercent}% Complete
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ================= SCROLLABLE SECTIONS ================= */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4">
        <ul className="space-y-3">
          {sections.map((section) => {
            const isCompleted = section.id < currentSectionId;
            const isActive = section.id === currentSectionId;
            const isLocked = section.id > currentSectionId;

            return (
              <li
                key={section.id}
                className={`flex items-start justify-between p-3 rounded-lg border transition ${
                  isCompleted
                    ? 'border-green-400 bg-green-50'
                    : isActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 text-gray-400'
                }`}
              >
                {/* LEFT CONTENT */}
                <div>
                  {/* SECTION LABEL + LOCK */}
                  <div className="flex items-center gap-1 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      Section {section.id}
                      {isLocked && (
                        <Lock size={12} className="ml-1" />
                      )}
                    </span>
                  </div>

                  {/* TITLE */}
                  <p
                    className={`text-sm font-semibold ${
                      isActive
                        ? 'text-blue-700'
                        : isCompleted
                        ? 'text-green-700'
                        : ''
                    }`}
                  >
                    {section.title}
                  </p>

                  {/* DESCRIPTION */}
                  <p className="text-xs">{section.desc}</p>

                  {/* COMPLETED INFO */}
                  {isCompleted && (
                    <p className="text-xs text-green-600 mt-1">
                      8 Questions completed
                    </p>
                  )}
                </div>

                {/* RIGHT INDICATOR */}
                <div className="pt-1">
                  {isCompleted && (
                    <CheckCircle2 size={18} className="text-green-600" />
                  )}

                  {isActive && (
                    <span className="w-4 h-4 rounded-full border-2 border-blue-600 block" />
                  )}

                  {isLocked && (
                    <span className="w-4 h-4 rounded-full border-2 border-gray-300 block" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="px-4 py-4 shrink-0">
        <p className="text-xs text-gray-400">
          Complete sections in order <br />
          Locked sections will unlock as you progress
        </p>
      </div>
    </aside>
  );
}
