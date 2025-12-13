// import React, { useState } from "react";
// import { ChevronDown, ChevronRight, Trash2, Check } from "lucide-react";
// import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

// interface Props {
//   title: string;
//   icon: React.ReactNode;
//   ai: boolean;
//   dragHandleProps?: DraggableProvidedDragHandleProps | null;
//   isActive: boolean;
//   onToggle: () => void;
//   onDelete: () => void;
//   disableDelete?: boolean;
//   isComplete?: boolean;
//   isDragging?: boolean;
//   children?: React.ReactNode;
// }

// const SectionItem: React.FC<Props> = ({
//   title,
//   icon,
//   ai,
//   dragHandleProps,
//   isActive,
//   onToggle,
//   onDelete,
//   disableDelete,
//   isComplete,
//   isDragging,
//   children,
// }) => {
//   const [hovered, setHovered] = useState(false);

//   const handleHeaderClick = () => {
//     if (isDragging) return;
//     onToggle();
//   };

//   const showDelete =
//     !disableDelete && hovered && !isActive; // ✅ Show delete only when hovered & section inactive

//   return (
//     <div
//       className={`group relative transition-transform duration-200 ${
//         hovered ? "scale-[1.01]" : "scale-100"
//       }`}
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => setHovered(false)}
//     >
//       <div className="flex items-stretch gap-2">
//         <div className="flex-1 relative">
//           <div
//             className={`relative overflow-hidden rounded-2xl transition-all duration-300 shadow-sm ${
//               isActive ? "bg-white" : "bg-gray-50 border border-gray-200"
//             }`}
//           >
//             {/* Header */}
//             <div
//               className="flex items-center justify-between px-3 py-2 cursor-pointer relative"
//               onClick={handleHeaderClick}
//             >
//               <div className="flex items-center gap-3">
//                 {/* Icon bubble (drag handle applied here) */}
//                 <div
//                   {...(dragHandleProps || {})}
//                   className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
//                     isActive
//                       ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow"
//                       : "bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-orange-100 group-hover:to-red-100 text-gray-600 group-hover:text-orange-600"
//                   }`}
//                   aria-label={`${title} drag handle`}
//                 >
//                   {icon}
//                 </div>

//                 {/* Title + AI tag */}
//                 <div className="flex flex-col">
//                   <div className="flex items-center gap-2">
//                     <span
//                       className={`text-sm font-bold transition-colors duration-200 ${
//                         isActive ? "text-orange-600" : "text-gray-700"
//                       }`}
//                     >
//                       {title}
//                     </span>
//                     {ai && (
//                       <span className="inline-flex items-center px-2 py-0 text-[10px] font-medium bg-purple-200 text-purple-700 rounded-full">
//                         ✨ AI
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Chevron or Tick */}
//               <div>
//                 {isComplete ? (
//                   <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-500 text-white">
//                     <Check size={14} />
//                   </div>
//                 ) : (
//                   <div
//                     className={`transition-all duration-300 p-1 rounded-md ${
//                       isActive
//                         ? "text-orange-600 bg-orange-100"
//                         : "text-gray-400 group-hover:text-orange-600 group-hover:bg-orange-100"
//                     }`}
//                   >
//                     {isActive ? (
//                       <ChevronDown size={16} />
//                     ) : (
//                       <ChevronRight size={16} />
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Expanded content */}
//             {isActive && <div className="px-3 pb-3">{children}</div>}
//           </div>
//         </div>

//         {/* 🗑 Delete Button — Only on hover when inactive */}
//         {showDelete && (
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               onDelete();
//             }}
//             className="flex items-center text-gray-500 hover:text-red-600 transition-all duration-200"
//             title="Delete section"
//           >
//             <Trash2 size={16} />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SectionItem; before field section outside


// import React, { useState } from "react";
// import { ChevronDown, ChevronRight, Trash2, Check } from "lucide-react";
// import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

// interface Props {
//   title: string;
//   icon: React.ReactNode;
//   ai: boolean;
//   dragHandleProps?: DraggableProvidedDragHandleProps | null;
//   isActive: boolean;
//   onToggle: () => void;
//   onDelete: () => void;
//   disableDelete?: boolean;
//   isComplete?: boolean;
//   isDragging?: boolean;
//   children?: React.ReactNode;
// }

