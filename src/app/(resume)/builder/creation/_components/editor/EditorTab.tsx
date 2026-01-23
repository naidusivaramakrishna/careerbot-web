// "use client";
// import React from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   setActiveSection,
//   handleDragEnd,
// }) => {
//   const nonDeletableSections = [ "Personal Info", "Professional Summary", "Skills", "Education", ];
//   const { setSectionOrder } = useResume();
//   // ✅ Update section order after drag
//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };
//   // ✅ Conditional rendering: show only active section if any is open
//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   return (
//     <>
//       <h3 className="text-lg font-semibold text-orange-600 mb-2">
//         Resume Sections
//       </h3>
//       <p className="text-xs text-gray-500 mb-4">
//         Complete each section to build a perfect resume
//       </p>
//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-3 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 // If activeSection is set, use its original index for correct mapping
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const Component = sectionComponents[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={activeSection === originalIndex}
//                           onToggle={() =>
//                             setActiveSection(
//                               activeSection === originalIndex
//                                 ? null
//                                 : originalIndex
//                             )
//                           }
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                         >
//                           {activeSection === originalIndex && Component && (
//                             <div className="bg-white rounded-lg p-3 border border-orange-200">
//                               <Component
//                                 formData={formData}
//                                 errors={errors}
//                                 onChange={handleChange}
//                                 onBlur={handleBlur}
//                               />
//                             </div>
//                           )}
//                         </SectionItem>
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>
//       {/* ✅ Add New Section */}
//       <AddNewSection />
//       {/* ✅ Extra Sections */}
//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-orange-100 group-hover:to-red-100 group-hover:text-orange-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <div className="text-left">
//                     <div className="flex items-center gap-2">
//                       <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                         {s.name}
//                       </p>
//                       {s.ai && (
//                         <span className="inline-flex items-center px-2 py-0 text-[10px] font-medium bg-purple-200 text-purple-700 rounded-full shadow-sm">
//                           ✨ AI
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//                 <div
//                   className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                             bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                             group-hover:from-orange-500 group-hover:to-red-500 
//                             group-hover:text-white group-hover:scale-110"
//                 >
//                   <Plus size={14} />
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}
//     </>
//   );
// };
// export default EditorTab; before 1


// "use client";
// import React from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   setActiveSection,
//   handleDragEnd,
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { setSectionOrder } = useResume();

//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   return (
//     <>
//       <h3 className="text-lg font-semibold text-orange-600 mb-2">
//         Resume Sections
//       </h3>
//       <p className="text-xs text-gray-500 mb-4">
//         Complete each section to build a perfect resume
//       </p>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-3 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const Component = sectionComponents[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={activeSection === originalIndex}
//                           onToggle={() =>
//                             setActiveSection(
//                               activeSection === originalIndex
//                                 ? null
//                                 : originalIndex
//                             )
//                           }
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                         >
//                           {activeSection === originalIndex && Component && (
//                             <Component
//                               formData={formData}
//                               errors={errors}
//                               onChange={handleChange}
//                               onBlur={handleBlur}
//                             />
//                           )}
//                         </SectionItem>
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       {/* Add New Section */}
//       <AddNewSection />

//       {/* Extra Sections */}
//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-orange-100 group-hover:to-red-100 group-hover:text-orange-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <div className="text-left">
//                     <div className="flex items-center gap-2">
//                       <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                         {s.name}
//                       </p>
//                       {s.ai && (
//                         <span className="inline-flex items-center px-2 py-0 text-[10px] font-medium bg-purple-200 text-purple-700 rounded-full shadow-sm">
//                           ✨ AI
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//                 <div
//                   className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                             bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                             group-hover:from-orange-500 group-hover:to-red-500 
//                             group-hover:text-white group-hover:scale-110"
//                 >
//                   <Plus size={14} />
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab; before space rem


// "use client";
// import React from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   setActiveSection,
//   handleDragEnd,
//   completionStatus = {},
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { setSectionOrder } = useResume();

//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   return (
//     <>
//       <h3 className="text-lg font-semibold text-blue-500 mb-2">
//         Resume Sections
//       </h3>
//       <p className="text-xs text-gray-500 mb-4">
//         Complete each section to build a perfect resume
//       </p>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-3 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const Component = sectionComponents[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={activeSection === originalIndex}
//                           onToggle={() =>
//                             setActiveSection(
//                               activeSection === originalIndex
//                                 ? null
//                                 : originalIndex
//                             )
//                           }
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                           isComplete={completionStatus[s.name] || false}
//                         >
//                           {activeSection === originalIndex && Component && (
//                             <div className="space-y-3 p-0"> {/* 👈 Removed side padding */}
//                               <Component
//                                 formData={formData}
//                                 errors={errors}
//                                 onChange={handleChange}
//                                 onBlur={handleBlur}
//                               />
//                             </div>
//                           )}
//                         </SectionItem>
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       {/* Add New Section */}
//       <AddNewSection />

//       {/* Extra Sections */}
//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <div className="text-left">
//                     <div className="flex items-center gap-2">
//                       <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                         {s.name}
//                       </p>
//                       {s.ai && (
//                         <span className="inline-flex items-center px-2 py-0 text-[10px] font-medium bg-purple-200 text-purple-700 rounded-full shadow-sm">
//                           ✨ AI
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//                 <div
//                   className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                             bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                             group-hover:from-blue-500 group-hover:to-blue-700 
//                             group-hover:text-white group-hover:scale-110"
//                 >
//                   <Plus size={14} />
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab; before section form popup




// "use client";
// import React, { useState } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus, X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   setActiveSection,
//   handleDragEnd,
//   completionStatus = {},
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { setSectionOrder } = useResume();
//   const [openModalSection, setOpenModalSection] = useState<string | null>(null);

//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   const closeModal = () => setOpenModalSection(null);

//   return (
//     <>
//       <h3 className="text-lg font-semibold text-blue-500 mb-2">
//         Resume Sections
//       </h3>
//       <p className="text-xs text-gray-500 mb-4">
//         Complete each section to build a perfect resume
//       </p>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-3 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={openModalSection === s.name}
//                           onToggle={() =>
//                             setOpenModalSection(
//                               openModalSection === s.name ? null : s.name
//                             )
//                           }
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                           isComplete={completionStatus[s.name] || false}
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       {/* Add New Section */}
//       <AddNewSection />

//       {/* Extra Sections */}
//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <div className="text-left">
//                     <div className="flex items-center gap-2">
//                       <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                         {s.name}
//                       </p>
//                       {s.ai && (
//                         <span className="inline-flex items-center px-2 py-0 text-[10px] font-medium bg-purple-200 text-purple-700 rounded-full shadow-sm">
//                           ✨ AI
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//                 <div
//                   className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                             bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                             group-hover:from-blue-500 group-hover:to-blue-700 
//                             group-hover:text-white group-hover:scale-110"
//                 >
//                   <Plus size={14} />
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {/* ✅ Popup Modal */}
//       {openModalSection && (
//         <div className="fixed inset-0 bg-black/50  bg-opacity-0 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-[850px] h-[80vh] overflow-y-auto relative">
//             <button
//               onClick={closeModal}
//               className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
//             >
//               <X size={20} />
//             </button>

//             <h2 className="text-lg font-semibold items-center text-blue-500 mb-4">
//               {openModalSection}
//             </h2>

//             {(() => {
//               const Component = sectionComponents[openModalSection];
//               if (!Component) return null;
//               return (
//                 <Component
//                   formData={formData}
//                   errors={errors}
//                   onChange={handleChange}
//                   onBlur={handleBlur}
//                 />
//               );
//             })()}
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab; before save n clear







// "use client";
// import React, { useState } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus, X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   setActiveSection,
//   handleDragEnd,
//   completionStatus = {},
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { setSectionOrder } = useResume();
//   const [openModalSection, setOpenModalSection] = useState<string | null>(null);

//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   const closeModal = () => setOpenModalSection(null);

//   // ✅ Clear form fields for the current section
//   const handleClearForm = () => {
//     Object.keys(formData).forEach((key) => {
//       handleChange(key, "");
//     });
//   };

//   // ✅ Save handler
//   const handleSaveForm = () => {
//     // You can integrate actual saving logic here if needed (e.g., API or context)
//     closeModal();
//   };

//   return (
//     <>
//       <h3 className="text-lg font-semibold text-blue-500 mb-2">
//         Resume Sections
//       </h3>
//       <p className="text-xs text-gray-500 mb-4">
//         Complete each section to build a perfect resume
//       </p>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-3 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={openModalSection === s.name}
//                           onToggle={() =>
//                             setOpenModalSection(
//                               openModalSection === s.name ? null : s.name
//                             )
//                           }
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                           isComplete={completionStatus[s.name] || false}
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       {/* Add New Section */}
//       <AddNewSection />

//       {/* Extra Sections */}
//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <div className="text-left">
//                     <div className="flex items-center gap-2">
//                       <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                         {s.name}
//                       </p>
//                       {s.ai && (
//                         <span className="inline-flex items-center px-2 py-0 text-[10px] font-medium bg-purple-200 text-purple-700 rounded-full shadow-sm">
//                           ✨ AI
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//                 <div
//                   className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                             bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                             group-hover:from-blue-500 group-hover:to-blue-700 
//                             group-hover:text-white group-hover:scale-110"
//                 >
//                   <Plus size={14} />
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {/* ✅ Popup Modal */}
//       {openModalSection && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-[850px] h-[80vh] overflow-y-auto relative flex flex-col">
//             {/* Close button */}
//             <button
//               onClick={closeModal}
//               className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
//             >
//               <X size={20} />
//             </button>

//             {/* ✅ Section Title Centered */}
//             <h2 className="text-lg font-semibold text-blue-500 mb-4 text-center border-b pb-3">
//               {openModalSection}
//             </h2>

//             {/* ✅ Form Content */}
//             <div className="flex-1 overflow-y-auto px-1">
//               {(() => {
//                 const Component = sectionComponents[openModalSection];
//                 if (!Component) return null;
//                 return (
//                   <Component
//                     formData={formData}
//                     errors={errors}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                   />
//                 );
//               })()}
//             </div>

//             {/* ✅ Divider Line */}
//             <div className="border-t mt-4 pt-4 flex justify-end gap-3">
//               {/* Clear Button */}
//               <button
//                 onClick={handleClearForm}
//                 className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
//               >
//                 Clear
//               </button>

//               {/* Save Button */}
//               <button
//                 onClick={handleSaveForm}
//                 className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab;


// "use client";
// import React, { useState } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus, X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   setActiveSection,
//   handleDragEnd,
//   completionStatus = {},
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { setSectionOrder } = useResume();
//   const [openModalSection, setOpenModalSection] = useState<string | null>(null);

//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   const closeModal = () => setOpenModalSection(null);

//   // ✅ Clear only fields belonging to the open section
//   const handleClearForm = () => {
//     if (!openModalSection) return;

//     Object.keys(formData).forEach((key) => {
//       // Only clear keys that belong to the current section
//       if (key.toLowerCase().includes(openModalSection.toLowerCase())) {
//         handleChange(key, "");
//       }
//     });
//   };

//   // ✅ Save handler
//   const handleSaveForm = () => {
//     // Add your saving logic here if needed
//     closeModal();
//   };

//   return (
//     <>
//       <h3 className="text-lg font-semibold text-blue-500 mb-2">
//         Resume Sections
//       </h3>
//       <p className="text-xs text-gray-500 mb-4">
//         Complete each section to build a perfect resume
//       </p>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-3 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={openModalSection === s.name}
//                           onToggle={() =>
//                             setOpenModalSection(
//                               openModalSection === s.name ? null : s.name
//                             )
//                           }
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                           isComplete={completionStatus[s.name] || false}
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       {/* Add New Section */}
//       <AddNewSection />

//       {/* Extra Sections */}
//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <div className="text-left">
//                     <div className="flex items-center gap-2">
//                       <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                         {s.name}
//                       </p>
//                       {s.ai && (
//                         <span className="inline-flex items-center px-2 py-0 text-[10px] font-medium bg-purple-200 text-purple-700 rounded-full shadow-sm">
//                           ✨ AI
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//                 <div
//                   className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                             bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                             group-hover:from-blue-500 group-hover:to-blue-700 
//                             group-hover:text-white group-hover:scale-110"
//                 >
//                   <Plus size={14} />
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {/* ✅ Popup Modal */}
//       {openModalSection && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-[850px] h-[80vh] overflow-y-auto relative flex flex-col">
//             {/* Close button */}
//             <button
//               onClick={closeModal}
//               className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
//             >
//               <X size={20} />
//             </button>

//             {/* ✅ Section Title Centered with Normal Gray Line */}
//             <h2 className="text-lg font-semibold text-blue-500 mb-4 text-center border-b border-gray-200 pb-3">
//               {openModalSection}
//             </h2>

//             {/* ✅ Form Content */}
//             <div className="flex-1 overflow-y-auto px-1">
//               {(() => {
//                 const Component = sectionComponents[openModalSection];
//                 if (!Component) return null;
//                 return (
//                   <Component
//                     formData={formData}
//                     errors={errors}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                   />
//                 );
//               })()}
//             </div>

//             {/* ✅ Divider Line and Buttons */}
//             <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end gap-3">
//               {/* Clear Button */}
//               <button
//                 onClick={handleClearForm}
//                 className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
//               >
//                 Clear
//               </button>

//               {/* Save Button */}
//               <button
//                 onClick={handleSaveForm}
//                 className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab; 1 err



// "use client";
// import React, { useState } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus, X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";
// import { ResumeData } from "../../_context/ResumeContext";
// import Image from "next/image";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   handleDragEnd,
//   completionStatus = {},
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { setSectionOrder, setResumeData } = useResume();
//   const [openModalSection, setOpenModalSection] = useState<string | null>(null);

//   // Map section names to their corresponding resume data keys
//   const sectionToDataKeyMap: Record<string, string[]> = {
//     "Personal Info": ["personalInfo"],
//     "Professional Summary": ["professionalSummary"],
//     "Skills": ["skills"],
//     "Education": ["education"],
//     "Work Experience": ["workExperience"],
//     "Projects": ["projects"],
//     "Certifications": ["certifications"],
//     "Achievements": ["achievements"],
//     "Volunteering": ["volunteering"],
//     "Internships": ["internships"],
//     "Awards": ["awards"],
//     "References": ["references"],
//   };

//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   const closeModal = () => {
//     setOpenModalSection(null);
//   };

//   // ✅ Clear only fields belonging to the open section using resume context
//   const handleClearForm = () => {
//     if (!openModalSection) return;

//     const dataKeys = sectionToDataKeyMap[openModalSection];
//     if (!dataKeys) return;

//     setResumeData((prevData) => {
//       const newData = { ...prevData };
      
//       dataKeys.forEach((key) => {
//         if (key === "personalInfo") {
//           newData.personalInfo = {
//             name: "",
//             email: "",
//             phone: "",
//             location: "",
//             linkedinurl: "",
//           };
//         } else if (key === "professionalSummary") {
//           newData.professionalSummary = "";
//         } else if (key === "skills") {
//           newData.skills = [];
//         } else if (Array.isArray(newData[key as keyof ResumeData])) {
//           // Clear array fields (education, workExperience, projects, etc.)
//           const typedKey = key as keyof ResumeData;
//           (newData[typedKey] as unknown[]) = [];
//         }
//       });

//       return newData;
//     });

//     // Also clear formData for immediate UI update
//     Object.keys(formData).forEach((key) => {
//       const lowerKey = key.toLowerCase();
//       const lowerSection = openModalSection.toLowerCase().replace(/\s+/g, "");
      
//       // Match formData keys to the current section
//       if (
//         lowerKey.includes(lowerSection) ||
//         (openModalSection === "Personal Info" && 
//          (lowerKey.includes("name") || lowerKey.includes("email") || 
//           lowerKey.includes("phone") || lowerKey.includes("location") || 
//           lowerKey.includes("linkedin"))) ||
//         (openModalSection === "Professional Summary" && 
//          lowerKey.includes("summary")) ||
//         (openModalSection === "Skills" && lowerKey.includes("skill")) ||
//         (openModalSection === "Education" && lowerKey.includes("education")) ||
//         (openModalSection === "Work Experience" && 
//          (lowerKey.includes("workexperience") || lowerKey.includes("company") || 
//           lowerKey.includes("role") && !lowerKey.includes("internship"))) ||
//         (openModalSection === "Projects" && lowerKey.includes("project")) ||
//         (openModalSection === "Certifications" && lowerKey.includes("certification")) ||
//         (openModalSection === "Achievements" && lowerKey.includes("achievement")) ||
//         (openModalSection === "Volunteering" && lowerKey.includes("volunteering")) ||
//         (openModalSection === "Internships" && lowerKey.includes("internship")) ||
//         (openModalSection === "Awards" && lowerKey.includes("award")) ||
//         (openModalSection === "References" && lowerKey.includes("reference"))
//       ) {
//         handleChange(key, "");
//       }
//     });
//   };

//   // ✅ Get fields that belong to current section
//   const getSectionFields = (sectionName: string): string[] => {
//     const fields: string[] = [];
    
//     Object.keys(formData).forEach((key) => {
//       const lowerKey = key.toLowerCase();
//       const lowerSection = sectionName.toLowerCase().replace(/\s+/g, "");
      
//       // Check if this field belongs to the current section
//       if (
//         lowerKey.includes(lowerSection) ||
//         (sectionName === "Personal Info" && 
//          (lowerKey.includes("name") || lowerKey.includes("email") || 
//           lowerKey.includes("phone") || lowerKey.includes("location") || 
//           lowerKey.includes("linkedin"))) ||
//         (sectionName === "Professional Summary" && 
//          lowerKey.includes("summary")) ||
//         (sectionName === "Skills" && lowerKey.includes("skill")) ||
//         (sectionName === "Education" && lowerKey.includes("education")) ||
//         (sectionName === "Work Experience" && 
//          (lowerKey.includes("workexperience") || lowerKey.includes("company") || 
//           (lowerKey.includes("role") && !lowerKey.includes("internship")))) ||
//         (sectionName === "Projects" && lowerKey.includes("project")) ||
//         (sectionName === "Certifications" && lowerKey.includes("certification")) ||
//         (sectionName === "Achievements" && lowerKey.includes("achievement")) ||
//         (sectionName === "Volunteering" && lowerKey.includes("volunteering")) ||
//         (sectionName === "Internships" && lowerKey.includes("internship")) ||
//         (sectionName === "Awards" && lowerKey.includes("award")) ||
//         (sectionName === "References" && lowerKey.includes("reference"))
//       ) {
//         fields.push(key);
//       }
//     });
    
//     return fields;
//   };

//   // ✅ Check if field is required (not optional)
//   const isRequiredField = (key: string): boolean => {
//     const lowerKey = key.toLowerCase();
    
//     // Optional fields that should not be validated
//     const optionalFields = [
//       "linkedin",
//       "currentlyworking",
//       "link",
//       "technologies",
//       "description" // descriptions are often optional
//     ];
    
//     // Check if field contains any optional field name
//     return !optionalFields.some(optional => lowerKey.includes(optional));
//   };

//   // ✅ Validate current section and show errors
//   const validateAndShowErrors = (): boolean => {
//     if (!openModalSection) return true;

//     const sectionFields = getSectionFields(openModalSection);
//     let hasEmptyRequiredFields = false;

//     // Check each field in the section
//     sectionFields.forEach((key) => {
//       const value = formData[key] || "";
      
//       // Only validate required fields
//       if (isRequiredField(key)) {
//         // If field is empty or just whitespace, trigger validation
//         if (!value || value.trim() === "") {
//           handleBlur(key, value);
//           hasEmptyRequiredFields = true;
//         }
//       }
//     });

//     // Return false if there are empty required fields
//     return !hasEmptyRequiredFields;
//   };

//   // ✅ Save handler with validation
//   const handleSaveForm = () => {
//     if (!openModalSection) return;

//     // First check if there are any existing errors
//     const sectionFields = getSectionFields(openModalSection);
//     const hasExistingErrors = sectionFields.some(key => errors[key]);

//     if (hasExistingErrors) {
//       // Don't close if there are existing errors
//       return;
//     }

//     // Validate all required fields and show error messages
//     const isValid = validateAndShowErrors();
    
//     if (!isValid) {
//       // Stay on the form if validation failed
//       return;
//     }

//     // If validation passes, close the modal
//     closeModal();
//   };

//   return (
//     <>
//       <h3 className="text-lg font-semibold text-blue-500 mb-2">
//         Resume Sections
//       </h3>
//       <p className="text-xs text-gray-500 mb-4">
//         Complete each section to build a perfect resume
//       </p>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-3 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={openModalSection === s.name}
//                           onToggle={() =>
//                             setOpenModalSection(
//                               openModalSection === s.name ? null : s.name
//                             )
//                           }
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                           isComplete={completionStatus[s.name] || false}
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       {/* Add New Section */}
//       <AddNewSection />

