"use client";
import React from "react";
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
import { sectionIcons } from "../../_utils/sectionsConfig";
import { Plus } from "lucide-react";
import { useResume } from "../../_context/ResumeContext";

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
  setActiveSection,
  handleDragEnd,
}) => {
  const nonDeletableSections = [ "Personal Info", "Professional Summary", "Skills", "Education", ];
  const { setSectionOrder } = useResume();
  // ✅ Update section order after drag
  const onDragEnd = (result: DropResult) => {
    handleDragEnd(result);
    if (!result.destination) return;
    const reordered = Array.from(sections);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setSectionOrder(reordered.map((s) => s.name));
  };
  // ✅ Conditional rendering: show only active section if any is open
  const visibleSections =
    activeSection !== null
      ? sections.filter((_, idx) => idx === activeSection)
      : sections;

  return (
    <>
      <h3 className="text-lg font-semibold text-orange-600 mb-2">
        Resume Sections
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Complete each section to build a perfect resume
      </p>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections">
          {(provided: DroppableProvided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-col gap-3 p-1 rounded-xl"
            >
              {visibleSections.map((s, idx) => {
                // If activeSection is set, use its original index for correct mapping
                const originalIndex =
                  activeSection !== null ? activeSection : idx;
                const Icon = sectionIcons[s.name];
                const Component = sectionComponents[s.name];
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
                          isActive={activeSection === originalIndex}
                          onToggle={() =>
                            setActiveSection(
                              activeSection === originalIndex
                                ? null
                                : originalIndex
                            )
                          }
                          onDelete={() => handleDeleteSection(originalIndex)}
                          disableDelete={nonDeletableSections.includes(s.name)}
                        >
                          {activeSection === originalIndex && Component && (
                            <div className="bg-white rounded-lg p-3 border border-orange-200">
                              <Component
                                formData={formData}
                                errors={errors}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            </div>
                          )}
                        </SectionItem>
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
      {/* ✅ Add New Section */}
      <AddNewSection />
      {/* ✅ Extra Sections */}
      {extraSections.length > 0 && (
        <div className="mt-3 space-y-2 max-h-screen">
          {extraSections.map((s, i) => {
            const Icon = sectionIcons[s.name] || (() => <span>★</span>);
            return (
              <button
                key={i}
                onClick={() => handleAddSection(s)}
                className="group w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl hover:border-orange-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-gray-600 group-hover:from-orange-100 group-hover:to-red-100 group-hover:text-orange-600 transition-all duration-300">
                    <Icon size={16} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
                        {s.name}
                      </p>
                      {s.ai && (
                        <span className="inline-flex items-center px-2 py-0 text-[10px] font-medium bg-purple-200 text-purple-700 rounded-full shadow-sm">
                          ✨ AI
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full shadow-md transition-all duration-200 
                            bg-gradient-to-br from-white-50 to-white-500 text-gray-600
                            group-hover:from-orange-500 group-hover:to-red-500 
                            group-hover:text-white group-hover:scale-110"
                >
                  <Plus size={14} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};
export default EditorTab;