// const SectionItem: React.FC<Props> = ({
//   title,
//   icon,
//   ai,
//   dragHandleProps,
//   isActive,
//   onToggle,
//   onDelete,
//   disableDelete,
//   isComplete,
//   isDragging,
//   children,
// }) => {
//   const [hovered, setHovered] = useState(false);

//   const handleHeaderClick = () => {
//     if (isDragging) return;
//     onToggle();
//   };

//   const showDelete = !disableDelete && hovered && !isActive;

//   return (
//     <div
//       className={`group relative transition-transform duration-200 ${
//         hovered ? "scale-[1.01]" : "scale-100"
//       }`}
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => setHovered(false)}
//     >
//       <div className="flex items-stretch gap-2">
//         <div className="flex-1 relative">
//           <div
//             className={`relative overflow-hidden rounded-2xl transition-all duration-300 shadow-sm ${
//               isActive ? "bg-white" : "bg-gray-50 border border-gray-200"
//             }`}
//           >
//             {/* Header */}
//             <div
//               className="flex items-center justify-between px-3 py-2 cursor-pointer relative"
//               onClick={handleHeaderClick}
//             >
//               <div className="flex items-center gap-3">
//                 <div
//                   {...(dragHandleProps || {})}
//                   className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
//                     isActive
//                       ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow"
//                       : "bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-orange-100 group-hover:to-red-100 text-gray-600 group-hover:text-orange-600"
//                   }`}
//                   aria-label={`${title} drag handle`}
//                 >
//                   {icon}
//                 </div>

//                 <div className="flex flex-col">
//                   <div className="flex items-center gap-2">
//                     <span
//                       className={`text-sm font-bold transition-colors duration-200 ${
//                         isActive ? "text-orange-600" : "text-gray-700"
//                       }`}
//                     >
//                       {title}
//                     </span>
//                     {ai && (
//                       <span className="inline-flex items-center px-2 py-0 text-[10px] font-medium bg-purple-200 text-purple-700 rounded-full">
//                         ✨ AI
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 {isComplete ? (
//                   <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-500 text-white">
//                     <Check size={14} />
//                   </div>
//                 ) : (
//                   <div
//                     className={`transition-all duration-300 p-1 rounded-md ${
//                       isActive
//                         ? "text-orange-600 bg-orange-100"
//                         : "text-gray-400 group-hover:text-orange-600 group-hover:bg-orange-100"
//                     }`}
//                   >
//                     {isActive ? (
//                       <ChevronDown size={16} />
//                     ) : (
//                       <ChevronRight size={16} />
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Delete Button */}
//         {showDelete && (
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               onDelete();
//             }}
//             className="flex items-center text-gray-500 hover:text-red-600 transition-all duration-200"
//             title="Delete section"
//           >
//             <Trash2 size={16} />
//           </button>
//         )}
//       </div>

//       {/* ✅ When active → render children OUTSIDE the card */}
//       {isActive && (
//         <div className="mt-3 bg-white rounded-lg p-3 border border-orange-200">
//           {children}
//         </div>
//       )}
//     </div>
//   );
// };

// export default SectionItem; before space remove

// import React, { useState } from "react";
// import { ChevronDown, ChevronRight, Trash2, Check } from "lucide-react";
// import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

// interface Props {
//   title: string;
//   icon: React.ReactNode;
//   ai: boolean;
//   dragHandleProps?: DraggableProvidedDragHandleProps | null;
//   isActive: boolean;
//   onToggle: () => void;
//   onDelete: () => void;
//   disableDelete?: boolean;
//   isComplete?: boolean;
//   isDragging?: boolean;
//   children?: React.ReactNode;
// }

// const SectionItem: React.FC<Props> = ({
//   title,
//   icon,
//   ai,
//   dragHandleProps,
//   isActive,
//   onToggle,
//   onDelete,
//   disableDelete,
//   isComplete,
//   isDragging,
//   children,
// }) => {
//   const [hovered, setHovered] = useState(false);

//   const handleHeaderClick = () => {
//     if (isDragging) return;
//     onToggle();
//   };

//   const showDelete = !disableDelete && hovered && !isActive;

//   return (
//     <div
//       className={`group relative transition-transform duration-200 ${
//         hovered ? "scale-[1.01]" : "scale-100"
//       }`}
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => setHovered(false)}
//     >
//       <div className="flex items-stretch gap-2">
//         <div className="flex-1 relative">
//           <div
//             className={`relative overflow-hidden rounded-2xl transition-all duration-300 shadow-sm ${
//               isActive ? "bg-white" : "bg-gray-50 border border-gray-200"
//             }`}
//           >
//             {/* Header */}
//             <div
//               className="flex items-center justify-between px-3 py-2 cursor-pointer relative"
//               onClick={handleHeaderClick}
//             >
//               <div className="flex items-center gap-3">
//                 <div
//                   {...(dragHandleProps || {})}
//                   className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
//                     isActive
//                       ? "bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow"
//                       : "bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-blue-100 text-gray-600 group-hover:text-blue-500"
//                   }`}
//                   aria-label={`${title} drag handle`}
//                 >
//                   {icon}
//                 </div>