//       {/* Extra Sections */}
//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <div className="text-left">
//                     <div className="flex items-center gap-2">
//                       <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                         {s.name}
//                       </p>
//                       {s.ai && (
//                         <span className="inline-flex items-center rounded-full">
//                                             <Image
//                                               src="/assets/icons/AI_icon.svg"
//                                               alt="AI"
//                                               width={16}
//                                               height={16}
//                                               className="w-6 h-6"
//                                             />
//                                           </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//                 <div
//                   className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                             bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                             group-hover:from-blue-500 group-hover:to-blue-700 
//                             group-hover:text-white group-hover:scale-110"
//                 >
//                   <Plus size={14} />
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {/* ✅ Popup Modal */}
//       {openModalSection && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-[930px] h-[88vh] overflow-y-auto relative flex flex-col">
//             {/* Close button */}
//             <button
//               onClick={closeModal}
//               className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
//             >
//               <X size={20} />
//             </button>

//             {/* ✅ Section Title Centered with Normal Gray Line */}
//             <h2 className="text-lg font-semibold text-blue-500 mb-4 text-center border-b border-gray-200 pb-3">
//               {openModalSection}
//             </h2>

//             {/* ✅ Form Content */}
//             <div className="flex-1 overflow-y-auto px-1">
//               {(() => {
//                 const Component = sectionComponents[openModalSection];
//                 if (!Component) return null;
//                 return (
//                   <Component
//                     formData={formData}
//                     errors={errors}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                   />
//                 );
//               })()}
//             </div>

//             {/* ✅ Divider Line and Buttons */}
//             <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end gap-3">
//               {/* Clear Button */}
//               <button
//                 onClick={handleClearForm}
//                 className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
//               >
//                 Clear
//               </button>

//               {/* Save Button */}
//               <button
//                 onClick={handleSaveForm}
//                 className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab; before ai bade change and removed clear n added cancel again



// "use client";
// import React, { useState } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus, X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";

// import Image from "next/image";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   handleDragEnd,
//   completionStatus = {},
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { setSectionOrder } = useResume();
//   const [openModalSection, setOpenModalSection] = useState<string | null>(null);


//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   const closeModal = () => {
//     setOpenModalSection(null);
//   };

//   const getSectionFields = (sectionName: string): string[] => {
//     const fields: string[] = [];

//     Object.keys(formData).forEach((key) => {
//       const lowerKey = key.toLowerCase();
//       const lowerSection = sectionName.toLowerCase().replace(/\s+/g, "");

//       if (
//         lowerKey.includes(lowerSection) ||
//         (sectionName === "Personal Info" &&
//           (lowerKey.includes("name") ||
//             lowerKey.includes("email") ||
//             lowerKey.includes("phone") ||
//             lowerKey.includes("location") ||
//             lowerKey.includes("linkedin"))) ||
//         (sectionName === "Professional Summary" &&
//           lowerKey.includes("summary")) ||
//         (sectionName === "Skills" && lowerKey.includes("skill")) ||
//         (sectionName === "Education" && lowerKey.includes("education")) ||
//         (sectionName === "Work Experience" &&
//           (lowerKey.includes("workexperience") ||
//             lowerKey.includes("company") ||
//             (lowerKey.includes("role") && !lowerKey.includes("internship")))) ||
//         (sectionName === "Projects" && lowerKey.includes("project")) ||
//         (sectionName === "Certifications" &&
//           lowerKey.includes("certification")) ||
//         (sectionName === "Achievements" &&
//           lowerKey.includes("achievement")) ||
//         (sectionName === "Volunteering" &&
//           lowerKey.includes("volunteering")) ||
//         (sectionName === "Internships" &&
//           lowerKey.includes("internship")) ||
//         (sectionName === "Awards" && lowerKey.includes("award")) ||
//         (sectionName === "References" &&
//           lowerKey.includes("reference"))
//       ) {
//         fields.push(key);
//       }
//     });

//     return fields;
//   };

//   const isRequiredField = (key: string): boolean => {
//     const lowerKey = key.toLowerCase();
//     const optionalFields = [
//       "linkedin",
//       "currentlyworking",
//       "link",
//       "technologies",
//       "description",
//     ];
//     return !optionalFields.some((optional) => lowerKey.includes(optional));
//   };

//   const validateAndShowErrors = (): boolean => {
//     if (!openModalSection) return true;
//     const sectionFields = getSectionFields(openModalSection);
//     let hasEmptyRequiredFields = false;

//     sectionFields.forEach((key) => {
//       const value = formData[key] || "";
//       if (isRequiredField(key)) {
//         if (!value || value.trim() === "") {
//           handleBlur(key, value);
//           hasEmptyRequiredFields = true;
//         }
//       }
//     });

//     return !hasEmptyRequiredFields;
//   };

//   const handleSaveForm = () => {
//     if (!openModalSection) return;
//     const sectionFields = getSectionFields(openModalSection);
//     const hasExistingErrors = sectionFields.some((key) => errors[key]);
//     if (hasExistingErrors) return;

//     const isValid = validateAndShowErrors();
//     if (!isValid) return;

//     closeModal();
//   };

//   return (
//     <>
//       <h3 className="text-lg font-semibold text-[#2557a7] mb-2">
//         Resume Sections
//       </h3>
//       <p className="text-xs text-gray-800 mb-4">
//         Complete each section to build a perfect resume
//       </p>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-3 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={openModalSection === s.name}
//                           onToggle={() =>
//                             setOpenModalSection(
//                               openModalSection === s.name ? null : s.name
//                             )
//                           }
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                           isComplete={completionStatus[s.name] || false}
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       {/* Add New Section */}
//       <AddNewSection />

//       {/* Extra Sections */}
//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3 flex-1">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                     {s.name}
//                   </p>
//                 </div>

//                 {/* AI icon aligned before plus button */}
//                 <div className="flex items-center gap-2">
//                   {s.ai && (
//                     <span className="inline-flex items-center justify-center">
//                       <Image
//                         src="/assets/icons/AI_icon.svg"
//                         alt="AI"
//                         width={16}
//                         height={16}
//                         className="w-6 h-6"
//                       />
//                     </span>
//                   )}
//                   <div
//                     className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                               bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                               group-hover:from-blue-500 group-hover:to-blue-700 
//                               group-hover:text-white group-hover:scale-110"
//                   >
//                     <Plus size={14} />
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {/* Popup Modal */}
//       {openModalSection && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-[930px] h-[88vh] overflow-y-auto relative flex flex-col">
//             {/* Close button */}
//             <button
//               onClick={closeModal}
//               className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
//             >
//               <X size={20} />
//             </button>

//             {/* Section Title */}
//             <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center border-b border-gray-200 pb-3">
//               {openModalSection}
//             </h2>

//             <div className="flex-1 overflow-y-auto px-1">
//               {(() => {
//                 const Component = sectionComponents[openModalSection];
//                 if (!Component) return null;
//                 return (
//                   <Component
//                     formData={formData}
//                     errors={errors}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                   />
//                 );
//               })()}
//             </div>

//             {/* Buttons */}
//             <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end gap-3">
//               <button
//                 onClick={closeModal}
//                 className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveForm}
//                 className="px-4 py-2 text-sm bg-[#2557a7] text-white rounded-lg hover:bg-blue-600 transition"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab; before section open template auto


// "use client";
// import React, { useState } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus, Sparkles, X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";


// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
//   onSidebarToggle?: (isOpen: boolean) => void;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   handleDragEnd,
//   completionStatus = {},
//   onSidebarToggle,
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { setSectionOrder, selectedTemplate, setSelectedTemplate } = useResume();
//   const [openModalSection, setOpenModalSection] = useState<string | null>(null);

//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   const closeModal = () => {
//     setOpenModalSection(null);
//   };

//   const handleToggleSection = (sectionName: string) => {
//     // If no template is selected, automatically select template-1 and close sidebar
//     if (!selectedTemplate) {
//       setSelectedTemplate(1);
//       if (onSidebarToggle) {
//         onSidebarToggle(false);
//       }
//     }
    
//     setOpenModalSection(
//       openModalSection === sectionName ? null : sectionName
//     );
//   };

//   const getSectionFields = (sectionName: string): string[] => {
//     const fields: string[] = [];

//     Object.keys(formData).forEach((key) => {
//       const lowerKey = key.toLowerCase();
//       const lowerSection = sectionName.toLowerCase().replace(/\s+/g, "");

//       if (
//         lowerKey.includes(lowerSection) ||
//         (sectionName === "Personal Info" &&
//           (lowerKey.includes("name") ||
//             lowerKey.includes("email") ||
//             lowerKey.includes("phone") ||
//             lowerKey.includes("location") ||
//             lowerKey.includes("linkedin"))) ||
//         (sectionName === "Professional Summary" &&
//           lowerKey.includes("summary")) ||
//         (sectionName === "Skills" && lowerKey.includes("skill")) ||
//         (sectionName === "Education" && lowerKey.includes("education")) ||
//         (sectionName === "Work Experience" &&
//           (lowerKey.includes("workexperience") ||
//             lowerKey.includes("company") ||
//             (lowerKey.includes("role") && !lowerKey.includes("internship")))) ||
//         (sectionName === "Projects" && lowerKey.includes("project")) ||
//         (sectionName === "Certifications" &&
//           lowerKey.includes("certification")) ||
//         (sectionName === "Achievements" &&
//           lowerKey.includes("achievement")) ||
//         (sectionName === "Volunteering" &&
//           lowerKey.includes("volunteering")) ||
//         (sectionName === "Internships" &&
//           lowerKey.includes("internship")) ||
//         (sectionName === "Awards" && lowerKey.includes("award")) ||
//         (sectionName === "References" &&
//           lowerKey.includes("reference"))
//       ) {
//         fields.push(key);
//       }
//     });

//     return fields;
//   };

//   const isRequiredField = (key: string): boolean => {
//     const lowerKey = key.toLowerCase();
//     const optionalFields = [
//       "linkedin",
//       "currentlyworking",
//       "link",
//       "technologies",
//       "description",
//     ];
//     return !optionalFields.some((optional) => lowerKey.includes(optional));
//   };

//   const validateAndShowErrors = (): boolean => {
//     if (!openModalSection) return true;
//     const sectionFields = getSectionFields(openModalSection);
//     let hasEmptyRequiredFields = false;

//     sectionFields.forEach((key) => {
//       const value = formData[key] || "";
//       if (isRequiredField(key)) {
//         if (!value || value.trim() === "") {
//           handleBlur(key, value);
//           hasEmptyRequiredFields = true;
//         }
//       }
//     });

//     return !hasEmptyRequiredFields;
//   };

//   const handleSaveForm = () => {
//     if (!openModalSection) return;
//     const sectionFields = getSectionFields(openModalSection);
//     const hasExistingErrors = sectionFields.some((key) => errors[key]);
//     if (hasExistingErrors) return;

//     const isValid = validateAndShowErrors();
//     if (!isValid) return;

//     closeModal();
//   };

//   return (
//     <>
//       <h3 className="text-lg font-semibold text-[#2557a7] mb-2">
//         Resume Sections
//       </h3>
//       <p className="text-xs text-gray-800 mb-4">
//         Complete each section to build a perfect resume
//       </p>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-2 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={openModalSection === s.name}
//                           onToggle={() => handleToggleSection(s.name)}
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                           isComplete={completionStatus[s.name] || false}
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       {/* Add New Section */}
//       <AddNewSection />

//       {/* Extra Sections */}
//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3 flex-1">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                     {s.name}
//                   </p>
//                 </div>

//                 {/* AI icon aligned before plus button */}
//                 <div className="flex items-center gap-2">
//                   {s.ai && (
//                     <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#efedf2] text-black rounded-full">
//                       <Sparkles size={12} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI
//                       </span>
//                   )}
//                   <div
//                     className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                               bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                               group-hover:from-blue-500 group-hover:to-blue-700 
//                               group-hover:text-white group-hover:scale-110"
//                   >
//                     <Plus size={14} />
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {/* Popup Modal */}
//       {openModalSection && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-[930px] h-[88vh] relative flex flex-col">
//             {/* Close button */}
//             <button
//               onClick={closeModal}
//               className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
//             >
//               <X size={20} />
//             </button>

//             {/* Section Title */}
//             <h2 className="text-xl font-semibold text-gray-700 text-center border-b border-gray-200 pb-3">
//               {openModalSection}
//             </h2>

//             <div className="flex-1 px-1">
//               {(() => {
//                 const Component = sectionComponents[openModalSection];
//                 if (!Component) return null;
//                 return (
//                   <Component
//                     formData={formData}
//                     errors={errors}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                   />
//                 );
//               })()}
//             </div>

//             {/* Buttons */}
//             <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end gap-3">
//               <button
//                 onClick={closeModal}
//                 className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveForm}
//                 className="px-4 py-2 text-sm bg-[#2557a7] text-white rounded-lg hover:bg-blue-600 transition"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab; before circle bar



// "use client";
// import React, { useState } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import CircularProgress from "./CircularProgress";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus, Sparkles, X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
//   onSidebarToggle?: (isOpen: boolean) => void;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   handleDragEnd,
//   completionStatus = {},
//   onSidebarToggle,
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { setSectionOrder, selectedTemplate, setSelectedTemplate, getCompletionPercentage, setCompletionStatus } = useResume();
//   const [openModalSection, setOpenModalSection] = useState<string | null>(null);

//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   const closeModal = () => {
//     setOpenModalSection(null);
//   };

//   const handleToggleSection = (sectionName: string) => {
//     // If no template is selected, automatically select template-1 and close sidebar
//     if (!selectedTemplate) {
//       setSelectedTemplate(1);
//       if (onSidebarToggle) {
//         onSidebarToggle(false);
//       }
//     }

//     setOpenModalSection(
//       openModalSection === sectionName ? null : sectionName
//     );
//   };

//   const getSectionFields = (sectionName: string): string[] => {
//     const fields: string[] = [];

//     Object.keys(formData).forEach((key) => {
//       const lowerKey = key.toLowerCase();
//       const lowerSection = sectionName.toLowerCase().replace(/\s+/g, "");

//       if (
//         lowerKey.includes(lowerSection) ||
//         (sectionName === "Personal Info" &&
//           (lowerKey.includes("name") ||
//             lowerKey.includes("email") ||
//             lowerKey.includes("phone") ||
//             lowerKey.includes("location") ||
//             lowerKey.includes("linkedin"))) ||
//         (sectionName === "Professional Summary" &&
//           lowerKey.includes("summary")) ||
//         (sectionName === "Skills" && lowerKey.includes("skill")) ||
//         (sectionName === "Education" && lowerKey.includes("education")) ||
//         (sectionName === "Work Experience" &&
//           (lowerKey.includes("workexperience") ||
//             lowerKey.includes("company") ||
//             (lowerKey.includes("role") && !lowerKey.includes("internship")))) ||
//         (sectionName === "Projects" && lowerKey.includes("project")) ||
//         (sectionName === "Certifications" &&
//           lowerKey.includes("certification")) ||
//         (sectionName === "Achievements" &&
//           lowerKey.includes("achievement")) ||
//         (sectionName === "Volunteering" &&
//           lowerKey.includes("volunteering")) ||
//         (sectionName === "Internships" &&
//           lowerKey.includes("internship")) ||
//         (sectionName === "Awards" && lowerKey.includes("award")) ||
//         (sectionName === "Hobbies" && lowerKey.includes("hobbie")) ||
//         (sectionName === "Interests" && lowerKey.includes("interest")) ||
//         (sectionName === "Languages" && lowerKey.includes("language")) ||
//         (sectionName === "Publications" && lowerKey.includes("publication")) ||
//         (sectionName === "References" &&
//           lowerKey.includes("reference"))
//       ) {
//         fields.push(key);
//       }
//     });

//     return fields;
//   };

//   const isRequiredField = (key: string): boolean => {
//     const lowerKey = key.toLowerCase();
//     const optionalFields = [
//       "linkedin",
//       "portfolio",
//       "currentlyworking",
//       "link",
//       "technologies",
//       "description",
//       "achievement",
//       "category",
//       "proficiencylevel",
//     ];
//     return !optionalFields.some((optional) => lowerKey.includes(optional));
//   };

//   const validateAndShowErrors = (): boolean => {
//     if (!openModalSection) return true;
//     const sectionFields = getSectionFields(openModalSection);
//     let hasEmptyRequiredFields = false;

//     sectionFields.forEach((key) => {
//       const value = formData[key] || "";
//       if (isRequiredField(key)) {
//         if (!value || value.trim() === "") {
//           handleBlur(key, value);
//           hasEmptyRequiredFields = true;
//         }
//       }
//     });

//     return !hasEmptyRequiredFields;
//   };

//   const handleSaveForm = () => {
//     if (!openModalSection) return;
//     const sectionFields = getSectionFields(openModalSection);
//     const hasExistingErrors = sectionFields.some((key) => errors[key]);
//     if (hasExistingErrors) return;

//     const isValid = validateAndShowErrors();
//     if (!isValid) return;

//     // Mark section as complete
//     setCompletionStatus((prev) => ({
//       ...prev,
//       [openModalSection]: true,
//     }));

//     closeModal();
//   };

//   const completionPercentage = getCompletionPercentage();

//   return (
//     <>
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex-1">
//           <h3 className="text-lg font-semibold text-[#2557a7] mb-2">
//             Resume Sections
//           </h3>
//           <p className="text-xs text-gray-800">
//             Complete each section to build a perfect resume
//           </p>
//         </div>
//         <div className="relative">
//           <CircularProgress percentage={completionPercentage} size={54} strokeWidth={4} />
//         </div>
//       </div>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-2 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={openModalSection === s.name}
//                           onToggle={() => handleToggleSection(s.name)}
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                           isComplete={completionStatus[s.name] || false}
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       {/* Add New Section */}
//       <AddNewSection />

//       {/* Extra Sections */}
//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3 flex-1">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                     {s.name}
//                   </p>
//                 </div>

//                 {/* AI icon aligned before plus button */}
//                 <div className="flex items-center gap-2">
//                   {s.ai && (
//                     <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#efedf2] text-black rounded-full">
//                       <Sparkles size={12} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI
//                     </span>
//                   )}
//                   <div
//                     className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                               bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                               group-hover:from-blue-500 group-hover:to-blue-700 
//                               group-hover:text-white group-hover:scale-110"
//                   >
//                     <Plus size={14} />
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {/* Popup Modal */}
//       {openModalSection && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-[930px] h-[88vh] relative flex flex-col">
//             {/* Close button */}
//             <button
//               onClick={closeModal}
//               className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
//             >
//               <X size={20} />
//             </button>

//             {/* Section Title */}
//             <h2 className="text-xl font-semibold text-gray-700 text-center border-b border-gray-200 pb-3">
//               {openModalSection}
//             </h2>

//             <div className="flex-1 min-h-[75px] px-1">
//               {(() => {
//                 const Component = sectionComponents[openModalSection];
//                 if (!Component) return null;
//                 return (
//                   <Component
//                     formData={formData}
//                     errors={errors}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                   />
//                 );
//               })()}
//             </div>

//             {/* Buttons */}
//             <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end gap-3">
//               <button
//                 onClick={closeModal}
//                 className=" text-[16px] bg-gray-100 text-gray-700 font-semibold rounded-lg min-h-[48px] min-w-[112px] hover:bg-gray-200 transition"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveForm}
//                 className="text-[16px] bg-[#2557a7] font-semibold text-white min-h-[48px] min-w-[112px] rounded-lg hover:bg-[#184284] transition"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab;  
// before api