//                 <div className="flex flex-col">
//                   <div className="flex items-center gap-2">
//                     <span
//                       className={`text-[15px] font-semibold transition-colors duration-200 ${
//                         isActive ? "text-blue-500" : "text-gray-600"
//                       }`}
//                     >
//                       {title}
//                     </span>
//                     {ai && (
//                       <span className="inline-flex items-center px-2 py-0 text-[10px] font-medium bg-purple-200 text-purple-700 rounded-full">
//                         ✨ AI
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 {isComplete ? (
//                   <div className="w-4 h-4 flex items-center justify-center rounded-full bg-green-500 text-white">
//                     <Check size={14} />
//                   </div>
//                 ) : (
//                   <div
//                     className={`transition-all duration-300 p-1 rounded-md ${
//                       isActive
//                         ? "text-blue-500 bg-blue-100"
//                         : "text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-100"
//                     }`}
//                   >
//                     {isActive ? (
//                       <ChevronDown size={16} />
//                     ) : (
//                       <ChevronRight size={16} />
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Delete Button */}
//         {showDelete && (
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               onDelete();
//             }}
//             className="flex items-center text-gray-500 hover:text-red-600 transition-all duration-200"
//             title="Delete section"
//           >
//             <Trash2 size={16} />
//           </button>
//         )}
//       </div>

//       {/* ✅ When active → fields now start directly (no left gap) */}
//       {isActive && (
//         <div className="mt-3 bg-white rounded-lg border border-blue-200 p-3 pl-0">
//           {children}
//         </div>
//       )}
//     </div>
//   );
// };

// export default SectionItem;  before section form popup



// import React, { useState } from "react";
// import { ChevronDown, ChevronRight, Trash2, Check } from "lucide-react";
// import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

// interface Props {
//   title: string;
//   icon: React.ReactNode;
//   ai: boolean;
//   dragHandleProps?: DraggableProvidedDragHandleProps | null;
//   isActive: boolean;
//   onToggle: () => void;
//   onDelete: () => void;
//   disableDelete?: boolean;
//   isComplete?: boolean;
//   isDragging?: boolean;
// }

// const SectionItem: React.FC<Props> = ({
//   title,
//   icon,
//   ai,
//   dragHandleProps,
//   isActive,
//   onToggle,
//   onDelete,
//   disableDelete,
//   isComplete,
//   isDragging,
// }) => {
//   const [hovered, setHovered] = useState(false);

//   const handleHeaderClick = () => {
//     if (isDragging) return;
//     onToggle();
//   };

//   const showDelete = !disableDelete && hovered && !isActive;

//   return (
//     <div
//       className={`group relative transition-transform duration-200 ${
//         hovered ? "scale-[1.01]" : "scale-100"
//       }`}
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => setHovered(false)}
//     >
//       <div className="flex items-stretch gap-2">
//         <div className="flex-1 relative">
//           <div
//             className={`relative overflow-hidden rounded-2xl transition-all duration-300 shadow-sm ${
//               isActive ? "bg-white border border-blue-200" : "bg-gray-50 border border-gray-200"
//             }`}
//           >
//             {/* Header */}
//             <div
//               className="flex items-center justify-between px-3 py-2 cursor-pointer relative"
//               onClick={handleHeaderClick}
//             >
//               <div className="flex items-center gap-3">
//                 <div
//                   {...(dragHandleProps || {})}
//                   className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
//                     isActive
//                       ? "bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow"
//                       : "bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-blue-100 text-gray-600 group-hover:text-blue-500"
//                   }`}
//                 >
//                   {icon}
//                 </div>

//                 <span
//                   className={`text-[15px] font-semibold transition-colors duration-200 ${
//                     isActive ? "text-blue-500" : "text-gray-600"
//                   }`}
//                 >
//                   {title}
//                 </span>

//                 {ai && (
//                   <span className="inline-flex items-center px-2 py-0 text-[10px] font-medium bg-purple-200 text-purple-700 rounded-full">
//                     ✨ AI
//                   </span>
//                 )}
//               </div>

//               <div>
//                 {isComplete ? (
//                   <div className="w-4 h-4 flex items-center justify-center rounded-full bg-green-500 text-white">
//                     <Check size={14} />
//                   </div>
//                 ) : (
//                   <div
//                     className={`transition-all duration-300 p-1 rounded-md ${
//                       isActive
//                         ? "text-blue-500 bg-blue-100"
//                         : "text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-100"
//                     }`}
//                   >
//                     {isActive ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Delete Button */}
//         {showDelete && (
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               onDelete();
//             }}
//             className="flex items-center text-gray-500 hover:text-red-600 transition-all duration-200"
//             title="Delete section"
//           >
//             <Trash2 size={16} />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SectionItem;



// import React, { useState } from "react";
// import Image from "next/image";
// import { ChevronDown, ChevronRight, Trash2, Check } from "lucide-react";
// import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

// interface Props {
//   title: string;
//   icon: React.ReactNode;
//   ai: boolean;
//   dragHandleProps?: DraggableProvidedDragHandleProps | null;
//   isActive: boolean;
//   onToggle: () => void;
//   onDelete: () => void;
//   disableDelete?: boolean;
//   isComplete?: boolean;
//   isDragging?: boolean;
// }

// const SectionItem: React.FC<Props> = ({
//   title,
//   icon,
//   ai,
//   dragHandleProps,
//   isActive,
//   onToggle,
//   onDelete,
//   disableDelete,
//   isComplete,
//   isDragging,
// }) => {
//   const [hovered, setHovered] = useState(false);

//   const handleHeaderClick = () => {
//     if (isDragging) return;
//     onToggle();
//   };

//   const showDelete = !disableDelete && hovered && !isActive;

//   return (
//     <div
//       className={`group relative transition-transform duration-200 ${
//         hovered ? "scale-[1.01]" : "scale-100"
//       }`}
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => setHovered(false)}
//     >
//       <div className="flex items-stretch gap-2">
//         <div className="flex-1 relative">
//           <div
//             className={`relative overflow-hidden rounded-2xl transition-all duration-300 shadow-sm ${
//               isActive
//                 ? "bg-white border border-blue-200"
//                 : "bg-gray-50 border border-gray-200"
//             }`}
//           >
//             {/* Header */}
//             <div
//               className="flex items-center justify-between px-3 py-2 cursor-pointer relative"
//               onClick={handleHeaderClick}
//             >
//               {/* Left Section: Icon + Title */}
//               <div className="flex items-center gap-3">
//                 <div
//                   {...(dragHandleProps || {})}
//                   className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
//                     isActive
//                       ? "bg-[#2557a7] text-white shadow"
//                       : "bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-blue-100 text-[#2d2d2d] group-hover:text-[#2557a7]"
//                   }`}
//                 >
//                   {icon}
//                 </div>

//                 <span
//                   className={`text-[15px] font-semibold transition-colors duration-200 ${
//                     isActive ? "text-[#2557a7]" : "text-gray-800"
//                   }`}
//                 >
//                   {title}
//                 </span>
//               </div>

//               {/* Right Section: AI Icon + Chevron / Check */}
//               <div className="flex items-center gap-2">
//                 {ai && (
//                   <span className="inline-flex items-center rounded-full">
//                     <Image
//                       src="/assets/icons/AI_icon.svg"
//                       alt="AI"
//                       width={16}
//                       height={16}
//                       className="w-6 h-6"
//                     />
//                   </span>
//                 )}