// "use client";
// import React, { useState } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import CircularProgress from "./CircularProgress";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus, Sparkles, X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";
// import { updateResume, deleteResumeSection } from "@/api/resumeApi";
// import { toast } from "sonner";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
//   onSidebarToggle?: (isOpen: boolean) => void;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   handleDragEnd,
//   completionStatus = {},
//   onSidebarToggle,
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { 
//     setSectionOrder, 
//     selectedTemplate, 
//     setSelectedTemplate, 
//     getCompletionPercentage, 
//     setCompletionStatus,
//     resumeData 
//   } = useResume();
  
//   const [openModalSection, setOpenModalSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);

//   // Map section names to backend field names
//   const getSectionBackendName = (sectionName: string): string => {
//     const mapping: Record<string, string> = {
//       "Personal Info": "personal_info",
//       "Professional Summary": "professional_summary",
//       "Work Experience": "work_experience",
//       "Education": "education",
//       "Skills": "skills",
//       "Projects": "projects",
//       "Certifications": "certifications",
//       "Achievements": "achievements",
//       "Volunteering": "volunteering",
//       "References": "references",
//       "Internships": "internships",
//       "Awards": "awards",
//       "Publications": "publications",
//       "Interests": "interests",
//       "Hobbies": "hobbies",
//       "Languages": "languages",
//     };
//     return mapping[sectionName] || sectionName.toLowerCase().replace(/\s+/g, "_");
//   };

//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   const closeModal = () => {
//     setOpenModalSection(null);
//   };

//   const handleToggleSection = (sectionName: string) => {
//     if (!selectedTemplate) {
//       setSelectedTemplate(1);
//       if (onSidebarToggle) {
//         onSidebarToggle(false);
//       }
//     }

//     setOpenModalSection(
//       openModalSection === sectionName ? null : sectionName
//     );
//   };

//   // Handle section deletion with API call
//   const handleDeleteSectionWithAPI = async (index: number) => {
//     const sectionToDelete = sections[index];
//     const sectionName = sectionToDelete.name;

//     // Don't allow deletion of required sections
//     if (nonDeletableSections.includes(sectionName)) {
//       toast.error(`Cannot delete ${sectionName} section`);
//       return;
//     }

//     const resumeId = localStorage.getItem("current_resume_id");
//     if (!resumeId) {
//       // If no resume ID, just delete locally
//       handleDeleteSection(index);
//       return;
//     }

//     try {
//       setIsDeleting(true);
//       console.log("🗑️ Deleting section from backend:", sectionName);

//       const backendSectionName = getSectionBackendName(sectionName);
//       await deleteResumeSection(resumeId, backendSectionName);

//       console.log("✅ Section deleted from backend");
//       toast.success(`${sectionName} section deleted`);

//       // Delete locally after successful API call
//       handleDeleteSection(index);

//     } catch (error) {
//       console.error("❌ Error deleting section:", error);
//       toast.error(error instanceof Error ? error.message : "Failed to delete section");
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const getSectionFields = (sectionName: string): string[] => {
//     const fields: string[] = [];

//     Object.keys(formData).forEach((key) => {
//       const lowerKey = key.toLowerCase();
//       const lowerSection = sectionName.toLowerCase().replace(/\s+/g, "");

//       if (
//         lowerKey.includes(lowerSection) ||
//         (sectionName === "Personal Info" &&
//           (lowerKey.includes("name") ||
//             lowerKey.includes("email") ||
//             lowerKey.includes("phone") ||
//             lowerKey.includes("location") ||
//             lowerKey.includes("linkedin"))) ||
//         (sectionName === "Professional Summary" &&
//           lowerKey.includes("summary")) ||
//         (sectionName === "Skills" && lowerKey.includes("skill")) ||
//         (sectionName === "Education" && lowerKey.includes("education")) ||
//         (sectionName === "Work Experience" &&
//           (lowerKey.includes("workexperience") ||
//             lowerKey.includes("company") ||
//             (lowerKey.includes("role") && !lowerKey.includes("internship")))) ||
//         (sectionName === "Projects" && lowerKey.includes("project")) ||
//         (sectionName === "Certifications" &&
//           lowerKey.includes("certification")) ||
//         (sectionName === "Achievements" &&
//           lowerKey.includes("achievement")) ||
//         (sectionName === "Volunteering" &&
//           lowerKey.includes("volunteering")) ||
//         (sectionName === "Internships" &&
//           lowerKey.includes("internship")) ||
//         (sectionName === "Awards" && lowerKey.includes("award")) ||
//         (sectionName === "Hobbies" && lowerKey.includes("hobbie")) ||
//         (sectionName === "Interests" && lowerKey.includes("interest")) ||
//         (sectionName === "Languages" && lowerKey.includes("language")) ||
//         (sectionName === "Publications" && lowerKey.includes("publication")) ||
//         (sectionName === "References" &&
//           lowerKey.includes("reference"))
//       ) {
//         fields.push(key);
//       }
//     });

//     return fields;
//   };

//   const isRequiredField = (key: string): boolean => {
//     const lowerKey = key.toLowerCase();
//     const optionalFields = [
//       "linkedin",
//       "portfolio",
//       "currently working",
//       "link",
//       "technologies",
//       "description",
//       "achievement",
//       "category",
//       "proficiencylevel",
//     ];
//     return !optionalFields.some((optional) => lowerKey.includes(optional));
//   };

//   const validateAndShowErrors = (): boolean => {
//     if (!openModalSection) return true;
//     const sectionFields = getSectionFields(openModalSection);
//     let hasEmptyRequiredFields = false;

//     sectionFields.forEach((key) => {
//       const value = formData[key] || "";
//       if (isRequiredField(key)) {
//         if (!value || value.trim() === "") {
//           handleBlur(key, value);
//           hasEmptyRequiredFields = true;
//         }
//       }
//     });

//     return !hasEmptyRequiredFields;
//   };

//   const handleSaveForm = async () => {
//     if (!openModalSection) return;
    
//     const sectionFields = getSectionFields(openModalSection);
//     const hasExistingErrors = sectionFields.some((key) => errors[key]);
//     if (hasExistingErrors) return;

//     const isValid = validateAndShowErrors();
//     if (!isValid) return;

//     const resumeId = localStorage.getItem("current_resume_id");
//     if (!resumeId) {
//       toast.error("Resume ID not found. Please create a resume first.");
//       return;
//     }

//     try {
//       setIsSaving(true);
//       console.log("💾 Saving section:", openModalSection);

//       const updatePayload: any = {};

//       switch (openModalSection) {
//         case "Personal Info":
//           updatePayload.personalInfo = {
//             name: resumeData.personalInfo.name,
//             email: resumeData.personalInfo.email,
//             phone: resumeData.personalInfo.phone,
//             location: resumeData.personalInfo.location,
//             linkedin: resumeData.personalInfo.linkedinurl,
//             portfolio: resumeData.personalInfo.portifoliourl,
//           };
//           break;

//         case "Professional Summary":
//           updatePayload.professionalSummary = resumeData.professionalSummary;
//           break;

//         case "Education":
//           updatePayload.education = resumeData.education;
//           break;

//         case "Work Experience":
//           updatePayload.workExperience = resumeData.workExperience;
//           break;

//         case "Projects":
//           updatePayload.projects = resumeData.projects;
//           break;

//         case "Skills":
//           updatePayload.skills = resumeData.skills;
//           break;

//         case "Certifications":
//           updatePayload.certifications = resumeData.certifications;
//           break;

//         case "Achievements":
//           updatePayload.achievements = resumeData.achievements;
//           break;

//         case "Volunteering":
//           updatePayload.volunteering = resumeData.volunteering;
//           break;

//         case "References":
//           updatePayload.references = resumeData.references;
//           break;

//         case "Internships":
//           updatePayload.internships = resumeData.internships;
//           break;

//         case "Awards":
//           updatePayload.awards = resumeData.awards;
//           break;

//         case "Publications":
//           updatePayload.publications = resumeData.publications;
//           break;

//         case "Interests":
//           updatePayload.interests = resumeData.interests;
//           break;

//         case "Hobbies":
//           updatePayload.hobbies = resumeData.hobbies;
//           break;

//         case "Languages":
//           updatePayload.languages = resumeData.languages;
//           break;

//         default:
//           console.warn("Unknown section:", openModalSection);
//           break;
//       }

//       console.log("📤 Sending update to backend:", updatePayload);

//       await updateResume(resumeId, updatePayload);

//       console.log("✅ Section saved successfully");
//       toast.success(`${openModalSection} saved successfully!`);

//       setCompletionStatus((prev) => ({
//         ...prev,
//         [openModalSection]: true,
//       }));

//       closeModal();
      
//     } catch (error) {
//       console.error("❌ Error saving section:", error);
//       toast.error(error instanceof Error ? error.message : "Failed to save section");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const completionPercentage = getCompletionPercentage();

//   return (
//     <>
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex-1">
//           <h3 className="text-lg font-semibold text-[#2557a7] mb-2">
//             Resume Sections
//           </h3>
//           <p className="text-xs text-gray-800">
//             Complete each section to build a perfect resume
//           </p>
//         </div>
//         <div className="relative">
//           <CircularProgress percentage={completionPercentage} size={54} strokeWidth={4} />
//         </div>
//       </div>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-2 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null || isDeleting}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={openModalSection === s.name}
//                           onToggle={() => handleToggleSection(s.name)}
//                           onDelete={() => handleDeleteSectionWithAPI(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name) || isDeleting}
//                           isComplete={completionStatus[s.name] || false}
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       <AddNewSection />

//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3 flex-1">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                     {s.name}
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   {s.ai && (
//                     <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#efedf2] text-black rounded-full">
//                       <Sparkles size={12} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI
//                     </span>
//                   )}
//                   <div
//                     className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                               bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                               group-hover:from-blue-500 group-hover:to-blue-700 
//                               group-hover:text-white group-hover:scale-110"
//                   >
//                     <Plus size={14} />
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {openModalSection && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-[930px] h-[88vh] relative flex flex-col">
//             <button
//               onClick={closeModal}
//               className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
//               disabled={isSaving}
//             >
//               <X size={20} />
//             </button>

//             <h2 className="text-xl font-semibold text-gray-700 text-center border-b border-gray-200 pb-3">
//               {openModalSection}
//             </h2>

//             <div className="flex-1 min-h-[75px] px-1 overflow-y-auto">
//               {(() => {
//                 const Component = sectionComponents[openModalSection];
//                 if (!Component) return null;
//                 return (
//                   <Component
//                     formData={formData}
//                     errors={errors}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                   />
//                 );
//               })()}
//             </div>

//             <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end gap-3">
//               <button
//                 onClick={closeModal}
//                 disabled={isSaving}
//                 className="text-[16px] bg-gray-100 text-gray-700 font-semibold rounded-lg min-h-[48px] min-w-[112px] hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveForm}
//                 disabled={isSaving}
//                 className="text-[16px] bg-[#2557a7] font-semibold text-white min-h-[48px] min-w-[112px] rounded-lg hover:bg-[#184284] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {isSaving ? (
//                   <>
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                     Saving...
//                   </>
//                 ) : (
//                   "Save"
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab;



// "use client";
// import React, { useState } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import CircularProgress from "./CircularProgress";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus, Sparkles, X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";
// import { updateResume, deleteResumeSection } from "@/api/resumeApi";
// import { toast } from "sonner";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
//   onSidebarToggle?: (isOpen: boolean) => void;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   handleDragEnd,
//   completionStatus = {},
//   onSidebarToggle,
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { 
//     setSectionOrder, 
//     selectedTemplate, 
//     setSelectedTemplate, 
//     getCompletionPercentage, 
//     setCompletionStatus,
//     resumeData 
//   } = useResume();
  
//   const [openModalSection, setOpenModalSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);

//   const getSectionBackendName = (sectionName: string): string => {
//     const mapping: Record<string, string> = {
//       "Personal Info": "personal_info",
//       "Professional Summary": "professional_summary",
//       "Work Experience": "work_experience",
//       "Education": "education",
//       "Skills": "skills",
//       "Projects": "projects",
//       "Certifications": "certifications",
//       "Achievements": "achievements",
//       "Volunteering": "volunteering",
//       "References": "references",
//       "Internships": "internships",
//       "Awards": "awards",
//       "Publications": "publications",
//       "Interests": "interests",
//       "Hobbies": "hobbies",
//       "Languages": "languages",
//     };
//     return mapping[sectionName] || sectionName.toLowerCase().replace(/\s+/g, "_");
//   };

//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   const closeModal = () => {
//     setOpenModalSection(null);
//   };

//   const handleToggleSection = (sectionName: string) => {
//     // If no template is selected, set default template and close sidebar
//     if (!selectedTemplate) {
//       console.log("🎨 No template selected, setting default template...");
//       setSelectedTemplate(1); // Set default template
//       if (onSidebarToggle) {
//         onSidebarToggle(false); // Close template sidebar
//       }
//       toast.info("Default template applied");
//     }

//     // Toggle section modal
//     setOpenModalSection(
//       openModalSection === sectionName ? null : sectionName
//     );
//   };

//   const handleDeleteSectionWithAPI = async (index: number) => {
//     const sectionToDelete = sections[index];
//     const sectionName = sectionToDelete.name;

//     if (nonDeletableSections.includes(sectionName)) {
//       toast.error(`Cannot delete ${sectionName} section`);
//       return;
//     }

//     const resumeId = localStorage.getItem("current_resume_id");
//     if (!resumeId) {
//       handleDeleteSection(index);
//       return;
//     }

//     try {
//       setIsDeleting(true);
//       console.log("🗑️ Deleting section from backend:", sectionName);

//       const backendSectionName = getSectionBackendName(sectionName);
//       await deleteResumeSection(resumeId, backendSectionName);

//       console.log("✅ Section deleted from backend");
//       toast.success(`${sectionName} section deleted`);

//       handleDeleteSection(index);

//     } catch (error) {
//       console.error("❌ Error deleting section:", error);
//       toast.error(error instanceof Error ? error.message : "Failed to delete section");
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const getSectionFields = (sectionName: string): string[] => {
//     const fields: string[] = [];

//     Object.keys(formData).forEach((key) => {
//       const lowerKey = key.toLowerCase();
//       const lowerSection = sectionName.toLowerCase().replace(/\s+/g, "");

//       if (
//         lowerKey.includes(lowerSection) ||
//         (sectionName === "Personal Info" &&
//           (lowerKey.includes("name") ||
//             lowerKey.includes("email") ||
//             lowerKey.includes("phone") ||
//             lowerKey.includes("location") ||
//             lowerKey.includes("linkedin"))) ||
//         (sectionName === "Professional Summary" &&
//           lowerKey.includes("summary")) ||
//         (sectionName === "Skills" && lowerKey.includes("skill")) ||
//         (sectionName === "Education" && lowerKey.includes("education")) ||
//         (sectionName === "Work Experience" &&
//           (lowerKey.includes("workexperience") ||
//             lowerKey.includes("company") ||
//             (lowerKey.includes("role") && !lowerKey.includes("internship")))) ||
//         (sectionName === "Projects" && lowerKey.includes("project")) ||
//         (sectionName === "Certifications" &&
//           lowerKey.includes("certification")) ||
//         (sectionName === "Achievements" &&
//           lowerKey.includes("achievement")) ||
//         (sectionName === "Volunteering" &&
//           lowerKey.includes("volunteering")) ||
//         (sectionName === "Internships" &&
//           lowerKey.includes("internship")) ||
//         (sectionName === "Awards" && lowerKey.includes("award")) ||
//         (sectionName === "Hobbies" && lowerKey.includes("hobbie")) ||
//         (sectionName === "Interests" && lowerKey.includes("interest")) ||
//         (sectionName === "Languages" && lowerKey.includes("language")) ||
//         (sectionName === "Publications" && lowerKey.includes("publication")) ||
//         (sectionName === "References" &&
//           lowerKey.includes("reference"))
//       ) {
//         fields.push(key);
//       }
//     });

//     return fields;
//   };

//   const isRequiredField = (key: string): boolean => {
//     const lowerKey = key.toLowerCase();
//     const optionalFields = [
//       "linkedin",
//       "portfolio",
//       "currently working",
//       "link",
//       "technologies",
//       "description",
//       "achievement",
//       "category",
//       "proficiencylevel",
//     ];
//     return !optionalFields.some((optional) => lowerKey.includes(optional));
//   };

//   const validateAndShowErrors = (): boolean => {
//     if (!openModalSection) return true;
//     const sectionFields = getSectionFields(openModalSection);
//     let hasEmptyRequiredFields = false;

//     sectionFields.forEach((key) => {
//       const value = formData[key] || "";
//       if (isRequiredField(key)) {
//         if (!value || value.trim() === "") {
//           handleBlur(key, value);
//           hasEmptyRequiredFields = true;
//         }
//       }
//     });

//     return !hasEmptyRequiredFields;
//   };

//   const handleSaveForm = async () => {
//     if (!openModalSection) return;
    
//     const sectionFields = getSectionFields(openModalSection);
//     const hasExistingErrors = sectionFields.some((key) => errors[key]);
//     if (hasExistingErrors) return;

//     const isValid = validateAndShowErrors();
//     if (!isValid) return;

//     const resumeId = localStorage.getItem("current_resume_id");
//     if (!resumeId) {
//       toast.error("Resume ID not found. Please create a resume first.");
//       return;
//     }

//     try {
//       setIsSaving(true);
//       console.log("💾 Saving section:", openModalSection);

//       const updatePayload: any = {};

//       switch (openModalSection) {
//         case "Personal Info":
//           updatePayload.personalInfo = {
//             name: resumeData.personalInfo.name,
//             email: resumeData.personalInfo.email,
//             phone: resumeData.personalInfo.phone,
//             location: resumeData.personalInfo.location,
//             linkedin: resumeData.personalInfo.linkedinurl,
//             portfolio: resumeData.personalInfo.portifoliourl,
//           };
//           break;

//         case "Professional Summary":
//           updatePayload.professionalSummary = resumeData.professionalSummary;
//           break;

//         case "Education":
//           updatePayload.education = resumeData.education;
//           break;

//         case "Work Experience":
//           updatePayload.workExperience = resumeData.workExperience;
//           break;

//         case "Projects":
//           updatePayload.projects = resumeData.projects;
//           break;

//         case "Skills":
//           updatePayload.skills = resumeData.skills;
//           break;

//         case "Certifications":
//           updatePayload.certifications = resumeData.certifications;
//           break;

//         case "Achievements":
//           updatePayload.achievements = resumeData.achievements;
//           break;

//         case "Volunteering":
//           updatePayload.volunteering = resumeData.volunteering;
//           break;

//         case "References":
//           updatePayload.references = resumeData.references;
//           break;

//         case "Internships":
//           updatePayload.internships = resumeData.internships;
//           break;

//         case "Awards":
//           updatePayload.awards = resumeData.awards;
//           break;

//         case "Publications":
//           updatePayload.publications = resumeData.publications;
//           break;

//         case "Interests":
//           updatePayload.interests = resumeData.interests;
//           break;

//         case "Hobbies":
//           updatePayload.hobbies = resumeData.hobbies;
//           break;

//         case "Languages":
//           updatePayload.languages = resumeData.languages;
//           break;

//         default:
//           console.warn("Unknown section:", openModalSection);
//           break;
//       }

//       console.log("📤 Sending update to backend:", updatePayload);

//       await updateResume(resumeId, updatePayload);

//       console.log("✅ Section saved successfully");
//       toast.success(`${openModalSection} saved successfully!`);

//       setCompletionStatus((prev) => ({
//         ...prev,
//         [openModalSection]: true,
//       }));

//       closeModal();
      
//     } catch (error) {
//       console.error("❌ Error saving section:", error);
//       toast.error(error instanceof Error ? error.message : "Failed to save section");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const completionPercentage = getCompletionPercentage();

//   return (
//     <>
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex-1">
//           <h3 className="text-lg font-semibold text-[#2557a7] mb-2">
//             Resume Sections
//           </h3>
//           <p className="text-xs text-gray-800">
//             Complete each section to build a perfect resume
//           </p>
//         </div>
//         <div className="relative">
//           <CircularProgress percentage={completionPercentage} size={54} strokeWidth={4} />
//         </div>
//       </div>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-2 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null || isDeleting}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={openModalSection === s.name}
//                           onToggle={() => handleToggleSection(s.name)}
//                           onDelete={() => handleDeleteSectionWithAPI(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name) || isDeleting}
//                           isComplete={completionStatus[s.name] || false}
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       <AddNewSection />

//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3 flex-1">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                     {s.name}
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   {s.ai && (
//                     <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#efedf2] text-black rounded-full">
//                       <Sparkles size={12} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI
//                     </span>
//                   )}
//                   <div
//                     className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                               bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                               group-hover:from-blue-500 group-hover:to-blue-700 
//                               group-hover:text-white group-hover:scale-110"
//                   >
//                     <Plus size={14} />
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {openModalSection && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-[930px] h-[88vh] relative flex flex-col">
//             <button
//               onClick={closeModal}
//               className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
//               disabled={isSaving}
//             >
//               <X size={20} />
//             </button>

//             <h2 className="text-xl font-semibold text-gray-700 text-center border-b border-gray-200 pb-3">
//               {openModalSection}
//             </h2>

//             <div className="flex-1 min-h-[75px] px-1 overflow-y-auto">
//               {(() => {
//                 const Component = sectionComponents[openModalSection];
//                 if (!Component) return null;
//                 return (
//                   <Component
//                     formData={formData}
//                     errors={errors}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                   />
//                 );
//               })()}
//             </div>

//             <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end gap-3">
//               <button
//                 onClick={closeModal}
//                 disabled={isSaving}
//                 className="text-[16px] bg-gray-100 text-gray-700 font-semibold rounded-lg min-h-[48px] min-w-[112px] hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveForm}
//                 disabled={isSaving}
//                 className="text-[16px] bg-[#2557a7] font-semibold text-white min-h-[48px] min-w-[112px] rounded-lg hover:bg-[#184284] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {isSaving ? (
//                   <>
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                     Saving...
//                   </>
//                 ) : (
//                   "Save"
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab;



// "use client";
// import React, { useState } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import CircularProgress from "./CircularProgress";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus, Sparkles, X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
//   onSidebarToggle?: (isOpen: boolean) => void;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   handleDragEnd,
//   completionStatus = {},
//   onSidebarToggle,
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { setSectionOrder, selectedTemplate, setSelectedTemplate, getCompletionPercentage, setCompletionStatus } = useResume();
//   const [openModalSection, setOpenModalSection] = useState<string | null>(null);

//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   const closeModal = () => {
//     setOpenModalSection(null);
//   };

//   const handleToggleSection = (sectionName: string) => {
//     // If no template is selected, automatically select template-1 and close sidebar
//     if (!selectedTemplate) {
//       setSelectedTemplate(1);
//       if (onSidebarToggle) {
//         onSidebarToggle(false);
//       }
//     }

//     setOpenModalSection(
//       openModalSection === sectionName ? null : sectionName
//     );
//   };

//   const getSectionFields = (sectionName: string): string[] => {
//     const fields: string[] = [];

//     Object.keys(formData).forEach((key) => {
//       const lowerKey = key.toLowerCase();
//       const lowerSection = sectionName.toLowerCase().replace(/\s+/g, "");

//       if (
//         lowerKey.includes(lowerSection) ||
//         (sectionName === "Personal Info" &&
//           (lowerKey.includes("name") ||
//             lowerKey.includes("email") ||
//             lowerKey.includes("phone") ||
//             lowerKey.includes("location") ||
//             lowerKey.includes("linkedin"))) ||
//         (sectionName === "Professional Summary" &&
//           lowerKey.includes("summary")) ||
//         (sectionName === "Skills" && lowerKey.includes("skill")) ||
//         (sectionName === "Education" && lowerKey.includes("education")) ||
//         (sectionName === "Work Experience" &&
//           (lowerKey.includes("workexperience") ||
//             lowerKey.includes("company") ||
//             (lowerKey.includes("role") && !lowerKey.includes("internship")))) ||
//         (sectionName === "Projects" && lowerKey.includes("project")) ||
//         (sectionName === "Certifications" &&
//           lowerKey.includes("certification")) ||
//         (sectionName === "Achievements" &&
//           lowerKey.includes("achievement")) ||
//         (sectionName === "Volunteering" &&
//           lowerKey.includes("volunteering")) ||
//         (sectionName === "Internships" &&
//           lowerKey.includes("internship")) ||
//         (sectionName === "Awards" && lowerKey.includes("award")) ||
//         (sectionName === "Hobbies" && lowerKey.includes("hobbie")) ||
//         (sectionName === "Interests" && lowerKey.includes("interest")) ||
//         (sectionName === "Languages" && lowerKey.includes("language")) ||
//         (sectionName === "Publications" && lowerKey.includes("publication")) ||
//         (sectionName === "References" &&
//           lowerKey.includes("reference"))
//       ) {
//         fields.push(key);
//       }
//     });

//     return fields;
//   };

//   const isRequiredField = (key: string): boolean => {
//     const lowerKey = key.toLowerCase();
//     const optionalFields = [
//       "linkedin",
//       "portfolio",
//       "currentlyworking",
//       "link",
//       "technologies",
//       "description",
//       "achievement",
//       "category",
//       "proficiencylevel",
//     ];
//     return !optionalFields.some((optional) => lowerKey.includes(optional));
//   };

//   const validateAndShowErrors = (): boolean => {
//     if (!openModalSection) return true;
//     const sectionFields = getSectionFields(openModalSection);
//     let hasEmptyRequiredFields = false;

//     sectionFields.forEach((key) => {
//       const value = formData[key] || "";
//       if (isRequiredField(key)) {
//         if (!value || value.trim() === "") {
//           handleBlur(key, value);
//           hasEmptyRequiredFields = true;
//         }
//       }
//     });

//     return !hasEmptyRequiredFields;
//   };

//   const handleSaveForm = () => {
//     if (!openModalSection) return;
//     const sectionFields = getSectionFields(openModalSection);
//     const hasExistingErrors = sectionFields.some((key) => errors[key]);
//     if (hasExistingErrors) return;

//     const isValid = validateAndShowErrors();
//     if (!isValid) return;

//     // Mark section as complete
//     setCompletionStatus((prev) => ({
//       ...prev,
//       [openModalSection]: true,
//     }));

//     closeModal();
//   };

//   const completionPercentage = getCompletionPercentage();

//   return (
//     <>
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex-1">
//           <h3 className="text-lg font-semibold text-[#2557a7] mb-2">
//             Resume Sections
//           </h3>
//           <p className="text-xs text-gray-800">
//             Complete each section to build a perfect resume
//           </p>
//         </div>
//         <div className="relative">
//           <CircularProgress percentage={completionPercentage} size={54} strokeWidth={4} />
//         </div>
//       </div>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-2 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={openModalSection === s.name}
//                           onToggle={() => handleToggleSection(s.name)}
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                           isComplete={completionStatus[s.name] || false}
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       {/* Add New Section */}
//       <AddNewSection />

//       {/* Extra Sections */}
//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3 flex-1">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                     {s.name}
//                   </p>
//                 </div>

//                 {/* AI icon aligned before plus button */}
//                 <div className="flex items-center gap-2">
//                   {s.ai && (
//                     <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#efedf2] text-black rounded-full">
//                       <Sparkles size={12} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI
//                     </span>
//                   )}
//                   <div
//                     className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                               bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                               group-hover:from-blue-500 group-hover:to-blue-700 
//                               group-hover:text-white group-hover:scale-110"
//                   >
//                     <Plus size={14} />
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {/* Popup Modal */}
//       {openModalSection && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-[930px] h-[88vh] relative flex flex-col">
//             {/* Close button */}
//             <button
//               onClick={closeModal}
//               className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
//             >
//               <X size={20} />
//             </button>

//             {/* Section Title */}
//             <h2 className="text-xl font-semibold text-gray-700 text-center border-b border-gray-200 pb-3">
//               {openModalSection}
//             </h2>

//             <div className="flex-1 min-h-[75px] px-1">
//               {(() => {
//                 const Component = sectionComponents[openModalSection];
//                 if (!Component) return null;
//                 return (
//                   <Component
//                     formData={formData}
//                     errors={errors}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                   />
//                 );
//               })()}
//             </div>

//             {/* Buttons */}
//             <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end gap-3">
//               <button
//                 onClick={closeModal}
//                 className=" text-[16px] bg-gray-100 text-gray-700 font-semibold rounded-lg min-h-[48px] min-w-[112px] hover:bg-gray-200 transition"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveForm}
//                 className="text-[16px] bg-[#2557a7] font-semibold text-white min-h-[48px] min-w-[112px] rounded-lg hover:bg-[#184284] transition"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab;



// "use client";
// import React, { useState } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import CircularProgress from "./CircularProgress";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus, Sparkles, X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";
// import { updateResume } from "@/api/resumeApi";
// import { toast } from "sonner";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
//   onSidebarToggle?: (isOpen: boolean) => void;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   handleDragEnd,
//   completionStatus = {},
//   onSidebarToggle,
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { setSectionOrder, selectedTemplate, setSelectedTemplate, getCompletionPercentage, setCompletionStatus } = useResume();
//   const [openModalSection, setOpenModalSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   const closeModal = () => {
//     setOpenModalSection(null);
//   };

//   const handleToggleSection = (sectionName: string) => {
//     // If no template is selected, automatically select template-1 and close sidebar
//     if (!selectedTemplate) {
//       setSelectedTemplate(1);
//       if (onSidebarToggle) {
//         onSidebarToggle(false);
//       }
//     }

//     setOpenModalSection(
//       openModalSection === sectionName ? null : sectionName
//     );
//   };

//   const getSectionFields = (sectionName: string): string[] => {
//     const fields: string[] = [];

//     Object.keys(formData).forEach((key) => {
//       const lowerKey = key.toLowerCase();
//       const lowerSection = sectionName.toLowerCase().replace(/\s+/g, "");

//       if (
//         lowerKey.includes(lowerSection) ||
//         (sectionName === "Personal Info" &&
//           (lowerKey.includes("name") ||
//             lowerKey.includes("email") ||
//             lowerKey.includes("phone") ||
//             lowerKey.includes("location") ||
//             lowerKey.includes("linkedin"))) ||
//         (sectionName === "Professional Summary" &&
//           lowerKey.includes("summary")) ||
//         (sectionName === "Skills" && lowerKey.includes("skill")) ||
//         (sectionName === "Education" && lowerKey.includes("education")) ||
//         (sectionName === "Work Experience" &&
//           (lowerKey.includes("workexperience") ||
//             lowerKey.includes("company") ||
//             (lowerKey.includes("role") && !lowerKey.includes("internship")))) ||
//         (sectionName === "Projects" && lowerKey.includes("project")) ||
//         (sectionName === "Certifications" &&
//           lowerKey.includes("certification")) ||
//         (sectionName === "Achievements" &&
//           lowerKey.includes("achievement")) ||
//         (sectionName === "Volunteering" &&
//           lowerKey.includes("volunteering")) ||
//         (sectionName === "Internships" &&
//           lowerKey.includes("internship")) ||
//         (sectionName === "Awards" && lowerKey.includes("award")) ||
//         (sectionName === "Hobbies" && lowerKey.includes("hobbie")) ||
//         (sectionName === "Interests" && lowerKey.includes("interest")) ||
//         (sectionName === "Languages" && lowerKey.includes("language")) ||
//         (sectionName === "Publications" && lowerKey.includes("publication")) ||
//         (sectionName === "References" &&
//           lowerKey.includes("reference"))
//       ) {
//         fields.push(key);
//       }
//     });

//     return fields;
//   };

//   const isRequiredField = (key: string): boolean => {
//     const lowerKey = key.toLowerCase();
//     const optionalFields = [
//       "linkedin",
//       "portfolio",
//       "currentlyworking",
//       "link",
//       "technologies",
//       "description",
//       "achievement",
//       "category",
//       "proficiencylevel",
//     ];
//     return !optionalFields.some((optional) => lowerKey.includes(optional));
//   };

//   const validateAndShowErrors = (): boolean => {
//     if (!openModalSection) return true;
//     const sectionFields = getSectionFields(openModalSection);
//     let hasEmptyRequiredFields = false;

//     sectionFields.forEach((key) => {
//       const value = formData[key] || "";
//       if (isRequiredField(key)) {
//         if (!value || value.trim() === "") {
//           handleBlur(key, value);
//           hasEmptyRequiredFields = true;
//         }
//       }
//     });

//     return !hasEmptyRequiredFields;
//   };

//   // ✅ Transform formData to match backend API structure
//   const transformFormDataToBackend = (sectionName: string) => {
//     const sectionFields = getSectionFields(sectionName);
//     const sectionData: Record<string, unknown> = {};

//     sectionFields.forEach((key) => {
//       const value = formData[key];
//       // Map frontend keys to backend keys (adjust based on your API)
//       const backendKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
//       sectionData[backendKey] = value;
//     });

//     return sectionData;
//   };

//   const handleSaveForm = async () => {
//     if (!openModalSection) return;
    
//     const sectionFields = getSectionFields(openModalSection);
//     const hasExistingErrors = sectionFields.some((key) => errors[key]);
//     if (hasExistingErrors) return;

//     const isValid = validateAndShowErrors();
//     if (!isValid) return;

//     setIsSaving(true);

//     try {
//       // Get resume ID from localStorage
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId) {
//         toast.error("Resume ID not found. Please create a resume first.");
//         return;
//       }

//       // Transform formData to backend format
//       const sectionData = transformFormDataToBackend(openModalSection);

//       // Prepare the update payload
//       const updatePayload = {
//         [openModalSection.toLowerCase().replace(/\s+/g, "_")]: sectionData,
//       };

//       console.log("📤 Saving section data:", {
//         resumeId,
//         section: openModalSection,
//         data: updatePayload,
//       });

//       // Call the backend API
//       await updateResume(resumeId, updatePayload);

//       // Mark section as complete
//       setCompletionStatus((prev) => ({
//         ...prev,
//         [openModalSection]: true,
//       }));

//       toast.success(`${openModalSection} saved successfully!`);
//       closeModal();
//     } catch (error) {
//       console.error("❌ Error saving section:", error);
//       toast.error("Failed to save. Please try again.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const completionPercentage = getCompletionPercentage();

//   return (
//     <>
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex-1">
//           <h3 className="text-lg font-semibold text-[#2557a7] mb-2">
//             Resume Sections
//           </h3>
//           <p className="text-xs text-gray-800">
//             Complete each section to build a perfect resume
//           </p>
//         </div>
//         <div className="relative">
//           <CircularProgress percentage={completionPercentage} size={54} strokeWidth={4} />
//         </div>
//       </div>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-2 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={openModalSection === s.name}
//                           onToggle={() => handleToggleSection(s.name)}
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                           isComplete={completionStatus[s.name] || false}
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       {/* Add New Section */}
//       <AddNewSection />

//       {/* Extra Sections */}
//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3 flex-1">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                     {s.name}
//                   </p>
//                 </div>

//                 {/* AI icon aligned before plus button */}
//                 <div className="flex items-center gap-2">
//                   {s.ai && (
//                     <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#efedf2] text-black rounded-full">
//                       <Sparkles size={12} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI
//                     </span>
//                   )}
//                   <div
//                     className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                               bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                               group-hover:from-blue-500 group-hover:to-blue-700 
//                               group-hover:text-white group-hover:scale-110"
//                   >
//                     <Plus size={14} />
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {/* Popup Modal */}
//       {openModalSection && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-[930px] h-[88vh] relative flex flex-col">
//             {/* Close button */}
//             <button
//               onClick={closeModal}
//               className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
//               disabled={isSaving}
//             >
//               <X size={20} />
//             </button>

//             {/* Section Title */}
//             <h2 className="text-xl font-semibold text-gray-700 text-center border-b border-gray-200 pb-3">
//               {openModalSection}
//             </h2>

//             <div className="flex-1 min-h-[75px] px-1">
//               {(() => {
//                 const Component = sectionComponents[openModalSection];
//                 if (!Component) return null;
//                 return (
//                   <Component
//                     formData={formData}
//                     errors={errors}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                   />
//                 );
//               })()}
//             </div>

//             {/* Buttons */}
//             <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end gap-3">
//               <button
//                 onClick={closeModal}
//                 disabled={isSaving}
//                 className="text-[16px] bg-gray-100 text-gray-700 font-semibold rounded-lg min-h-[48px] min-w-[112px] hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveForm}
//                 disabled={isSaving}
//                 className="text-[16px] bg-[#2557a7] font-semibold text-white min-h-[48px] min-w-[112px] rounded-lg hover:bg-[#184284] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {isSaving ? (
//                   <>
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                     <span>Saving...</span>
//                   </>
//                 ) : (
//                   "Save"
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab; before save error


// "use client";
// import React, { useState } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import CircularProgress from "./CircularProgress";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus, Sparkles, X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";
// import { updateResume, getAllResumes } from "@/api/resumeApi";
// import { toast } from "sonner";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
//   onSidebarToggle?: (isOpen: boolean) => void;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   handleDragEnd,
//   completionStatus = {},
//   onSidebarToggle,
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { setSectionOrder, selectedTemplate, setSelectedTemplate, getCompletionPercentage, setCompletionStatus } = useResume();
//   const [openModalSection, setOpenModalSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   const debugResumeId = async () => {
//     const storedId = localStorage.getItem("current_resume_id");
//     console.log("🔍 Stored ID:", storedId);
    
//     const resumes = await getAllResumes();
//     console.log("📊 Backend resumes:", resumes);
//     console.log("📋 Resume IDs:", resumes.map(r => r.id));
    
//     const exists = resumes.some(r => r.id === storedId);
//     console.log("✅ ID exists in backend:", exists);
    
//     if (!exists && resumes.length > 0) {
//       console.log("🔄 Fixing ID to:", resumes[0].id);
//       localStorage.setItem("current_resume_id", resumes[0].id);
//       toast.success("Resume ID fixed! Please try saving again.");
//     } else if (exists) {
//       toast.success("Resume ID is valid!");
//     } else {
//       toast.error("No resumes found in backend!");
//     }
//   };

//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   const closeModal = () => {
//     setOpenModalSection(null);
//   };

//   const handleToggleSection = (sectionName: string) => {
//     if (!selectedTemplate) {
//       setSelectedTemplate(1);
//       if (onSidebarToggle) {
//         onSidebarToggle(false);
//       }
//     }

//     setOpenModalSection(
//       openModalSection === sectionName ? null : sectionName
//     );
//   };

//   const getSectionFields = (sectionName: string): string[] => {
//     const fields: string[] = [];

//     Object.keys(formData).forEach((key) => {
//       const lowerKey = key.toLowerCase();
//       const lowerSection = sectionName.toLowerCase().replace(/\s+/g, "");

//       if (
//         lowerKey.includes(lowerSection) ||
//         (sectionName === "Personal Info" &&
//           (lowerKey.includes("name") ||
//             lowerKey.includes("email") ||
//             lowerKey.includes("phone") ||
//             lowerKey.includes("location") ||
//             lowerKey.includes("linkedin"))) ||
//         (sectionName === "Professional Summary" &&
//           lowerKey.includes("summary")) ||
//         (sectionName === "Skills" && lowerKey.includes("skill")) ||
//         (sectionName === "Education" && lowerKey.includes("education")) ||
//         (sectionName === "Work Experience" &&
//           (lowerKey.includes("workexperience") ||
//             lowerKey.includes("company") ||
//             (lowerKey.includes("role") && !lowerKey.includes("internship")))) ||
//         (sectionName === "Projects" && lowerKey.includes("project")) ||
//         (sectionName === "Certifications" &&
//           lowerKey.includes("certification")) ||
//         (sectionName === "Achievements" &&
//           lowerKey.includes("achievement")) ||
//         (sectionName === "Volunteering" &&
//           lowerKey.includes("volunteering")) ||
//         (sectionName === "Internships" &&
//           lowerKey.includes("internship")) ||
//         (sectionName === "Awards" && lowerKey.includes("award")) ||
//         (sectionName === "Hobbies" && lowerKey.includes("hobbie")) ||
//         (sectionName === "Interests" && lowerKey.includes("interest")) ||
//         (sectionName === "Languages" && lowerKey.includes("language")) ||
//         (sectionName === "Publications" && lowerKey.includes("publication")) ||
//         (sectionName === "References" &&
//           lowerKey.includes("reference"))
//       ) {
//         fields.push(key);
//       }
//     });

//     return fields;
//   };

//   const isRequiredField = (key: string): boolean => {
//     const lowerKey = key.toLowerCase();
//     const optionalFields = [
//       "linkedin",
//       "portfolio",
//       "currentlyworking",
//       "link",
//       "technologies",
//       "description",
//       "achievement",
//       "category",
//       "proficiencylevel",
//     ];
//     return !optionalFields.some((optional) => lowerKey.includes(optional));
//   };

//   const validateAndShowErrors = (): boolean => {
//     if (!openModalSection) return true;
//     const sectionFields = getSectionFields(openModalSection);
//     let hasEmptyRequiredFields = false;

//     sectionFields.forEach((key) => {
//       const value = formData[key] || "";
//       if (isRequiredField(key)) {
//         if (!value || value.trim() === "") {
//           handleBlur(key, value);
//           hasEmptyRequiredFields = true;
//         }
//       }
//     });

//     return !hasEmptyRequiredFields;
//   };

//   const transformFormDataToBackend = (sectionName: string) => {
//     const sectionFields = getSectionFields(sectionName);
//     const sectionData: Record<string, unknown> = {};

//     sectionFields.forEach((key) => {
//       const value = formData[key];
//       const backendKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
//       sectionData[backendKey] = value;
//     });

//     return sectionData;
//   };

//   const handleSaveForm = async () => {
//     if (!openModalSection) return;
    
//     const sectionFields = getSectionFields(openModalSection);
//     const hasExistingErrors = sectionFields.some((key) => errors[key]);
//     if (hasExistingErrors) {
//       toast.error("Please fix the errors before saving");
//       return;
//     }

//     const isValid = validateAndShowErrors();
//     if (!isValid) {
//       toast.error("Please fill in all required fields");
//       return;
//     }

//     setIsSaving(true);

//     try {
//       let resumeId = localStorage.getItem("current_resume_id");
      
//       console.log("🔍 Resume ID from localStorage:", resumeId);
      
//       if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
//         console.log("⚠️ Invalid resume ID, fetching from backend...");
        
//         const resumes = await getAllResumes();
//         console.log("📊 Available resumes:", resumes);
        
//         if (resumes && resumes.length > 0) {
//           resumeId = resumes[0].id;
//           localStorage.setItem("current_resume_id", resumeId);
//           console.log("✅ Using resume ID:", resumeId);
//         } else {
//           console.log("❌ No resumes found");
//           toast.error("No resume found. Please create a new resume first.");
//           return;
//         }
//       }

//       console.log("🔍 Verifying resume ID exists in backend:", resumeId);
//       const allResumes = await getAllResumes();
//       const resumeExists = allResumes.some(r => r.id === resumeId);
      
//       if (!resumeExists) {
//         console.error("❌ Resume ID not found in backend:", resumeId);
//         console.log("📋 Available resume IDs:", allResumes.map(r => r.id));
        
//         if (allResumes.length > 0) {
//           resumeId = allResumes[0].id;
//           localStorage.setItem("current_resume_id", resumeId);
//           console.log("✅ Switched to existing resume:", resumeId);
//           toast.info("Using your existing resume");
//         } else {
//           toast.error("No resume found. Please create a new resume.");
//           return;
//         }
//       } else {
//         console.log("✅ Resume ID validated successfully");
//       }

//       const sectionData = transformFormDataToBackend(openModalSection);

//       const updatePayload = {
//         [openModalSection.toLowerCase().replace(/\s+/g, "_")]: sectionData,
//       };

//       console.log("📤 Saving section data:", {
//         resumeId,
//         section: openModalSection,
//         payload: updatePayload,
//       });

//       const result = await updateResume(resumeId, updatePayload);
//       console.log("✅ Save successful:", result);

//       setCompletionStatus((prev) => ({
//         ...prev,
//         [openModalSection]: true,
//       }));

//       toast.success(`${openModalSection} saved successfully!`);
//       closeModal();
//     } catch (error) {
//       console.error("❌ Error saving section:", error);
      
//       if (error instanceof Error) {
//         if (error.message.includes("not found")) {
//           toast.error("Resume not found. Please refresh and try again.");
//           localStorage.removeItem("current_resume_id");
//         } else {
//           toast.error(error.message);
//         }
//       } else {
//         toast.error("Failed to save. Please try again.");
//       }
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const completionPercentage = getCompletionPercentage();

//   return (
//     <>
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex-1">
//           <h3 className="text-lg font-semibold text-[#2557a7] mb-2">
//             Resume Sections
//           </h3>
//           <p className="text-xs text-gray-800">
//             Complete each section to build a perfect resume
//           </p>
//         </div>
//         <div className="relative">
//           <CircularProgress percentage={completionPercentage} size={54} strokeWidth={4} />
//         </div>
//       </div>

//       {/* ✅ ADD DEBUG BUTTON HERE - TEMPORARY */}
//       <button 
//         onClick={debugResumeId} 
//         className="bg-red-500 text-white p-2 rounded mb-4 text-sm hover:bg-red-600"
//       >
//         🔧 Debug Resume ID
//       </button>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-2 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={openModalSection === s.name}
//                           onToggle={() => handleToggleSection(s.name)}
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                           isComplete={completionStatus[s.name] || false}
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       <AddNewSection />

//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3 flex-1">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                     {s.name}
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   {s.ai && (
//                     <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#efedf2] text-black rounded-full">
//                       <Sparkles size={12} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI
//                     </span>
//                   )}
//                   <div
//                     className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                               bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                               group-hover:from-blue-500 group-hover:to-blue-700 
//                               group-hover:text-white group-hover:scale-110"
//                   >
//                     <Plus size={14} />
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {openModalSection && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-[930px] h-[88vh] relative flex flex-col">
//             <button
//               onClick={closeModal}
//               className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
//               disabled={isSaving}
//             >
//               <X size={20} />
//             </button>

//             <h2 className="text-xl font-semibold text-gray-700 text-center border-b border-gray-200 pb-3">
//               {openModalSection}
//             </h2>

//             <div className="flex-1 min-h-[75px] px-1 overflow-y-auto">
//               {(() => {
//                 const Component = sectionComponents[openModalSection];
//                 if (!Component) return null;
//                 return (
//                   <Component
//                     formData={formData}
//                     errors={errors}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                   />
//                 );
//               })()}
//             </div>

//             <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end gap-3">
//               <button
//                 onClick={closeModal}
//                 disabled={isSaving}
//                 className="text-[16px] bg-gray-100 text-gray-700 font-semibold rounded-lg min-h-[48px] min-w-[112px] hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveForm}
//                 disabled={isSaving}
//                 className="text-[16px] bg-[#2557a7] font-semibold text-white min-h-[48px] min-w-[112px] rounded-lg hover:bg-[#184284] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {isSaving ? (
//                   <>
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                     <span>Saving...</span>
//                   </>
//                 ) : (
//                   "Save"
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab;



// "use client";
// import React, { useState } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import CircularProgress from "./CircularProgress";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus, Sparkles, X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";
// import { updateResume, getAllResumes, createResumeWithAuth } from "@/api/resumeApi";
// import { toast } from "sonner";
// import { httpClient } from '@/lib/http';


// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
//   onSidebarToggle?: (isOpen: boolean) => void;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   handleDragEnd,
//   completionStatus = {},
//   onSidebarToggle,
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { setSectionOrder, selectedTemplate, setSelectedTemplate, getCompletionPercentage, setCompletionStatus } = useResume();
//   const [openModalSection, setOpenModalSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   // Add this to your EditorTab.tsx temporarily
// const testBackendDirectly = async () => {
//   try {
//     console.log("=== 🧪 BACKEND DEBUG TEST ===");
    
//     // Check localStorage
//     const token = localStorage.getItem("access_token");
//     const email = localStorage.getItem("user_email");
//     const storedId = localStorage.getItem("current_resume_id");
    
//     console.log("📋 LocalStorage Check:");
//     console.log("  Email:", email);
//     console.log("  Has Token:", !!token);
//     console.log("  Stored Resume ID:", storedId);
    
//     // Test getAllResumes
//     console.log("\n📥 Testing getAllResumes()...");
//     const resumes = await getAllResumes();
    
//     console.log("✅ Result:", {
//       count: resumes.length,
//       resumes: resumes
//     });
    
//     if (resumes.length > 0) {
//       const firstResume = resumes[0];
//       console.log("\n🔍 First Resume Details:");
//       console.log("  ID:", firstResume.id);
//       console.log("  All Keys:", Object.keys(firstResume));
//       console.log("  Full Object:", firstResume);
      
//       if (firstResume.id) {
//         localStorage.setItem("current_resume_id", firstResume.id);
//         toast.success(`✅ Resume ID found and saved: ${firstResume.id}`);
//         console.log("💾 Resume ID saved to localStorage");
//       } else {
//         toast.error("❌ Resume object has no 'id' field");
//         console.error("❌ No ID field found");
//       }
//     } else {
//       toast.warning("⚠️ No resumes returned from backend");
//       console.warn("⚠️ Empty array returned");
//     }
    
//     console.log("=== END DEBUG TEST ===\n");
    
//   } catch (err) {
//     console.error("❌ Test failed with error:", err);
//     if (err instanceof Error) {
//       toast.error(`Error: ${err.message}`);
//     }
//   }
// };



//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   const closeModal = () => {
//     setOpenModalSection(null);
//   };

//   const handleToggleSection = (sectionName: string) => {
//     if (!selectedTemplate) {
//       setSelectedTemplate(1);
//       if (onSidebarToggle) {
//         onSidebarToggle(false);
//       }
//     }

//     setOpenModalSection(
//       openModalSection === sectionName ? null : sectionName
//     );
//   };

//   const getSectionFields = (sectionName: string): string[] => {
//     const fields: string[] = [];

//     Object.keys(formData).forEach((key) => {
//       const lowerKey = key.toLowerCase();
//       const lowerSection = sectionName.toLowerCase().replace(/\s+/g, "");

//       if (
//         lowerKey.includes(lowerSection) ||
//         (sectionName === "Personal Info" &&
//           (lowerKey.includes("name") ||
//             lowerKey.includes("email") ||
//             lowerKey.includes("phone") ||
//             lowerKey.includes("location") ||
//             lowerKey.includes("linkedin"))) ||
//         (sectionName === "Professional Summary" &&
//           lowerKey.includes("summary")) ||
//         (sectionName === "Skills" && lowerKey.includes("skill")) ||
//         (sectionName === "Education" && lowerKey.includes("education")) ||
//         (sectionName === "Work Experience" &&
//           (lowerKey.includes("workexperience") ||
//             lowerKey.includes("company") ||
//             (lowerKey.includes("role") && !lowerKey.includes("internship")))) ||
//         (sectionName === "Projects" && lowerKey.includes("project")) ||
//         (sectionName === "Certifications" &&
//           lowerKey.includes("certification")) ||
//         (sectionName === "Achievements" &&
//           lowerKey.includes("achievement")) ||
//         (sectionName === "Volunteering" &&
//           lowerKey.includes("volunteering")) ||
//         (sectionName === "Internships" &&
//           lowerKey.includes("internship")) ||
//         (sectionName === "Awards" && lowerKey.includes("award")) ||
//         (sectionName === "Hobbies" && lowerKey.includes("hobbie")) ||
//         (sectionName === "Interests" && lowerKey.includes("interest")) ||
//         (sectionName === "Languages" && lowerKey.includes("language")) ||
//         (sectionName === "Publications" && lowerKey.includes("publication")) ||
//         (sectionName === "References" &&
//           lowerKey.includes("reference"))
//       ) {
//         fields.push(key);
//       }
//     });

//     return fields;
//   };

//   const isRequiredField = (key: string): boolean => {
//     const lowerKey = key.toLowerCase();
//     const optionalFields = [
//       "linkedin",
//       "portfolio",
//       "currentlyworking",
//       "link",
//       "technologies",
//       "description",
//       "achievement",
//       "category",
//       "proficiencylevel",
//     ];
//     return !optionalFields.some((optional) => lowerKey.includes(optional));
//   };

//   const validateAndShowErrors = (): boolean => {
//     if (!openModalSection) return true;
//     const sectionFields = getSectionFields(openModalSection);
//     let hasEmptyRequiredFields = false;

//     sectionFields.forEach((key) => {
//       const value = formData[key] || "";
//       if (isRequiredField(key)) {
//         if (!value || value.trim() === "") {
//           handleBlur(key, value);
//           hasEmptyRequiredFields = true;
//         }
//       }
//     });

//     return !hasEmptyRequiredFields;
//   };

//   const transformFormDataToBackend = (sectionName: string) => {
//     const sectionFields = getSectionFields(sectionName);
//     const sectionData: Record<string, unknown> = {};

//     sectionFields.forEach((key) => {
//       const value = formData[key];
//       const backendKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
//       sectionData[backendKey] = value;
//     });

//     return sectionData;
//   };

//   // const handleSaveForm = async () => {
//   //   if (!openModalSection) return;
    
//   //   const sectionFields = getSectionFields(openModalSection);
//   //   const hasExistingErrors = sectionFields.some((key) => errors[key]);
//   //   if (hasExistingErrors) {
//   //     toast.error("Please fix the errors before saving");
//   //     return;
//   //   }

//   //   const isValid = validateAndShowErrors();
//   //   if (!isValid) {
//   //     toast.error("Please fill in all required fields");
//   //     return;
//   //   }

//   //   setIsSaving(true);

//   //   try {
//   //     let resumeId = localStorage.getItem("current_resume_id");
      
//   //     console.log("🔍 Initial Resume ID:", resumeId);
      
//   //     // ✅ FIXED: Fetch resumes first to ensure we have the correct ID
//   //     const resumes = await getAllResumes();
//   //     console.log("📊 Available resumes:", resumes);
      
//   //     if (!resumes || resumes.length === 0) {
//   //       console.error("❌ No resumes found in backend");
//   //       toast.error("No resume found. Please create a new resume first.");
//   //       setIsSaving(false);
//   //       return;
//   //     }

//   //     // ✅ FIXED: Always use the first resume from backend as source of truth
//   //     const validResumeId = resumes[0].id;
      
//   //     // ✅ Update localStorage if it doesn't match
//   //     if (resumeId !== validResumeId) {
//   //       console.log("🔄 Updating resume ID from", resumeId, "to", validResumeId);
//   //       localStorage.setItem("current_resume_id", validResumeId);
//   //       resumeId = validResumeId;
//   //     }

//   //     console.log("✅ Using resume ID:", resumeId);

//   //     const sectionData = transformFormDataToBackend(openModalSection);

//   //     const updatePayload = {
//   //       [openModalSection.toLowerCase().replace(/\s+/g, "_")]: sectionData,
//   //     };

//   //     console.log("📤 Saving section data:", {
//   //       resumeId,
//   //       section: openModalSection,
//   //       payload: updatePayload,
//   //     });

//   //     const result = await updateResume(resumeId, updatePayload);
//   //     console.log("✅ Save successful:", result);

//   //     setCompletionStatus((prev) => ({
//   //       ...prev,
//   //       [openModalSection]: true,
//   //     }));

//   //     toast.success(`${openModalSection} saved successfully!`);
//   //     closeModal();
//   //   } catch (error) {
//   //     console.error("❌ Error saving section:", error);
      
//   //     if (error instanceof Error) {
//   //       if (error.message.includes("not found") || error.message.includes("404")) {
//   //         toast.error("Resume not found. Please refresh the page and try again.");
//   //         localStorage.removeItem("current_resume_id");
//   //       } else {
//   //         toast.error(error.message || "Failed to save. Please try again.");
//   //       }
//   //     } else {
//   //       toast.error("Failed to save. Please try again.");
//   //     }
//   //   } finally {
//   //     setIsSaving(false);
//   //   }
//   // };
//   const handleSaveForm = async () => {
//   if (!openModalSection) return;
  
//   const sectionFields = getSectionFields(openModalSection);
//   const hasExistingErrors = sectionFields.some((key) => errors[key]);
//   if (hasExistingErrors) {
//     toast.error("Please fix the errors before saving");
//     return;
//   }

//   const isValid = validateAndShowErrors();
//   if (!isValid) {
//     toast.error("Please fill in all required fields");
//     return;
//   }

//   setIsSaving(true);

//   try {
//     console.log("🚀 Starting save process...");
    
//     // ✅ STEP 1: Try to get existing resume ID from localStorage first
//     let resumeId = localStorage.getItem("current_resume_id");
//     console.log("💾 localStorage resume ID:", resumeId);
    
//     // ✅ STEP 2: If we have a stored ID, try to use it directly
//     if (resumeId && resumeId !== 'null' && resumeId !== 'undefined') {
//       console.log("✅ Using stored resume ID:", resumeId);
      
//       // Try to save with this ID
//       try {
//         const sectionData = transformFormDataToBackend(openModalSection);
//         const updatePayload = {
//           [openModalSection.toLowerCase().replace(/\s+/g, "_")]: sectionData,
//         };

//         console.log("📤 Attempting save with stored ID:", {
//           resumeId,
//           section: openModalSection,
//           payload: updatePayload,
//         });

//         const result = await updateResume(resumeId, updatePayload);
//         console.log("✅ Save successful:", result);

//         setCompletionStatus((prev) => ({
//           ...prev,
//           [openModalSection]: true,
//         }));

//         toast.success(`${openModalSection} saved successfully!`);
//         closeModal();
//         return; // Exit early on success
        
//       } catch (updateError) {
//         console.log("⚠️ Failed to update with stored ID, will try to fetch resumes...");
//         // Continue to fetch resumes below
//       }
//     }
    
//     // ✅ STEP 3: Fetch all resumes from backend
//     console.log("📥 Fetching resumes from backend...");
//     let resumes = await getAllResumes();
//     console.log("📊 Resumes fetched:", resumes);
    
//     // ✅ STEP 4: If resumes exist, use the first one
//     if (resumes && resumes.length > 0) {
//       resumeId = resumes[0].id;
//       console.log("✅ Using existing resume from backend:", resumeId);
//       localStorage.setItem("current_resume_id", resumeId);
      
//     } else {
//       // ✅ STEP 5: No resumes found, create one
//       console.log("⚠️ No resumes found - attempting to create new resume...");
//       toast.info("Creating your resume...");
      
//       try {
//         const newResume = await createResumeWithAuth();
//         resumeId = newResume.id;
//         console.log("✅ New resume created:", resumeId);
        
//       } catch (createError) {
//         console.error("❌ Failed to create resume:", createError);
        
//         // ✅ Handle specific error cases
//         if (createError instanceof Error) {
//           if (createError.message === "RESUME_EXISTS") {
//             // Resume exists but wasn't returned by getAllResumes
//             console.log("⚠️ Resume exists, retrying fetch...");
//             toast.info("Resume found, trying again...");
            
//             // Wait a bit and retry
//             await new Promise(resolve => setTimeout(resolve, 1000));
//             resumes = await getAllResumes();
            
//             if (resumes && resumes.length > 0) {
//               resumeId = resumes[0].id;
//               localStorage.setItem("current_resume_id", resumeId);
//             } else {
//               throw new Error("Resume exists but could not be retrieved. Please refresh the page.");
//             }
//           } else {
//             throw createError;
//           }
//         } else {
//           throw new Error("Could not create resume. Please refresh the page and try again.");
//         }
//       }
//     }

//     // ✅ STEP 6: Save the data
//     const sectionData = transformFormDataToBackend(openModalSection);
//     const updatePayload = {
//       [openModalSection.toLowerCase().replace(/\s+/g, "_")]: sectionData,
//     };

//     console.log("📤 Saving section data:", {
//       resumeId,
//       section: openModalSection,
//       payload: updatePayload,
//     });

//     const result = await updateResume(resumeId, updatePayload);
//     console.log("✅ Save successful:", result);

//     setCompletionStatus((prev) => ({
//       ...prev,
//       [openModalSection]: true,
//     }));

//     toast.success(`${openModalSection} saved successfully!`);
//     closeModal();
    
//   } catch (error) {
//     console.error("❌ Error saving section:", error);
    
//     if (error instanceof Error) {
//       toast.error(error.message || "Failed to save. Please refresh the page and try again.");
//     } else {
//       toast.error("Failed to save. Please refresh the page and try again.");
//     }
//   } finally {
//     setIsSaving(false);
//   }
// };


//   const completionPercentage = getCompletionPercentage();

//   return (
//     <>
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex-1">
//           <h3 className="text-lg font-semibold text-[#2557a7] mb-2">
//             Resume Sections
//           </h3>
//           <p className="text-xs text-gray-800">
//             Complete each section to build a perfect resume
//           </p>
//         </div>
//         <div className="relative">
//           <CircularProgress percentage={completionPercentage} size={54} strokeWidth={4} />
//         </div>
//       </div>

  
// <button 
//   onClick={testBackendDirectly}
//   className="bg-purple-500 text-white px-3 py-1 rounded text-xs mb-2"
// >
//   🧪 Test Backend Response
// </button>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-2 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={openModalSection === s.name}
//                           onToggle={() => handleToggleSection(s.name)}
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                           isComplete={completionStatus[s.name] || false}
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       <AddNewSection />

//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3 flex-1">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                     {s.name}
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   {s.ai && (
//                     <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#efedf2] text-black rounded-full">
//                       <Sparkles size={12} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI
//                     </span>
//                   )}
//                   <div
//                     className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                               bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                               group-hover:from-blue-500 group-hover:to-blue-700 
//                               group-hover:text-white group-hover:scale-110"
//                   >
//                     <Plus size={14} />
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {openModalSection && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-[930px] h-[88vh] relative flex flex-col">
//             <button
//               onClick={closeModal}
//               className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
//               disabled={isSaving}
//             >
//               <X size={20} />
//             </button>

//             <h2 className="text-xl font-semibold text-gray-700 text-center border-b border-gray-200 pb-3">
//               {openModalSection}
//             </h2>

//             <div className="flex-1 min-h-[75px] px-1 overflow-y-auto">
//               {(() => {
//                 const Component = sectionComponents[openModalSection];
//                 if (!Component) return null;
//                 return (
//                   <Component
//                     formData={formData}
//                     errors={errors}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                   />
//                 );
//               })()}
//             </div>

//             <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end gap-3">
//               <button
//                 onClick={closeModal}
//                 disabled={isSaving}
//                 className="text-[16px] bg-gray-100 text-gray-700 font-semibold rounded-lg min-h-[48px] min-w-[112px] hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveForm}
//                 disabled={isSaving}
//                 className="text-[16px] bg-[#2557a7] font-semibold text-white min-h-[48px] min-w-[112px] rounded-lg hover:bg-[#184284] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {isSaving ? (
//                   <>
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                     <span>Saving...</span>
//                   </>
//                 ) : (
//                   "Save"
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab;


// "use client";
// import React, { useState, useEffect, useCallback,useRef } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   DropResult,
//   DroppableProvided,
//   DraggableProvided,
//   DraggableStateSnapshot,
// } from "@hello-pangea/dnd";
// import SectionItem from "./SectionItem";
// import AddNewSection from "./AddNewSection";
// import CircularProgress from "./CircularProgress";
// import { sectionIcons } from "../../_utils/sectionsConfig";
// import { Plus, Sparkles, X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";
// import { updateResume, getAllResumes, autoSaveResume } from "@/api/resumeApi";
// import { toast } from "sonner";
// import debounce from "lodash.debounce";

// interface SectionComponentProps {
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   onChange: (key: string, value: string) => void;
//   onBlur: (key: string, value: string) => void;
// }

// interface Props {
//   sections: { name: string; ai: boolean }[];
//   extraSections: { name: string; ai: boolean }[];
//   activeSection: number | null;
//   formData: Record<string, string>;
//   errors: Record<string, string>;
//   sectionComponents: Record<string, React.FC<SectionComponentProps>>;
//   handleDeleteSection: (index: number) => void;
//   handleAddSection: (section: { name: string; ai: boolean }) => void;
//   handleChange: (key: string, value: string) => void;
//   handleBlur: (key: string, value: string) => void;
//   setActiveSection: (index: number | null) => void;
//   handleDragEnd: (result: DropResult) => void;
//   completionStatus: Record<string, boolean>;
//   onSidebarToggle?: (isOpen: boolean) => void;
// }

// const EditorTab: React.FC<Props> = ({
//   sections,
//   extraSections,
//   activeSection,
//   formData,
//   errors,
//   sectionComponents,
//   handleDeleteSection,
//   handleAddSection,
//   handleChange,
//   handleBlur,
//   handleDragEnd,
//   completionStatus = {},
//   onSidebarToggle,
// }) => {
//   const nonDeletableSections = [
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//   ];

//   const { 
//     setSectionOrder, 
//     selectedTemplate, 
//     setSelectedTemplate, 
//     getCompletionPercentage, 
//     setCompletionStatus 
//   } = useResume();
  
//   const [openModalSection, setOpenModalSection] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isAutoSaving, setIsAutoSaving] = useState(false); // ✅ Track auto-save status
//   const [lastSaved, setLastSaved] = useState<Date | null>(null);
//   const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  

//   // ✅ Validate resume ID on page load
//   useEffect(() => {
//     const validateResumeId = async () => {
//       const storedId = localStorage.getItem("current_resume_id");
      
//       console.log("🔍 Validating resume ID on page load:", storedId);
      
//       if (!storedId || storedId === 'null' || storedId === 'undefined') {
//         console.error("❌ No valid resume ID found");
//         toast.error("Resume ID missing. Redirecting to dashboard...", { 
//           duration: 3000 
//         });
        
//         setTimeout(() => {
//           window.location.href = "/dashboard/resume";
//         }, 2000);
        
//         return;
//       }
      
//       // ✅ Verify the ID exists in backend
//       try {
//         const resumes = await getAllResumes();
//         const exists = resumes.some(r => r.id === storedId);
        
//         if (!exists) {
//           console.error("❌ Stored ID doesn't exist in backend");
//           console.error("❌ Stored ID:", storedId);
//           console.error("❌ Available IDs:", resumes.map(r => r.id));
          
//           toast.warning("Resume ID mismatch. Using latest resume...");
          
//           if (resumes.length > 0) {
//             const newId = resumes[0].id;
//             localStorage.setItem("current_resume_id", newId);
//             console.log("💾 Updated to new ID:", newId);
//             toast.success(`Switched to resume: ${newId.substring(0, 8)}...`);
//           } else {
//             toast.error("No resumes found. Redirecting...");
//             setTimeout(() => {
//               window.location.href = "/dashboard/resume";
//             }, 2000);
//           }
//         } else {
//           console.log("✅ Resume ID validated successfully");
//         }
//       } catch (err) {
//         console.error("❌ Failed to validate resume ID:", err);
//         // Don't redirect on validation error, user can still try to save
//       }
//     };
    
//     validateResumeId();
//   }, []); // Run once on mount

//   // ✅ Debug function to verify resume exists
//   const verifyResumeExists = async () => {
//     try {
//       const storedId = localStorage.getItem("current_resume_id");
//       console.log("🔍 Stored ID:", storedId);
      
//       if (!storedId) {
//         toast.error("No resume ID stored");
//         return;
//       }
      
//       // Try to fetch all resumes
//       const resumes = await getAllResumes();
//       console.log("📊 All resumes:", resumes);
      
//       // Check if stored ID exists in fetched resumes
//       const matchingResume = resumes.find(r => r.id === storedId);
      
//       if (matchingResume) {
//         toast.success(`✅ Resume found: ${storedId.substring(0, 12)}...`);
//         console.log("✅ Matching resume:", matchingResume);
//       } else {
//         toast.error(`❌ Stored ID "${storedId}" not found in backend`);
//         console.error("❌ Available IDs:", resumes.map(r => r.id));
        
//         // If we have resumes, use the first one
//         if (resumes.length > 0) {
//           const newId = resumes[0].id;
//           localStorage.setItem("current_resume_id", newId);
//           toast.info(`Updated to: ${newId.substring(0, 12)}...`);
//           console.log("💾 Updated to:", newId);
//         }
//       }
      
//     } catch (err) {
//       console.error("❌ Verification failed:", err);
//       toast.error("Failed to verify resume");
//     }
//   };

//   // ✅ Debug function to test backend
//   const testBackendDirectly = async () => {
//     try {
//       console.log("=== 🧪 BACKEND DEBUG TEST ===");
      
//       const token = localStorage.getItem("access_token");
//       const email = localStorage.getItem("user_email");
//       const storedId = localStorage.getItem("current_resume_id");
      
//       console.log("📋 LocalStorage Check:");
//       console.log("  Email:", email);
//       console.log("  Has Token:", !!token);
//       console.log("  Stored Resume ID:", storedId);
      
//       console.log("\n📥 Testing getAllResumes()...");
//       const resumes = await getAllResumes();
      
//       console.log("✅ Result:", {
//         count: resumes.length,
//         resumes: resumes
//       });
      
//       if (resumes.length > 0) {
//         const firstResume = resumes[0];
//         console.log("\n🔍 First Resume Details:");
//         console.log("  ID:", firstResume.id);
//         console.log("  All Keys:", Object.keys(firstResume));
//         console.log("  Full Object:", firstResume);
        
//         if (firstResume.id) {
//           localStorage.setItem("current_resume_id", firstResume.id);
//           toast.success(`✅ Resume ID: ${firstResume.id.substring(0, 12)}...`);
//           console.log("💾 Resume ID saved to localStorage");
//         } else {
//           toast.error("❌ Resume object has no 'id' field");
//           console.error("❌ No ID field found");
//         }
//       } else {
//         toast.warning("⚠️ No resumes returned from backend");
//         console.warn("⚠️ Empty array returned");
//       }
      
//       console.log("=== END DEBUG TEST ===\n");
      
//     } catch (err) {
//       console.error("❌ Test failed with error:", err);
//       if (err instanceof Error) {
//         toast.error(`Error: ${err.message}`);
//       }
//     }
//   };

//   const onDragEnd = (result: DropResult) => {
//     handleDragEnd(result);
//     if (!result.destination) return;
//     const reordered = Array.from(sections);
//     const [removed] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, removed);
//     setSectionOrder(reordered.map((s) => s.name));
//   };

//   const visibleSections =
//     activeSection !== null
//       ? sections.filter((_, idx) => idx === activeSection)
//       : sections;

//   const closeModal = () => {
//     setOpenModalSection(null);
//   };

//   const handleToggleSection = (sectionName: string) => {
//     if (!selectedTemplate) {
//       setSelectedTemplate(1);
//       if (onSidebarToggle) {
//         onSidebarToggle(false);
//       }
//     }

//     setOpenModalSection(
//       openModalSection === sectionName ? null : sectionName
//     );
//   };

//   const getSectionFields = (sectionName: string): string[] => {
//     const fields: string[] = [];

//     Object.keys(formData).forEach((key) => {
//       const lowerKey = key.toLowerCase();
//       const lowerSection = sectionName.toLowerCase().replace(/\s+/g, "");

//       if (
//         lowerKey.includes(lowerSection) ||
//         (sectionName === "Personal Info" &&
//           (lowerKey.includes("name") ||
//             lowerKey.includes("email") ||
//             lowerKey.includes("phone") ||
//             lowerKey.includes("location") ||
//             lowerKey.includes("linkedin"))) ||
//         (sectionName === "Professional Summary" &&
//           lowerKey.includes("summary")) ||
//         (sectionName === "Skills" && lowerKey.includes("skill")) ||
//         (sectionName === "Education" && lowerKey.includes("education")) ||
//         (sectionName === "Work Experience" &&
//           (lowerKey.includes("workexperience") ||
//             lowerKey.includes("company") ||
//             (lowerKey.includes("role") && !lowerKey.includes("internship")))) ||
//         (sectionName === "Projects" && lowerKey.includes("project")) ||
//         (sectionName === "Certifications" &&
//           lowerKey.includes("certification")) ||
//         (sectionName === "Achievements" &&
//           lowerKey.includes("achievement")) ||
//         (sectionName === "Volunteering" &&
//           lowerKey.includes("volunteering")) ||
//         (sectionName === "Internships" &&
//           lowerKey.includes("internship")) ||
//         (sectionName === "Awards" && lowerKey.includes("award")) ||
//         (sectionName === "Hobbies" && lowerKey.includes("hobbie")) ||
//         (sectionName === "Interests" && lowerKey.includes("interest")) ||
//         (sectionName === "Languages" && lowerKey.includes("language")) ||
//         (sectionName === "Publications" && lowerKey.includes("publication")) ||
//         (sectionName === "References" &&
//           lowerKey.includes("reference"))
//       ) {
//         fields.push(key);
//       }
//     });

//     return fields;
//   };

//   // ✅ Auto-save function with debounce
//   // const autoSave = useCallback(
//   //   debounce(async (currentFormData: Record<string, string>, sectionName: string) => {
//   //     const resumeId = localStorage.getItem("current_resume_id");
      
//   //     if (!resumeId || !sectionName) return;
      
//   //     try {
//   //       setIsAutoSaving(true);
//   //       console.log("💾 Auto-saving:", sectionName);
        
//   //       // Transform data
//   //       const sectionData = transformFormDataToBackend(sectionName);
        
//   //       const sectionKeyMap: Record<string, string> = {
//   //         "Personal Info": "personalInfo",
//   //         "Professional Summary": "professionalSummary",
//   //         "Skills": "skills",
//   //         "Education": "education",
//   //         "Work Experience": "workExperience",
//   //         "Projects": "projects",
//   //         "Certifications": "certifications",
//   //         "Achievements": "achievements",
//   //         "Volunteering": "volunteering",
//   //         "Internships": "internships",
//   //         "Awards": "awards",
//   //         "Hobbies": "hobbies",
//   //         "Interests": "interests",
//   //         "Languages": "languages",
//   //         "Publications": "publications",
//   //         "References": "references",
//   //       };
        
//   //       const backendKey = sectionKeyMap[sectionName] || sectionName.toLowerCase().replace(/\s+/g, "_");
        
//   //       const updatePayload = {
//   //         [backendKey]: sectionData,
//   //       };
        
//   //       // Use autosave endpoint
//   //       await autoSaveResume(resumeId, updatePayload);
        
//   //       setLastSaved(new Date());
//   //       console.log("✅ Auto-saved successfully");
        
//   //     } catch (error) {
//   //       console.error("❌ Auto-save failed:", error);
//   //     } finally {
//   //       setIsAutoSaving(false);
//   //     }
//   //   }, 2000), // Auto-save after 2 seconds of inactivity
//   //   []
//   // );

//   // // ✅ Trigger auto-save when formData changes
//   // useEffect(() => {
//   //   if (openModalSection && formData) {
//   //     autoSave(formData, openModalSection);
//   //   }
    
//   //   // Cleanup
//   //   return () => {
//   //     autoSave.cancel();
//   //   };
//   // }, [formData, openModalSection, autoSave]);
//     // ✅ Auto-save function (simplified without lodash)
//   const triggerAutoSave = useCallback(async (sectionName: string, currentFormData: Record<string, string>) => {
//     // Clear previous timer
//     if (autoSaveTimerRef.current) {
//       clearTimeout(autoSaveTimerRef.current);
//     }

//     // Set new timer
//     autoSaveTimerRef.current = setTimeout(async () => {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId || !sectionName || resumeId === 'null' || resumeId === 'undefined') {
//         console.log("⏸️ Skipping auto-save: No valid resume ID");
//         return;
//       }
      
//       try {
//         setIsAutoSaving(true);
//         console.log("💾 Auto-saving:", sectionName);
        
//         // Transform data
//         const sectionData = transformFormDataToBackend(sectionName);
        
//         // Map section names to backend keys
//         const sectionKeyMap: Record<string, string> = {
//           "Personal Info": "personalInfo",
//           "Professional Summary": "professionalSummary",
//           "Skills": "skills",
//           "Education": "education",
//           "Work Experience": "workExperience",
//           "Projects": "projects",
//           "Certifications": "certifications",
//           "Achievements": "achievements",
//           "Volunteering": "volunteering",
//           "Internships": "internships",
//           "Awards": "awards",
//           "Hobbies": "hobbies",
//           "Interests": "interests",
//           "Languages": "languages",
//           "Publications": "publications",
//           "References": "references",
//         };
        
//         const backendKey = sectionKeyMap[sectionName] || sectionName.toLowerCase().replace(/\s+/g, "_");
        
//         const updatePayload = {
//           [backendKey]: sectionData,
//         };
        
//         console.log("📤 Auto-save payload:", updatePayload);
        
//         // Use autosave endpoint
//         await autoSaveResume(resumeId, updatePayload);
        
//         setLastSaved(new Date());
//         console.log("✅ Auto-saved successfully");
        
//       } catch (error) {
//         console.error("❌ Auto-save failed:", error);
//         // Don't show error toast for auto-save failures
//       } finally {
//         setIsAutoSaving(false);
//       }
//     }, 3000); // 3 seconds delay
//   }, []);

//   // ✅ Trigger auto-save when formData changes
//   useEffect(() => {
//     if (openModalSection && formData) {
//       triggerAutoSave(openModalSection, formData);
//     }
//   }, [formData, openModalSection, triggerAutoSave]);

//   // ✅ Cleanup timer on unmount
//   useEffect(() => {
//     return () => {
//       if (autoSaveTimerRef.current) {
//         clearTimeout(autoSaveTimerRef.current);
//       }
//     };
//   }, []);

//   const isRequiredField = (key: string): boolean => {
//     const lowerKey = key.toLowerCase();
//     const optionalFields = [
//       "linkedin",
//       "portfolio",
//       "currentlyworking",
//       "link",
//       "technologies",
//       "description",
//       "achievement",
//       "category",
//       "proficiencylevel",
//     ];
//     return !optionalFields.some((optional) => lowerKey.includes(optional));
//   };

//   const validateAndShowErrors = (): boolean => {
//     if (!openModalSection) return true;
//     const sectionFields = getSectionFields(openModalSection);
//     let hasEmptyRequiredFields = false;

//     sectionFields.forEach((key) => {
//       const value = formData[key] || "";
//       if (isRequiredField(key)) {
//         if (!value || value.trim() === "") {
//           handleBlur(key, value);
//           hasEmptyRequiredFields = true;
//         }
//       }
//     });

//     return !hasEmptyRequiredFields;
//   };

//   const transformFormDataToBackend = (sectionName: string) => {
//   const sectionFields = getSectionFields(sectionName);
  
//   console.log("🔄 Transforming section:", sectionName);
//   console.log("📋 Section fields:", sectionFields);
  
//   // ✅ Handle different section types
  
//   // 1. Professional Summary - Should be a STRING
//   if (sectionName === "Professional Summary") {
//     const summaryValue = formData["professionalSummary"] || formData["summary"] || "";
//     console.log("📝 Professional Summary value:", summaryValue);
//     return summaryValue; // Return string directly, not object
//   }
  
//   // 2. Skills - Should be an ARRAY of strings
//   if (sectionName === "Skills") {
//     const skillsValue = formData["skills"];
//     if (typeof skillsValue === 'string') {
//       // If comma-separated string, split into array
//       return skillsValue.split(',').map(s => s.trim()).filter(s => s);
//     }
//     if (Array.isArray(skillsValue)) {
//       return skillsValue;
//     }
//     return [];
//   }
  
//   // 3. Personal Info - Should be an OBJECT
//   if (sectionName === "Personal Info") {
//     return {
//       name: formData["name"] || "",
//       email: formData["email"] || "",
//       phone: formData["phone"] || "",
//       location: formData["location"] || "",
//       linkedinurl: formData["linkedinurl"] || "",
//       portifoliourl: formData["portifoliourl"] || "",
//     };
//   }
  
//   // 4. Education - Should be an ARRAY of objects
//   if (sectionName === "Education") {
//     const educationArray: any[] = [];
//     let index = 0;
    
//     // Look for education items by index
//     while (formData[`education_${index}_school`]) {
//       educationArray.push({
//         school: formData[`education_${index}_school`] || "",
//         degree: formData[`education_${index}_degree`] || "",
//         startDate: formData[`education_${index}_startDate`] || "",
//         endDate: formData[`education_${index}_endDate`] || "",
//       });
//       index++;
//     }
    
//     console.log("🎓 Education array:", educationArray);
//     return educationArray.length > 0 ? educationArray : [];
//   }
  
//   // 5. Work Experience - Should be an ARRAY of objects
//   if (sectionName === "Work Experience") {
//     const workArray: any[] = [];
//     let index = 0;
    
//     while (formData[`workExperience_${index}_company`]) {
//       workArray.push({
//         company: formData[`workExperience_${index}_company`] || "",
//         role: formData[`workExperience_${index}_role`] || "",
//         location: formData[`workExperience_${index}_location`] || "",
//         startDate: formData[`workExperience_${index}_startDate`] || "",
//         endDate: formData[`workExperience_${index}_endDate`] || "",
//         currentlyWorking: formData[`workExperience_${index}_currentlyWorking`] === "true",
//         description: formData[`workExperience_${index}_description`] || "",
//       });
//       index++;
//     }
    
//     console.log("💼 Work Experience array:", workArray);
//     return workArray.length > 0 ? workArray : [];
//   }
  
//   // 6. Projects - Should be an ARRAY of objects
//   if (sectionName === "Projects") {
//     const projectsArray: any[] = [];
//     let index = 0;
    
//     while (formData[`project_${index}_title`]) {
//       const technologies = formData[`project_${index}_technologies`];
//       projectsArray.push({
//         title: formData[`project_${index}_title`] || "",
//         description: formData[`project_${index}_description`] || "",
//         technologies: typeof technologies === 'string' 
//           ? technologies.split(',').map(t => t.trim()).filter(t => t)
//           : (Array.isArray(technologies) ? technologies : []),
//         startDate: formData[`project_${index}_startDate`] || "",
//         endDate: formData[`project_${index}_endDate`] || "",
//         link: formData[`project_${index}_link`] || "",
//       });
//       index++;
//     }
    
//     console.log("🚀 Projects array:", projectsArray);
//     return projectsArray.length > 0 ? projectsArray : [];
//   }
  
//   // 7. Certifications - Should be an ARRAY of objects
//   if (sectionName === "Certifications") {
//     const certsArray: any[] = [];
//     let index = 0;
    
//     while (formData[`certification_${index}_name`]) {
//       certsArray.push({
//         name: formData[`certification_${index}_name`] || "",
//         issuedBy: formData[`certification_${index}_issuedBy`] || "",
//         year: formData[`certification_${index}_year`] || "",
//       });
//       index++;
//     }
    
//     return certsArray.length > 0 ? certsArray : [];
//   }
  
//   // 8. Achievements - Should be an ARRAY of objects
//   if (sectionName === "Achievements") {
//     const achievementsArray: any[] = [];
//     let index = 0;
    
//     while (formData[`achievement_${index}_title`]) {
//       achievementsArray.push({
//         title: formData[`achievement_${index}_title`] || "",
//         date: formData[`achievement_${index}_date`] || "",
//         description: formData[`achievement_${index}_description`] || "",
//       });
//       index++;
//     }
    
//     return achievementsArray.length > 0 ? achievementsArray : [];
//   }
  
//   // 9. Internships - Should be an ARRAY of objects
//   if (sectionName === "Internships") {
//     const internshipsArray: any[] = [];
//     let index = 0;
    
//     while (formData[`internship_${index}_company`]) {
//       internshipsArray.push({
//         company: formData[`internship_${index}_company`] || "",
//         role: formData[`internship_${index}_role`] || "",
//         location: formData[`internship_${index}_location`] || "",
//         startDate: formData[`internship_${index}_startDate`] || "",
//         endDate: formData[`internship_${index}_endDate`] || "",
//         currentlyWorking: formData[`internship_${index}_currentlyWorking`] === "true",
//         description: formData[`internship_${index}_description`] || "",
//       });
//       index++;
//     }
    
//     return internshipsArray.length > 0 ? internshipsArray : [];
//   }
  
//   // 10. Volunteering - Should be an ARRAY of objects
//   if (sectionName === "Volunteering") {
//     const volunteeringArray: any[] = [];
//     let index = 0;
    
//     while (formData[`volunteering_${index}_organization`]) {
//       volunteeringArray.push({
//         organization: formData[`volunteering_${index}_organization`] || "",
//         role: formData[`volunteering_${index}_role`] || "",
//         startDate: formData[`volunteering_${index}_startDate`] || "",
//         endDate: formData[`volunteering_${index}_endDate`] || "",
//       });
//       index++;
//     }
    
//     return volunteeringArray.length > 0 ? volunteeringArray : [];
//   }
  
//   // Default: Return empty object (should not reach here for known sections)
//   console.warn("⚠️ Unknown section:", sectionName);
//   return {};
// };


//   // ✅ SIMPLIFIED SAVE FUNCTION - ONLY UPDATES, NO CREATION
//   // const handleSaveForm = async () => {
//   //   if (!openModalSection) return;
    
//   //   const sectionFields = getSectionFields(openModalSection);
//   //   const hasExistingErrors = sectionFields.some((key) => errors[key]);
    
//   //   if (hasExistingErrors) {
//   //     toast.error("Please fix the errors before saving");
//   //     return;
//   //   }

//   //   const isValid = validateAndShowErrors();
//   //   if (!isValid) {
//   //     toast.error("Please fill in all required fields");
//   //     return;
//   //   }

//   //   setIsSaving(true);

//   //   try {
//   //     // ✅ STEP 1: Get resume ID from localStorage
//   //     const resumeId = localStorage.getItem("current_resume_id");
      
//   //     console.log("💾 Stored resume ID:", resumeId);
      
//   //     // ✅ STEP 2: Validate we have a resume ID
//   //     if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
//   //       console.error("❌ No valid resume ID found");
//   //       toast.error("Resume ID not found. Please refresh the page.", {
//   //         duration: 5000,
//   //       });
        
//   //       // Wait 2 seconds then redirect to dashboard
//   //       setTimeout(() => {
//   //         window.location.href = "/dashboard/resume";
//   //       }, 2000);
        
//   //       return;
//   //     }

//   //     // ✅ STEP 3: Prepare update payload
//   //     const sectionData = transformFormDataToBackend(openModalSection);
//   //     const sectionKey = openModalSection.toLowerCase().replace(/\s+/g, "_");
      
//   //     const updatePayload = {
//   //       [sectionKey]: sectionData,
//   //     };

//   //     console.log("📤 Updating section:", {
//   //       resumeId,
//   //       section: openModalSection,
//   //       sectionKey,
//   //       payload: updatePayload,
//   //     });

//   //     // ✅ STEP 4: Call update API
//   //     const result = await updateResume(resumeId, updatePayload);
      
//   //     console.log("✅ Update successful:", result);

//   //     // ✅ STEP 5: Update completion status
//   //     setCompletionStatus((prev) => ({
//   //       ...prev,
//   //       [openModalSection]: true,
//   //     }));

//   //     toast.success(`${openModalSection} saved successfully!`);
//   //     closeModal();
      
//   //   } catch (error) {
//   //     console.error("❌ Error saving section:", error);
      
//   //     if (error instanceof Error) {
//   //       // ✅ Handle specific 404 error
//   //       if (error.message.includes("not found") || error.message.includes("404")) {
//   //         toast.error(
//   //           "Resume not found. Redirecting to dashboard...",
//   //           { duration: 3000 }
//   //         );
          
//   //         // Clear bad resume ID
//   //         localStorage.removeItem("current_resume_id");
          
//   //         // Redirect after 2 seconds
//   //         setTimeout(() => {
//   //           window.location.href = "/dashboard/resume";
//   //         }, 2000);
          
//   //       } else if (error.message.includes("401") || error.message.includes("sign in")) {
//   //         toast.error("Session expired. Please log in again.");
          
//   //         setTimeout(() => {
//   //           window.location.href = "/signin";
//   //         }, 1500);
          
//   //       } else {
//   //         toast.error(error.message || "Failed to save section");
//   //       }
//   //     } else {
//   //       toast.error("Failed to save section. Please try again.");
//   //     }
//   //   } finally {
//   //     setIsSaving(false);
//   //   }
//   // };
//   const handleSaveForm = async () => {
//   if (!openModalSection) return;
  
//   const sectionFields = getSectionFields(openModalSection);
//   const hasExistingErrors = sectionFields.some((key) => errors[key]);
  
//   if (hasExistingErrors) {
//     toast.error("Please fix the errors before saving");
//     return;
//   }

//   const isValid = validateAndShowErrors();
//   if (!isValid) {
//     toast.error("Please fill in all required fields");
//     return;
//   }

//   setIsSaving(true);

//   try {
//     let resumeId = localStorage.getItem("current_resume_id");
    
//     console.log("💾 Stored resume ID:", resumeId);
    
//     if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
//       console.error("❌ No valid resume ID found");
//       toast.error("Resume ID not found. Please refresh the page.", {
//         duration: 5000,
//       });
      
//       setTimeout(() => {
//         window.location.href = "/dashboard/resume";
//       }, 2000);
      
//       return;
//     }

//     // ✅ STEP 2.5: VERIFY RESUME EXISTS
//     console.log("🔍 Verifying resume exists before update...");
//     try {
//       const allResumes = await getAllResumes();
//       const resumeExists = allResumes.some(r => r.id === resumeId);
      
//       if (!resumeExists) {
//         console.error("❌ Resume ID doesn't exist in backend");
        
//         if (allResumes.length > 0) {
//           resumeId = allResumes[0].id;
//           localStorage.setItem("current_resume_id", resumeId);
//           console.log("✅ Switched to existing resume:", resumeId);
//           toast.info("Switched to your existing resume");
//         } else {
//           throw new Error("No resumes found. Please create a new resume.");
//         }
//       } else {
//         console.log("✅ Resume verified, proceeding with update");
//       }
//     } catch (verifyError) {
//       console.error("❌ Failed to verify resume:", verifyError);
//     }

//     // ✅ STEP 3: Transform data correctly
//     const sectionData = transformFormDataToBackend(openModalSection);
    
//     // ✅ Map section names to backend field names
//     const sectionKeyMap: Record<string, string> = {
//       "Personal Info": "personalInfo",
//       "Professional Summary": "professionalSummary",
//       "Skills": "skills",
//       "Education": "education",
//       "Work Experience": "workExperience",
//       "Projects": "projects",
//       "Certifications": "certifications",
//       "Achievements": "achievements",
//       "Volunteering": "volunteering",
//       "Internships": "internships",
//       "Awards": "awards",
//       "Hobbies": "hobbies",
//       "Interests": "interests",
//       "Languages": "languages",
//       "Publications": "publications",
//       "References": "references",
//     };
    
//     const backendKey = sectionKeyMap[openModalSection] || openModalSection.toLowerCase().replace(/\s+/g, "_");
    
//     const updatePayload = {
//       [backendKey]: sectionData,
//     };

//     console.log("📤 Updating section:", {
//       resumeId,
//       section: openModalSection,
//       backendKey,
//       payload: updatePayload,
//       dataType: typeof sectionData,
//       isArray: Array.isArray(sectionData),
//     });

//     // ✅ STEP 4: Call update API
//     const result = await updateResume(resumeId, updatePayload);
    
//     console.log("✅ Update successful:", result);

//     // ✅ STEP 5: Update completion status
//     setCompletionStatus((prev) => ({
//       ...prev,
//       [openModalSection]: true,
//     }));

//     toast.success(`${openModalSection} saved successfully!`);
//     closeModal();
    
//   } catch (error) {
//     console.error("❌ Error saving section:", error);
    
//     if (error instanceof Error) {
//       if (error.message.includes("not found") || error.message.includes("404")) {
//         toast.error(
//           "Resume not found. Redirecting to dashboard...",
//           { duration: 3000 }
//         );
        
//         localStorage.removeItem("current_resume_id");
        
//         setTimeout(() => {
//           window.location.href = "/dashboard/resume";
//         }, 2000);
        
//       } else if (error.message.includes("401") || error.message.includes("sign in")) {
//         toast.error("Session expired. Please log in again.");
        
//         setTimeout(() => {
//           window.location.href = "/signin";
//         }, 1500);
        
//       } else {
//         toast.error(error.message || "Failed to save section");
//       }
//     } else {
//       toast.error("Failed to save section. Please try again.");
//     }
//   } finally {
//     setIsSaving(false);
//   }
// };


//   const completionPercentage = getCompletionPercentage();

//   return (
//     <>
//       {isAutoSaving && (
//         <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
//           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//           <span className="text-sm">Saving...</span>
//         </div>
//       )}
      
//       {lastSaved && !isAutoSaving && (
//         <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
//           ✓ Saved {new Date(lastSaved).toLocaleTimeString()}
//         </div>
//       )}
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex-1">
//           <h3 className="text-lg font-semibold text-[#2557a7] mb-2">
//             Resume Sections
//           </h3>
//           <p className="text-xs text-gray-800">
//             Complete each section to build a perfect resume
//           </p>
//         </div>
//         <div className="relative">
//           <CircularProgress percentage={completionPercentage} size={54} strokeWidth={4} />
//         </div>
//       </div>

//       <DragDropContext onDragEnd={onDragEnd}>
//         <Droppable droppableId="sections">
//           {(provided: DroppableProvided) => (
//             <div
//               ref={provided.innerRef}
//               {...provided.droppableProps}
//               className="flex flex-col gap-2 p-1 rounded-xl"
//             >
//               {visibleSections.map((s, idx) => {
//                 const originalIndex =
//                   activeSection !== null ? activeSection : idx;
//                 const Icon = sectionIcons[s.name];
//                 const id = `${s.name}-${originalIndex}`;

//                 return (
//                   <Draggable
//                     key={id}
//                     draggableId={id}
//                     index={originalIndex}
//                     isDragDisabled={activeSection !== null}
//                   >
//                     {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
//                       <div
//                         ref={p.innerRef}
//                         {...p.draggableProps}
//                         className={`transition-transform duration-200 ease-in-out ${
//                           snap.isDragging ? "scale-[1.01]" : "scale-100"
//                         }`}
//                       >
//                         <SectionItem
//                           title={s.name}
//                           icon={<Icon size={16} />}
//                           ai={s.ai}
//                           dragHandleProps={p.dragHandleProps}
//                           isDragging={snap.isDragging}
//                           isActive={openModalSection === s.name}
//                           onToggle={() => handleToggleSection(s.name)}
//                           onDelete={() => handleDeleteSection(originalIndex)}
//                           disableDelete={nonDeletableSections.includes(s.name)}
//                           isComplete={completionStatus[s.name] || false}
//                         />
//                       </div>
//                     )}
//                   </Draggable>
//                 );
//               })}
//               {provided.placeholder}
//             </div>
//           )}
//         </Droppable>
//       </DragDropContext>

//       <AddNewSection />

//       {extraSections.length > 0 && (
//         <div className="mt-3 space-y-2 max-h-screen">
//           {extraSections.map((s, i) => {
//             const Icon = sectionIcons[s.name] || (() => <span>★</span>);
//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAddSection(s)}
//                 className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
//               >
//                 <div className="flex items-center gap-3 flex-1">
//                   <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
//                     <Icon size={16} />
//                   </div>
//                   <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
//                     {s.name}
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   {s.ai && (
//                     <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#efedf2] text-black rounded-full">
//                       <Sparkles size={12} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI
//                     </span>
//                   )}
//                   <div
//                     className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
//                               bg-gradient-to-br from-white-50 to-white-500 text-gray-600
//                               group-hover:from-blue-500 group-hover:to-blue-700 
//                               group-hover:text-white group-hover:scale-110"
//                   >
//                     <Plus size={14} />
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {openModalSection && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-[930px] h-[88vh] relative flex flex-col">
//             <button
//               onClick={closeModal}
//               className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition-colors"
//               disabled={isSaving}
//             >
//               <X size={20} />
//             </button>

//             <h2 className="text-xl font-semibold text-gray-700 text-center border-b border-gray-200 pb-3">
//               {openModalSection}
//             </h2>

//             <div className="flex-1 min-h-[75px] px-1 overflow-y-auto">
//               {(() => {
//                 const Component = sectionComponents[openModalSection];
//                 if (!Component) return null;
//                 return (
//                   <Component
//                     formData={formData}
//                     errors={errors}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                   />
//                 );
//               })()}
//             </div>

//             <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end gap-3">
//               <button
//                 onClick={closeModal}
//                 disabled={isSaving}
//                 className="text-[16px] bg-gray-100 text-gray-700 font-semibold rounded-lg min-h-[48px] min-w-[112px] hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveForm}
//                 disabled={isSaving}
//                 className="text-[16px] bg-[#2557a7] font-semibold text-white min-h-[48px] min-w-[112px] rounded-lg hover:bg-[#184284] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {isSaving ? (
//                   <>
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                     <span>Saving...</span>
//                   </>
//                 ) : (
//                   "Save"
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default EditorTab; with erros fine working




"use client";
import React, { useState, useEffect, useCallback,useRef } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import SectionItem from "./SectionItem";
import AddNewSection from "./AddNewSection";
import CircularProgress from "./CircularProgress";
import { sectionIcons } from "../../_utils/sectionsConfig";
import { Plus, Sparkles, X } from "lucide-react";
import { useResume } from "../../_context/ResumeContext";
import { updateResume, getAllResumes, autoSaveResume } from "@/api/resumeApi";
import { toast } from "sonner";


interface SectionComponentProps {
  formData: Record<string, string>;
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onBlur: (key: string, value: string) => void;
}


interface Props {
  sections: { name: string; ai: boolean }[];
  extraSections: { name: string; ai: boolean }[];
  activeSection: number | null;
  formData: Record<string, string>;
  errors: Record<string, string>;
  sectionComponents: Record<string, React.FC<SectionComponentProps>>;
  handleDeleteSection: (index: number) => void;
  handleAddSection: (section: { name: string; ai: boolean }) => void;
  handleChange: (key: string, value: string) => void;
  handleBlur: (key: string, value: string) => void;
  setActiveSection: (index: number | null) => void;
  handleDragEnd: (result: DropResult) => void;
  completionStatus: Record<string, boolean>;
  onSidebarToggle?: (isOpen: boolean) => void;
  clearErrors: (fields?: string[]) => void;
}


const EditorTab: React.FC<Props> = ({
  sections,
  extraSections,
  activeSection,
  formData,
  errors,
  sectionComponents,
  handleDeleteSection,
  handleAddSection,
  handleChange,
  handleBlur,
  handleDragEnd,
  completionStatus = {},
  onSidebarToggle,
  clearErrors,
}) => {
  const nonDeletableSections = [
    "Personal Info",
    "Professional Summary",
    "Skills",
    "Education",
  ];


  const { 
    setSectionOrder, 
    selectedTemplate, 
    setSelectedTemplate, 
    getCompletionPercentage, 
    setCompletionStatus 
  } = useResume();
  
  const [openModalSection, setOpenModalSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  


  useEffect(() => {
    const validateResumeId = async () => {
      const storedId = localStorage.getItem("current_resume_id");
      
      console.log("🔍 Validating resume ID on page load:", storedId);
      
      if (!storedId || storedId === 'null' || storedId === 'undefined') {
        console.error("❌ No valid resume ID found");
        toast.error("Resume ID missing. Redirecting to dashboard...", { 
          duration: 3000 
        });
        
        return;
      }
      
      try {
        const resumes = await getAllResumes();
        const exists = resumes.some(r => r.id === storedId);
        
        if (!exists) {
          console.error("❌ Stored ID doesn't exist in backend");
          console.error("❌ Stored ID:", storedId);
          console.error("❌ Available IDs:", resumes.map(r => r.id));
          
          toast.warning("Resume ID mismatch. Using latest resume...");
          
          if (resumes.length > 0) {
            const newId = resumes[0].id;
            localStorage.setItem("current_resume_id", newId);
            console.log("💾 Updated to new ID:", newId);
            toast.success(`Switched to resume: ${newId.substring(0, 8)}...`);
          } else {
            toast.error("No resumes found. Redirecting...");
          }
        } else {
          console.log("✅ Resume ID validated successfully");
        }
      } catch (err) {
        console.error("❌ Failed to validate resume ID:", err);
      }
    };
    
    validateResumeId();
  }, []);


  const onDragEnd = (result: DropResult) => {
    handleDragEnd(result);
    if (!result.destination) return;
    const reordered = Array.from(sections);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setSectionOrder(reordered.map((s) => s.name));
  };


  const visibleSections =
    activeSection !== null
      ? sections.filter((_, idx) => idx === activeSection)
      : sections;


  const closeModal = () => {
    setOpenModalSection(null);
  };


  const handleToggleSection = (sectionName: string) => {
    if (!selectedTemplate) {
      setSelectedTemplate(1);
      if (onSidebarToggle) {
        onSidebarToggle(false);
      }
    }

    // ✅ Clear errors for the previous section when opening a new one
    if (openModalSection && openModalSection !== sectionName) {
      const previousSectionFields = getSectionFields(openModalSection);
      clearErrors(previousSectionFields);
    }

    setOpenModalSection(
      openModalSection === sectionName ? null : sectionName
    );
  };


  const getSectionFields = (sectionName: string): string[] => {
    const fields: string[] = [];


    Object.keys(formData).forEach((key) => {
      const lowerKey = key.toLowerCase();
      const lowerSection = sectionName.toLowerCase().replace(/\s+/g, "");


      if (
        lowerKey.includes(lowerSection) ||
        (sectionName === "Personal Info" &&
          (lowerKey.includes("fullname") ||
            lowerKey.includes("email") ||
            lowerKey.includes("phone") ||
            lowerKey.includes("location") ||
            lowerKey.includes("linkedinUrl")) ||
            lowerKey.includes("portifolioUrl")) ||
        (sectionName === "Professional Summary" &&
          lowerKey.includes("summary")) ||
        (sectionName === "Skills" && lowerKey.includes("skill")) ||
        (sectionName === "Education" && lowerKey.includes("education")) ||
        (sectionName === "Work Experience" &&
          (lowerKey.includes("workexperience") ||
            lowerKey.includes("company") ||
            (lowerKey.includes("role") && !lowerKey.includes("internship")))) ||
        (sectionName === "Projects" && lowerKey.includes("project")) ||
        (sectionName === "Certifications" &&
          lowerKey.includes("certification")) ||
        (sectionName === "Achievements" &&
          lowerKey.includes("achievement")) ||
        (sectionName === "Volunteering" &&
          lowerKey.includes("volunteering")) ||
        (sectionName === "Internships" &&
          lowerKey.includes("internship")) ||
        (sectionName === "Awards" && lowerKey.includes("award")) ||
        (sectionName === "Hobbies" && lowerKey.includes("hobbie")) ||
        (sectionName === "Interests" && lowerKey.includes("interest")) ||
        (sectionName === "Languages" && lowerKey.includes("language")) ||
        (sectionName === "Publications" && lowerKey.includes("publication")) ||
        (sectionName === "References" &&
          lowerKey.includes("reference"))
      ) {
        fields.push(key);
      }
    });


    return fields;
  };


  const triggerAutoSave = useCallback(async (sectionName: string, currentFormData: Record<string, string>) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }


    autoSaveTimerRef.current = setTimeout(async () => {
      const resumeId = localStorage.getItem("current_resume_id");
      
      if (!resumeId || !sectionName || resumeId === 'null' || resumeId === 'undefined') {
        console.log("⏸️ Skipping auto-save: No valid resume ID");
        return;
      }
      
      try {
        setIsAutoSaving(true);
        console.log("💾 Auto-saving:", sectionName);
        
        const sectionData = transformFormDataToBackend(sectionName);
        
        const sectionKeyMap: Record<string, string> = {
          "Personal Info": "personalInfo",
          "Professional Summary": "professionalSummary",
          "Skills": "skills",
          "Education": "education",
          "Work Experience": "workExperience",
          "Projects": "projects",
          "Certifications": "certifications",
          "Achievements": "achievements",
          "Volunteering": "volunteering",
          "Internships": "internships",
          "Awards": "awards",
          "Hobbies": "hobbies",
          "Interests": "interests",
          "Languages": "languages",
          "Publications": "publications",
          "References": "references",
        };
        
        const backendKey = sectionKeyMap[sectionName] || sectionName.toLowerCase().replace(/\s+/g, "_");
        
        const updatePayload = {
          [backendKey]: sectionData,
        };
        
        console.log("📤 Auto-save payload:", updatePayload);
        
        await autoSaveResume(resumeId, updatePayload);
        
        setLastSaved(new Date());
        console.log("✅ Auto-saved successfully");
        
      } catch (error) {
        console.error("❌ Auto-save failed:", error);
      } finally {
        setIsAutoSaving(false);
      }
    }, 3000);
  }, []);


  useEffect(() => {
    if (openModalSection && formData) {
      triggerAutoSave(openModalSection, formData);
    }
  }, [formData, openModalSection, triggerAutoSave]);


  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);


  const isRequiredField = (key: string): boolean => {
    const lowerKey = key.toLowerCase();
    const optionalFields = [
      "linkedin url",
      "portfolio url",
      "currentlyworking",
      "link",
      "technologies",
      "description",
      "achievement",
      "category",
      "proficiencylevel",
      "startdate",
      "enddate",
      "date",
      "year",
    ];
    return !optionalFields.some((optional) => lowerKey.includes(optional));
  };


  // ✅ FIXED: Validate and return new errors, don't rely on stale state
  const validateSectionFields = (): { isValid: boolean; newErrors: Record<string, string> } => {
    if (!openModalSection) return { isValid: true, newErrors: {} };
    
    const sectionFields = getSectionFields(openModalSection);
    const newErrors: Record<string, string> = {};
    let hasEmptyRequiredFields = false;


    sectionFields.forEach((key) => {
      const value = formData[key] || "";
      if (isRequiredField(key)) {
        if (!value || value.trim() === "") {
          newErrors[key] = "This field is required";
          hasEmptyRequiredFields = true;
        }
      }
    });


    return { 
      isValid: !hasEmptyRequiredFields, 
      newErrors 
    };
  };


  const transformFormDataToBackend = (sectionName: string) => {
    const sectionFields = getSectionFields(sectionName);
    
    console.log("🔄 Transforming section:", sectionName);
    console.log("📋 Section fields:", sectionFields);
    
    if (sectionName === "Professional Summary") {
      const summaryValue = formData["professionalSummary"] || formData["summary"] || "";
      console.log("📝 Professional Summary value:", summaryValue);
      return summaryValue;
    }
    
    if (sectionName === "Skills") {
      const skillsValue = formData["skills"];
      if (typeof skillsValue === 'string') {
        return skillsValue.split(',').map(s => s.trim()).filter(s => s);
      }
      if (Array.isArray(skillsValue)) {
        return skillsValue;
      }
      return [];
    }
    
    if (sectionName === "Personal Info") {
      return {
        name: formData["fullname"] || "",
        email: formData["email"] || "",
        phone: formData["phone"] || "",
        location: formData["location"] || "",
        linkedinurl: formData["linkedinUrl"] || "",
        portifoliourl: formData["portifolioUrl"] || "",
      };
    }
    
    if (sectionName === "Education") {
      const educationArray: any[] = [];
      let index = 0;
      
      while (formData[`education_${index}_school`]) {
        educationArray.push({
          school: formData[`education_${index}_school`] || "",
          degree: formData[`education_${index}_degree`] || "",
          startDate: formData[`education_${index}_startDate`] || "",
          endDate: formData[`education_${index}_endDate`] || "",
        });
        index++;
      }
      
      console.log("🎓 Education array:", educationArray);
      return educationArray.length > 0 ? educationArray : [];
    }
    
    if (sectionName === "Work Experience") {
      const workArray: any[] = [];
      let index = 0;
      
      while (formData[`workExperience_${index}_company`]) {
        workArray.push({
          company: formData[`workExperience_${index}_company`] || "",
          role: formData[`workExperience_${index}_role`] || "",
          location: formData[`workExperience_${index}_location`] || "",
          startDate: formData[`workExperience_${index}_startDate`] || "",
          endDate: formData[`workExperience_${index}_endDate`] || "",
          currentlyWorking: formData[`workExperience_${index}_currentlyWorking`] === "true",
          description: formData[`workExperience_${index}_description`] || "",
        });
        index++;
      }
      
      console.log("💼 Work Experience array:", workArray);
      return workArray.length > 0 ? workArray : [];
    }
    
    if (sectionName === "Projects") {
      const projectsArray: any[] = [];
      let index = 0;
      
      while (formData[`project_${index}_title`]) {
        const technologies = formData[`project_${index}_technologies`];
        projectsArray.push({
          title: formData[`project_${index}_title`] || "",
          description: formData[`project_${index}_description`] || "",
          technologies: typeof technologies === 'string' 
            ? technologies.split(',').map(t => t.trim()).filter(t => t)
            : (Array.isArray(technologies) ? technologies : []),
          startDate: formData[`project_${index}_startDate`] || "",
          endDate: formData[`project_${index}_endDate`] || "",
          link: formData[`project_${index}_link`] || "",
        });
        index++;
      }
      
      console.log("🚀 Projects array:", projectsArray);
      return projectsArray.length > 0 ? projectsArray : [];
    }
    
    if (sectionName === "Certifications") {
      const certsArray: any[] = [];
      let index = 0;
      
      while (formData[`certification_${index}_name`]) {
        certsArray.push({
          name: formData[`certification_${index}_name`] || "",
          issuedBy: formData[`certification_${index}_issuedBy`] || "",
          year: formData[`certification_${index}_year`] || "",
        });
        index++;
      }
      
      return certsArray.length > 0 ? certsArray : [];
    }
    
    if (sectionName === "Achievements") {
      const achievementsArray: any[] = [];
      let index = 0;
      
      while (formData[`achievement_${index}_title`]) {
        achievementsArray.push({
          title: formData[`achievement_${index}_title`] || "",
          date: formData[`achievement_${index}_date`] || "",
          description: formData[`achievement_${index}_description`] || "",
        });
        index++;
      }
      
      return achievementsArray.length > 0 ? achievementsArray : [];
    }
    
    if (sectionName === "Internships") {
      const internshipsArray: any[] = [];
      let index = 0;
      
      while (formData[`internship_${index}_company`]) {
        internshipsArray.push({
          company: formData[`internship_${index}_company`] || "",
          role: formData[`internship_${index}_role`] || "",
          location: formData[`internship_${index}_location`] || "",
          startDate: formData[`internship_${index}_startDate`] || "",
          endDate: formData[`internship_${index}_endDate`] || "",
          currentlyWorking: formData[`internship_${index}_currentlyWorking`] === "true",
          description: formData[`internship_${index}_description`] || "",
        });
        index++;
      }
      
      return internshipsArray.length > 0 ? internshipsArray : [];
    }
    
    if (sectionName === "Volunteering") {
      const volunteeringArray: any[] = [];
      let index = 0;
      
      while (formData[`volunteering_${index}_organization`]) {
        volunteeringArray.push({
          organization: formData[`volunteering_${index}_organization`] || "",
          role: formData[`volunteering_${index}_role`] || "",
          startDate: formData[`volunteering_${index}_startDate`] || "",
          endDate: formData[`volunteering_${index}_endDate`] || "",
        });
        index++;
      }
      
      return volunteeringArray.length > 0 ? volunteeringArray : [];
    }

        if (sectionName === "Awards") {
      const awardsArray: any[] = [];
      let index = 0;
      
      while (formData[`award_${index}_title`]) {
        awardsArray.push({
          title: formData[`award_${index}_title`] || "",
          issuedBy: formData[`award_${index}_issuedBy`] || "",
          year: formData[`award_${index}_year`] || "",
        });
        index++;
      }
      
      return awardsArray.length > 0 ? awardsArray : [];
    }
    
    if (sectionName === "Hobbies") {
      const hobbiesArray: any[] = [];
      let index = 0;
      
      while (formData[`hobbie_${index}_name`]) {
        hobbiesArray.push({
          name: formData[`hobbie_${index}_name`] || "",
          description: formData[`hobbie_${index}_description`] || "",
          proficiencyLevel: formData[`hobbie_${index}_proficiencyLevel`] || "",
          achievement: formData[`hobbie_${index}_achievement`] || "",
        });
        index++;
      }
      
      return hobbiesArray.length > 0 ? hobbiesArray : [];
    }
    
    if (sectionName === "Interests") {
      const interestsArray: any[] = [];
      let index = 0;
      
      while (formData[`interest_${index}_name`]) {
        interestsArray.push({
          name: formData[`interest_${index}_name`] || "",
          description: formData[`interest_${index}_description`] || "",
          category: formData[`interest_${index}_category`] || "",
        });
        index++;
      }
      
      return interestsArray.length > 0 ? interestsArray : [];
    }
    
    if (sectionName === "Languages") {
      const languagesArray: any[] = [];
      let index = 0;
      
      while (formData[`language_${index}_language`]) {
        languagesArray.push({
          language: formData[`language_${index}_language`] || "",
          proficiency: formData[`language_${index}_proficiency`] || "",
        });
        index++;
      }
      
      return languagesArray.length > 0 ? languagesArray : [];
    }
    
    // ✅ FIXED: Publications returns [] instead of {}
    if (sectionName === "Publications") {
      const publicationsArray: any[] = [];
      let index = 0;
      
      while (formData[`publication_${index}_title`]) {
        publicationsArray.push({
          title: formData[`publication_${index}_title`] || "",
          authors: formData[`publication_${index}_authors`] || "",
          publicationName: formData[`publication_${index}_publicationName`] || "",
          date: formData[`publication_${index}_date`] || "",
          url: formData[`publication_${index}_url`] || "",
        });
        index++;
      }
      
      console.log("📄 Publications array:", publicationsArray);
      return publicationsArray.length > 0 ? publicationsArray : [];
    }
    
    if (sectionName === "References") {
      const referencesArray: any[] = [];
      let index = 0;
      
      while (formData[`reference_${index}_name`]) {
        referencesArray.push({
          name: formData[`reference_${index}_name`] || "",
          relation: formData[`reference_${index}_relation`] || "",
          contact: formData[`reference_${index}_contact`] || "",
        });
        index++;
      }
      
      return referencesArray.length > 0 ? referencesArray : [];
    }
    
    console.warn("⚠️ Unknown section:", sectionName);
    return {};
  };


  // ✅ FIXED: Complete rewrite of save function with proper error handling
  // const handleSaveForm = async () => {
  //   if (!openModalSection) return;
    
  //   // ✅ Step 1: Clear all errors for this section first
  //   const sectionFields = getSectionFields(openModalSection);
  //   clearErrors(sectionFields);
    
  //   // ✅ Step 2: Run fresh validation
  //   const { isValid, newErrors } = validateSectionFields();
    
  //   // ✅ Step 3: If validation fails, show errors and stop
  //   if (!isValid) {
  //     // Apply new errors through handleBlur
  //     Object.entries(newErrors).forEach(([key]) => {
  //       handleBlur(key, formData[key] || "");
  //     });
      
  //     toast.error("Please fill in all required fields");
  //     return;
  //   }

  //   setIsSaving(true);


  //   try {
  //     let resumeId = localStorage.getItem("current_resume_id");
      
  //     console.log("💾 Stored resume ID:", resumeId);
      
  //     if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
  //       console.error("❌ No valid resume ID found");
  //       toast.error("Resume ID not found. Please refresh the page.", {
  //         duration: 5000,
  //       });
        
  //       return;
  //     }


  //     console.log("🔍 Verifying resume exists before update...");
  //     try {
  //       const allResumes = await getAllResumes();
  //       const resumeExists = allResumes.some(r => r.id === resumeId);
        
  //       if (!resumeExists) {
  //         console.error("❌ Resume ID doesn't exist in backend");
          
  //         if (allResumes.length > 0) {
  //           resumeId = allResumes[0].id;
  //           localStorage.setItem("current_resume_id", resumeId);
  //           console.log("✅ Switched to existing resume:", resumeId);
  //           toast.info("Switched to your existing resume");
  //         } else {
  //           throw new Error("No resumes found. Please create a new resume.");
  //         }
  //       } else {
  //         console.log("✅ Resume verified, proceeding with update");
  //       }
  //     } catch (verifyError) {
  //       console.error("❌ Failed to verify resume:", verifyError);
  //     }


  //     const sectionData = transformFormDataToBackend(openModalSection);
      
  //     const sectionKeyMap: Record<string, string> = {
  //       "Personal Info": "personalInfo",
  //       "Professional Summary": "professionalSummary",
  //       "Skills": "skills",
  //       "Education": "education",
  //       "Work Experience": "workExperience",
  //       "Projects": "projects",
  //       "Certifications": "certifications",
  //       "Achievements": "achievements",
  //       "Volunteering": "volunteering",
  //       "Internships": "internships",
  //       "Awards": "awards",
  //       "Hobbies": "hobbies",
  //       "Interests": "interests",
  //       "Languages": "languages",
  //       "Publications": "publications",
  //       "References": "references",
  //     };
      
  //     const backendKey = sectionKeyMap[openModalSection] || openModalSection.toLowerCase().replace(/\s+/g, "_");
      
  //     const updatePayload = {
  //       [backendKey]: sectionData,
  //     };


  //     console.log("📤 Updating section:", {
  //       resumeId,
  //       section: openModalSection,
  //       backendKey,
  //       payload: updatePayload,
  //       dataType: typeof sectionData,
  //       isArray: Array.isArray(sectionData),
  //     });


  //     const result = await updateResume(resumeId, updatePayload);
      
  //     console.log("✅ Update successful:", result);


  //     setCompletionStatus((prev) => ({
  //       ...prev,
  //       [openModalSection]: true,
  //     }));


  //     toast.success(`${openModalSection} saved successfully!`);
      
  //     // ✅ Clear errors for this section after successful save
  //     clearErrors(sectionFields);
      
  //     closeModal();
      
  //   } catch (error) {
  //     console.error("❌ Error saving section:", error);
      
  //     if (error instanceof Error) {
  //       if (error.message.includes("not found") || error.message.includes("404")) {
  //         toast.error(
  //           "Resume not found. Redirecting to dashboard...",
  //           { duration: 3000 }
  //         );
          
  //         localStorage.removeItem("current_resume_id");
          
  //         setTimeout(() => {
  //           window.location.href = "/dashboard/resume";
  //         }, 2000);
          
  //       } else if (error.message.includes("401") || error.message.includes("sign in")) {
  //         toast.error("Session expired. Please log in again.");
          
  //         setTimeout(() => {
  //           window.location.href = "/signin";
  //         }, 1500);
          
  //       } else {
  //         toast.error(error.message || "Failed to save section");
  //       }
  //     } else {
  //       toast.error("Failed to save section. Please try again.");
  //     }
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };
  const handleSaveForm = async () => {
  if (!openModalSection) return;

  try {
    setIsSaving(true);

    // ✅ Step 1: Always clear previous validation errors before revalidating
    const sectionFields = getSectionFields(openModalSection);
    clearErrors(sectionFields);

    // ✅ Step 2: Validate again using the current up-to-date formData
    const { isValid, newErrors } = validateSectionFields();

    if (!isValid) {
      // show errors and stop save
      Object.entries(newErrors).forEach(([key]) => {
        handleBlur(key, formData[key] || "");
      });
      toast.error("Please fill in all required fields");
      setIsSaving(false);
      return;
    }

    // ✅ Step 3: Fetch resumeId safely (with fallback)
    let resumeId = localStorage.getItem("current_resume_id");
    if (!resumeId || resumeId === "null" || resumeId === "undefined") {
      console.warn("⚠️ No valid resume ID found, refetching...");
      const resumes = await getAllResumes();
      if (resumes.length > 0) {
        resumeId = resumes[0].id;
        localStorage.setItem("current_resume_id", resumeId);
        toast.info(`Using existing resume ${resumeId.substring(0, 8)}...`);
      } else {
        toast.error("No resumes found. Please create one before saving.");
        setIsSaving(false);
        return;
      }
    }

    // ✅ Step 4: Transform section data for backend
    const sectionData = transformFormDataToBackend(openModalSection);

    const sectionKeyMap: Record<string, string> = {
      "Personal Info": "personalInfo",
      "Professional Summary": "professionalSummary",
      "Skills": "skills",
      "Education": "education",
      "Work Experience": "workExperience",
      "Projects": "projects",
      "Certifications": "certifications",
      "Achievements": "achievements",
      "Volunteering": "volunteering",
      "Internships": "internships",
      "Awards": "awards",
      "Hobbies": "hobbies",
      "Interests": "interests",
      "Languages": "languages",
      "Publications": "publications",
      "References": "references",
    };

    const backendKey =
      sectionKeyMap[openModalSection] ||
      openModalSection.toLowerCase().replace(/\s+/g, "_");

    const updatePayload = {
      [backendKey]: sectionData,
    };

    console.log("📤 Sending payload:", updatePayload);

    // ✅ Step 5: Call update API safely
    await updateResume(resumeId, updatePayload);

    // ✅ Step 6: Mark section complete + clear all validation
    setCompletionStatus((prev) => ({
      ...prev,
      [openModalSection]: true,
    }));

    clearErrors(sectionFields); // remove local validation
    toast.success(`${openModalSection} saved successfully!`);
    closeModal();
  } catch (error) {
    console.error("❌ Save failed:", error);
    if (error instanceof Error) {
      toast.error(error.message || "Failed to save section.");
    } else {
      toast.error("Unexpected error occurred while saving.");
    }
  } finally {
    setIsSaving(false);
  }
};



  const completionPercentage = getCompletionPercentage();


  return (
    <>
      {isAutoSaving && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Saving...</span>
        </div>
      )}
      
      {lastSaved && !isAutoSaving && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          ✓ Saved {new Date(lastSaved).toLocaleTimeString()}
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#2557a7] mb-2">
            Resume Sections
          </h3>
          <p className="text-xs text-gray-800">
            Complete each section to build a perfect resume
          </p>
        </div>
        <div className="relative">
          <CircularProgress percentage={completionPercentage} size={54} strokeWidth={4} />
        </div>
      </div>


      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections">
          {(provided: DroppableProvided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-col gap-2 p-1 rounded-xl"
            >
              {visibleSections.map((s, idx) => {
                const originalIndex =
                  activeSection !== null ? activeSection : idx;
                const Icon = sectionIcons[s.name];
                const id = `${s.name}-${originalIndex}`;


                return (
                  <Draggable
                    key={id}
                    draggableId={id}
                    index={originalIndex}
                    isDragDisabled={activeSection !== null}
                  >
                    {(p: DraggableProvided, snap: DraggableStateSnapshot) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        className={`transition-transform duration-200 ease-in-out ${
                          snap.isDragging ? "scale-[1.01]" : "scale-100"
                        }`}
                      >
                        <SectionItem
                          title={s.name}
                          icon={<Icon size={16} />}
                          ai={s.ai}
                          dragHandleProps={p.dragHandleProps}
                          isDragging={snap.isDragging}
                          isActive={openModalSection === s.name}
                          onToggle={() => handleToggleSection(s.name)}
                          onDelete={() => handleDeleteSection(originalIndex)}
                          disableDelete={nonDeletableSections.includes(s.name)}
                          isComplete={completionStatus[s.name] || false}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>


      <AddNewSection />


      {extraSections.length > 0 && (
        <div className="mt-3 space-y-2 max-h-screen">
          {extraSections.map((s, i) => {
            const Icon = sectionIcons[s.name] || (() => <span>★</span>);
            return (
              <button
                key={i}
                onClick={() => handleAddSection(s)}
                className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-blue-100 group-hover:to-blue-100 group-hover:text-blue-600 transition-all duration-300">
                    <Icon size={16} />
                  </div>
                  <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
                    {s.name}
                  </p>
                </div>


                <div className="flex items-center gap-2">
                  {s.ai && (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#efedf2] text-black rounded-full">
                      <Sparkles size={12} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI
                    </span>
                  )}
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
                              bg-gradient-to-br from-white-50 to-white-500 text-gray-600
                              group-hover:from-blue-500 group-hover:to-blue-700 
                              group-hover:text-white group-hover:scale-110"
                  >
                    <Plus size={14} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}


      {openModalSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[930px] h-[88vh] relative flex flex-col">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition-colors"
              disabled={isSaving}
            >
              <X size={20} />
            </button>


            <h2 className="text-xl font-semibold text-gray-700 text-center border-b border-gray-200 pb-3">
              {openModalSection}
            </h2>


            <div className="flex-1 min-h-[75px] px-1 overflow-y-auto">
              {(() => {
                const Component = sectionComponents[openModalSection];
                if (!Component) return null;
                return (
                  <Component
                    formData={formData}
                    errors={errors}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                );
              })()}
            </div>


            <div className="border-t border-gray-200 mt-4 pt-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="text-[16px] bg-gray-100 text-gray-700 font-semibold rounded-lg min-h-[48px] min-w-[112px] hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveForm}
                disabled={isSaving}
                className="text-[16px] bg-[#2557a7] font-semibold text-white min-h-[48px] min-w-[112px] rounded-lg hover:bg-[#184284] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


export default EditorTab;