//                 {isComplete ? (
//                   <div className="w-4 h-4 flex items-center justify-center rounded-full bg-green-500 text-white">
//                     <Check size={14} />
//                   </div>
//                 ) : (
//                   <div
//                     className={`transition-all duration-300 p-1 rounded-md ${
//                       isActive
//                         ? "text-[#2557a7] bg-blue-100"
//                         : "text-gray-400 group-hover:text-[#2557a7] group-hover:bg-blue-100"
//                     }`}
//                   >
//                     {isActive ? (
//                       <ChevronDown size={16} />
//                     ) : (
//                       <ChevronRight size={16} />
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Delete Button */}
//         {showDelete && (
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               onDelete();
//             }}
//             className="flex items-center text-gray-500 hover:text-red-600 transition-all duration-200"
//             title="Delete section"
//           >
//             <Trash2 size={16} />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SectionItem; before check change



// import React, { useState } from "react";
// import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
// import { FaCheckCircle } from 'react-icons/fa';
// import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

// interface Props {
//   title: string;
//   icon: React.ReactNode;
//   ai: boolean;
//   dragHandleProps?: DraggableProvidedDragHandleProps | null;
//   isActive: boolean;
//   onToggle: () => void;
//   onDelete: () => void;
//   disableDelete?: boolean;
//   isComplete?: boolean;
//   isDragging?: boolean;
// }

// const SectionItem: React.FC<Props> = ({
//   title,
//   icon,
//   ai,
//   dragHandleProps,
//   isActive,
//   onToggle,
//   onDelete,
//   disableDelete,
//   isComplete,
//   isDragging,
// }) => {
//   const [hovered, setHovered] = useState(false);

//   const handleHeaderClick = () => {
//     if (isDragging) return;
//     onToggle();
//   };

//   const showDelete = !disableDelete && hovered && !isActive;

//   return (
//     <div
//       className={`group relative transition-transform duration-200 ${
//         hovered ? "scale-[1.01]" : "scale-100"
//       }`}
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => setHovered(false)}
//     >
//       <div className="flex items-stretch gap-2">
//         <div className="flex-1 relative">
//           <div
//             className={`relative overflow-hidden rounded-2xl transition-all duration-300 shadow-sm ${
//               isActive
//                 ? "bg-white border border-blue-200"
//                 : "bg-gray-50 border border-gray-200"
//             }`}
//           >
//             {/* Header */}
//             <div
//               className="flex items-center justify-between px-3 py-2 cursor-pointer relative"
//               onClick={handleHeaderClick}
//             >
//               {/* Left Section: Icon + Title */}
//               <div className="flex items-center gap-3">
//                 <div
//                   {...(dragHandleProps || {})}
//                   className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
//                     isActive
//                       ? "bg-[#2557a7] text-white shadow"
//                       : "bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-blue-100 text-[#2d2d2d] group-hover:text-[#2557a7]"
//                   }`}
//                 >
//                   {icon}
//                 </div>

//                 <span
//                   className={`text-[15px] font-semibold transition-colors duration-200 ${
//                     isActive ? "text-[#2557a7]" : "text-gray-800"
//                   }`}
//                 >
//                   {title}
//                 </span>
//               </div>

//               {/* Right Section: AI Icon + Check + Chevron */}
//               <div className="flex items-center gap-2">
//                 {ai && (
//                   <span className="inline-flex items-center px-2 py-0 text-xs font-semibold bg-purple-200 text-black rounded-full">
//                     ✨ AI
//                   </span>
//                 )}

//                 {isComplete && (
//                   <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#d9f7be] text-white">
//                     <FaCheckCircle size={14}  className="text-green-600 rounded-full" />
//                   </div>
//                 )}

//                 <div
//                   className={`transition-all duration-300 p-1 rounded-md ${
//                     isActive
//                       ? "text-[#2557a7] bg-blue-100"
//                       : "text-gray-400 group-hover:text-[#2557a7] group-hover:bg-blue-100"
//                   }`}
//                 >
//                   {isActive ? (
//                     <ChevronDown size={16} />
//                   ) : (
//                     <ChevronRight size={16} />
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Delete Button */}
//         {showDelete && (
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               onDelete();
//             }}
//             className="w-6 h-6 flex justify-center mt-4 items-center bg-gray-300 hover:text-red-600 transition-all duration-200"
//             title="Delete section"
//           >
//             <Trash2 className="text-gray-700" size={16} />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SectionItem; before delete label




import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { FaCheckCircle } from 'react-icons/fa';
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { RiSparkling2Fill } from 'react-icons/ri';


interface Props {
  title: string;
  icon: React.ReactNode;
  ai: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isActive: boolean;
  onToggle: () => void;
  onDelete: () => void;
  disableDelete?: boolean;
  isComplete?: boolean;
  isDragging?: boolean;
}


const SectionItem: React.FC<Props> = ({
  title,
  icon,
  ai,
  dragHandleProps,
  isActive,
  onToggle,
  onDelete,
  disableDelete,
  isComplete,
  isDragging,
}) => {
  const [hovered, setHovered] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const deleteButtonRef = useRef<HTMLButtonElement>(null);


  const handleHeaderClick = () => {
    if (isDragging) return;
    onToggle();
  };


  const showDelete = !disableDelete && hovered && !isActive;


  // Update tooltip position when hovering
  useEffect(() => {
    if (deleteHovered && deleteButtonRef.current) {
      const rect = deleteButtonRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 5, // Position above the button
        left: rect.left + rect.width / 2, // Center horizontally
      });
    }
  }, [deleteHovered]);


  return (
    <div
      className={`group relative transition-transform duration-200 ${
        hovered ? "scale-[1.01]" : "scale-100"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-stretch gap-2">
        <div className="flex-1 relative">
          <div
            className={`relative py-1.5 overflow-hidden rounded-lg transition-all duration-300 shadow-sm ${
              isActive
                ? "bg-[#ffffff] border border-blue-200"
                : "bg-[#ffffff] border border-gray-300"
            }`}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-2  cursor-pointer relative"
              onClick={handleHeaderClick}
            >
              {/* Left Section: Icon + Title */}
              <div className="flex items-center gap-3">
                <div
                  {...(dragHandleProps || {})}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "bg-[#2557a7] text-white shadow"
                      : "bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-blue-100 text-[#2d2d2d] group-hover:text-[#2557a7]"
                  }`}
                >
                  {icon}
                </div>


                <span
                  className={`text-[15px] font-semibold transition-colors duration-200 ${
                    isActive ? "text-[#2557a7]" : "text-gray-800"
                  }`}
                >
                  {title}
                </span>
              </div>


              {/* Right Section: AI Icon + Check + Chevron */}
              <div className="flex items-center gap-2">
                {ai && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs bg-[#efedf2] font-semibold text-black rounded-full">
                    <RiSparkling2Fill size={14} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI  
                    {/* <Image
                              src="/assets/icons/AI_icon.svg"
                              alt="Profile"
                              width={26}
                              height={26} /> */}

                    
                  </span>
                )}


                {isComplete && (
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#d9f7be] text-white">
                    <FaCheckCircle size={14} className="text-green-600 rounded-full" />
                  </div>
                )}


                <div
                  className={`transition-all duration-300 p-1 rounded-md ${
                    isActive
                      ? "text-[#2557a7] bg-blue-100"
                      : "text-gray-400 group-hover:text-[#2557a7] group-hover:bg-blue-100"
                  }`}
                >
                  {isActive ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Delete Button */}
        {showDelete && (
          <div className="mt-4">
            <button
              ref={deleteButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              onMouseEnter={() => setDeleteHovered(true)}
              onMouseLeave={() => setDeleteHovered(false)}
              className="w-6 h-6 flex justify-center items-center bg-gray-300 hover:bg-red-100 transition-all duration-200 rounded"
              aria-label="Delete section"
            >
              <Trash2 className="text-gray-700 hover:text-[#c45d65]" size={16} />
            </button>
          </div>
        )}
      </div>


      {/* Tooltip - Rendered via Portal outside sidebar */}
      {deleteHovered && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded whitespace-nowrap shadow-xl pointer-events-none"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
        >
          Delete
        </div>,
        document.body
      )}
    </div>
  );
};


export default SectionItem;


