// import React, { useState, useRef, useEffect } from "react";
// import { X } from "lucide-react";
// import { GripVertical } from "lucide-react";
// import {
//   DndContext,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   DragEndEvent,
// } from "@dnd-kit/core";
// import {
//   arrayMove,
//   SortableContext,
//   sortableKeyboardCoordinates,
//   useSortable,
//   verticalListSortingStrategy,
// } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";

// interface TechnologyChipsInputProps {
//   selectedTechnologies: string[];
//   onTechnologiesChange: (technologies: string[]) => void;
//   suggestions: string[];
//   label?: string;
//   placeholder?: string;
//   error?: string;
// }

// interface SortableChipProps {
//   technology: string;
//   onRemove: () => void;
// }

// const SortableChip: React.FC<SortableChipProps> = ({ technology, onRemove }) => {
//   const {
//     attributes,
//     listeners,
//     setNodeRef,
//     transform,
//     transition,
//     isDragging,
//   } = useSortable({ id: technology });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     opacity: isDragging ? 0.5 : 1,
//   };

//   return (
//     <div
//       ref={setNodeRef}
//       style={style}
//       className={`flex items-center gap-1.5 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium group hover:bg-blue-200 transition-colors ${
//         isDragging ? "cursor-grabbing" : ""
//       }`}
//     >
//       <div
//         {...attributes}
//         {...listeners}
//         className="cursor-grab active:cursor-grabbing touch-none"
//       >
//         <GripVertical size={14} className="text-blue-600" />
//       </div>
//       <span className="select-none">{technology}</span>
//       <button
//         type="button"
//         onClick={(e) => {
//           e.stopPropagation();
//           onRemove();
//         }}
//         className="ml-1 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
//       >
//         <X size={14} className="text-blue-700" />
//       </button>
//     </div>
//   );
// };

// const TechnologyChipsInput: React.FC<TechnologyChipsInputProps> = ({
//   selectedTechnologies,
//   onTechnologiesChange,
//   suggestions,
//   label,
//   placeholder = "Start typing...",
//   error,
// }) => {
//   const [inputValue, setInputValue] = useState("");
//   const [isOpen, setIsOpen] = useState(false);
//   const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
//   const [highlightedIndex, setHighlightedIndex] = useState(0);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   const sensors = useSensors(
//     useSensor(PointerSensor),
//     useSensor(KeyboardSensor, {
//       coordinateGetter: sortableKeyboardCoordinates,
//     })
//   );

//   // Filter suggestions based on input
//   useEffect(() => {
//     if (inputValue.trim()) {
//       const filtered = suggestions.filter(
//         (item) =>
//           item.toLowerCase().includes(inputValue.toLowerCase()) &&
//           !selectedTechnologies.includes(item)
//       );
//       setFilteredSuggestions(filtered);
//       setHighlightedIndex(0);
//       setIsOpen(filtered.length > 0);
//     } else {
//       setFilteredSuggestions([]);
//       setIsOpen(false);
//     }
//   }, [inputValue, suggestions, selectedTechnologies]);

//   // Scroll highlighted item into view
//   useEffect(() => {
//     if (dropdownRef.current && isOpen) {
//       const highlightedElement = dropdownRef.current.children[
//         highlightedIndex
//       ] as HTMLElement;
//       if (highlightedElement) {
//         highlightedElement.scrollIntoView({
//           block: "nearest",
//           behavior: "smooth",
//         });
//       }
//     }
//   }, [highlightedIndex, isOpen]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setInputValue(e.target.value);
//   };

//   const handleSelect = (technology: string) => {
//     if (!selectedTechnologies.includes(technology)) {
//       onTechnologiesChange([...selectedTechnologies, technology]);
//     }
//     setInputValue("");
//     setIsOpen(false);
//     inputRef.current?.focus();
//   };

//   const handleRemove = (technology: string) => {
//     onTechnologiesChange(
//       selectedTechnologies.filter((t) => t !== technology)
//     );
//   };

//   const addCustomTechnology = (technology: string) => {
//     const trimmedTech = technology.trim();
//     if (trimmedTech && !selectedTechnologies.includes(trimmedTech)) {
//       onTechnologiesChange([...selectedTechnologies, trimmedTech]);
//       setInputValue("");
//       setIsOpen(false);
//       inputRef.current?.focus();
//     }
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     // Handle Enter key
//     if (e.key === "Enter") {
//       e.preventDefault();
      
//       // If dropdown is open and a suggestion is highlighted, select it
//       if (isOpen && filteredSuggestions[highlightedIndex]) {
//         handleSelect(filteredSuggestions[highlightedIndex]);
//       } 
//       // If dropdown is closed or no suggestions, add as custom technology
//       else if (inputValue.trim()) {
//         addCustomTechnology(inputValue);
//       }
//       return;
//     }

//     // Only handle arrow keys and escape if dropdown is open
//     if (!isOpen) return;

//     switch (e.key) {
//       case "ArrowDown":
//         e.preventDefault();
//         setHighlightedIndex((prev) =>
//           prev < filteredSuggestions.length - 1 ? prev + 1 : prev
//         );
//         break;
//       case "ArrowUp":
//         e.preventDefault();
//         setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
//         break;
//       case "Escape":
//         setIsOpen(false);
//         break;
//       default:
//         break;
//     }
//   };

//   const handleBlur = () => {
//     setTimeout(() => {
//       setIsOpen(false);
//     }, 200);
//   };

//   const handleDragEnd = (event: DragEndEvent) => {
//     const { active, over } = event;

//     if (over && active.id !== over.id) {
//       const oldIndex = selectedTechnologies.indexOf(active.id as string);
//       const newIndex = selectedTechnologies.indexOf(over.id as string);
//       onTechnologiesChange(arrayMove(selectedTechnologies, oldIndex, newIndex));
//     }
//   };

//   const highlightMatch = (text: string, query: string) => {
//     if (!query.trim()) return text;

//     const parts = text.split(new RegExp(`(${query})`, "gi"));
//     return (
//       <>
//         {parts.map((part, index) =>
//           part.toLowerCase() === query.toLowerCase() ? (
//             <span key={index} className="bg-yellow-200 font-semibold">
//               {part}
//             </span>
//           ) : (
//             <span key={index}>{part}</span>
//           )
//         )}
//       </>
//     );
//   };

//   return (
//     <div className="flex flex-col gap-1 flex-1 relative">
//       {label && (
//         <label className="text-sm font-semibold text-[#3b3b3b]">{label}</label>
//       )}

//       {/* Chips Display Area */}
//       {selectedTechnologies.length > 0 && (
//         <DndContext
//           sensors={sensors}
//           collisionDetection={closestCenter}
//           onDragEnd={handleDragEnd}
//         >
//           <SortableContext
//             items={selectedTechnologies}
//             strategy={verticalListSortingStrategy}
//           >
//             <div className="flex flex-wrap gap-2 p-2 bg-[#faf9f8] rounded-md border border-gray-200 mb-2">
//               {selectedTechnologies.map((technology) => (
//                 <SortableChip
//                   key={technology}
//                   technology={technology}
//                   onRemove={() => handleRemove(technology)}
//                 />
//               ))}
//             </div>
//           </SortableContext>
//         </DndContext>
//       )}

//       {/* Input Field */}
//       <div className="relative">
//         <input
//           ref={inputRef}
//           type="text"
//           value={inputValue}
//           onChange={handleInputChange}
//           onKeyDown={handleKeyDown}
//           onBlur={handleBlur}
//           onFocus={() =>
//             inputValue.trim() && setIsOpen(filteredSuggestions.length > 0)
//           }
//           placeholder={placeholder}
//           className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
//           autoComplete="off"
//         />

//         {/* Dropdown */}
//         {isOpen && filteredSuggestions.length > 0 && (
//           <div
//             ref={dropdownRef}
//             className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
//             style={{ top: "100%", marginTop: "4px" }}
//           >
//             {filteredSuggestions.map((suggestion, index) => (
//               <div
//                 key={index}
//                 onClick={() => handleSelect(suggestion)}
//                 className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${
//                   index === highlightedIndex
//                     ? "bg-blue-500 text-white"
//                     : "hover:bg-gray-100 text-gray-800"
//                 }`}
//               >
//                 {highlightMatch(suggestion, inputValue)}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {error && <span className="text-xs text-red-500">{error}</span>}
//     </div>
//   );
// };

// export default TechnologyChipsInput;




// import React, { useState, useRef, useEffect } from "react";
// import { X } from "lucide-react";
// import { GripVertical } from "lucide-react";
// import {
//   DndContext,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   DragEndEvent,
// } from "@dnd-kit/core";
// import {
//   arrayMove,
//   SortableContext,
//   sortableKeyboardCoordinates,
//   useSortable,
//   horizontalListSortingStrategy,
// } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";

// interface TechnologyChipsInputProps {
//   selectedTechnologies: string[];
//   onTechnologiesChange: (technologies: string[]) => void;
//   suggestions: string[];
//   label?: string;
//   placeholder?: string;
//   error?: string;
// }

// interface SortableChipProps {
//   technology: string;
//   onRemove: () => void;
// }

// const SortableChip: React.FC<SortableChipProps> = ({ technology, onRemove }) => {
//   const {
//     attributes,
//     listeners,
//     setNodeRef,
//     transform,
//     transition,
//     isDragging,
//   } = useSortable({ id: technology });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     opacity: isDragging ? 0.5 : 1,
//   };

//   return (
//     <div
//       ref={setNodeRef}
//       style={style}
//       className={`flex items-center gap-1.5 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium group hover:bg-blue-200 transition-colors ${
//         isDragging ? "cursor-grabbing" : ""
//       }`}
//     >
//       <div
//         {...attributes}
//         {...listeners}
//         className="cursor-grab active:cursor-grabbing touch-none"
//       >
//         <GripVertical size={14} className="text-blue-600" />
//       </div>
//       <span className="select-none">{technology}</span>
//       <button
//         type="button"
//         onClick={(e) => {
//           e.stopPropagation();
//           onRemove();
//         }}
//         className="ml-1 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
//       >
//         <X size={14} className="text-blue-700" />
//       </button>
//     </div>
//   );
// };

// const TechnologyChipsInput: React.FC<TechnologyChipsInputProps> = ({
//   selectedTechnologies,
//   onTechnologiesChange,
//   suggestions,
//   label,
//   placeholder = "Start typing...",
//   error,
// }) => {
//   const [inputValue, setInputValue] = useState("");
//   const [isOpen, setIsOpen] = useState(false);
//   const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
//   const [highlightedIndex, setHighlightedIndex] = useState(0);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   const sensors = useSensors(
//     useSensor(PointerSensor),
//     useSensor(KeyboardSensor, {
//       coordinateGetter: sortableKeyboardCoordinates,
//     })
//   );

//   // Filter suggestions based on input
//   useEffect(() => {
//     if (inputValue.trim()) {
//       const filtered = suggestions.filter(
//         (item) =>
//           item.toLowerCase().includes(inputValue.toLowerCase()) &&
//           !selectedTechnologies.includes(item)
//       );
//       setFilteredSuggestions(filtered);
//       setHighlightedIndex(0);
//       setIsOpen(filtered.length > 0);
//     } else {
//       setFilteredSuggestions([]);
//       setIsOpen(false);
//     }
//   }, [inputValue, suggestions, selectedTechnologies]);

//   // Scroll highlighted item into view
//   useEffect(() => {
//     if (dropdownRef.current && isOpen) {
//       const highlightedElement = dropdownRef.current.children[
//         highlightedIndex
//       ] as HTMLElement;
//       if (highlightedElement) {
//         highlightedElement.scrollIntoView({
//           block: "nearest",
//           behavior: "smooth",
//         });
//       }
//     }
//   }, [highlightedIndex, isOpen]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setInputValue(e.target.value);
//   };

//   const handleSelect = (technology: string) => {
//     if (!selectedTechnologies.includes(technology)) {
//       onTechnologiesChange([...selectedTechnologies, technology]);
//     }
//     setInputValue("");
//     setIsOpen(false);
//     inputRef.current?.focus();
//   };

//   const handleRemove = (technology: string) => {
//     onTechnologiesChange(
//       selectedTechnologies.filter((t) => t !== technology)
//     );
//   };

//   const addCustomTechnology = (technology: string) => {
//     const trimmedTech = technology.trim();
//     if (trimmedTech && !selectedTechnologies.includes(trimmedTech)) {
//       onTechnologiesChange([...selectedTechnologies, trimmedTech]);
//       setInputValue("");
//       setIsOpen(false);
//       inputRef.current?.focus();
//     }
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     // Handle Enter key
//     if (e.key === "Enter") {
//       e.preventDefault();
      
//       // If dropdown is open and a suggestion is highlighted, select it
//       if (isOpen && filteredSuggestions[highlightedIndex]) {
//         handleSelect(filteredSuggestions[highlightedIndex]);
//       } 
//       // If dropdown is closed or no suggestions, add as custom technology
//       else if (inputValue.trim()) {
//         addCustomTechnology(inputValue);
//       }
//       return;
//     }

//     // Only handle arrow keys and escape if dropdown is open
//     if (!isOpen) return;

//     switch (e.key) {
//       case "ArrowDown":
//         e.preventDefault();
//         setHighlightedIndex((prev) =>
//           prev < filteredSuggestions.length - 1 ? prev + 1 : prev
//         );
//         break;
//       case "ArrowUp":
//         e.preventDefault();
//         setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
//         break;
//       case "Escape":
//         setIsOpen(false);
//         break;
//       default:
//         break;
//     }
//   };

//   const handleBlur = () => {
//     setTimeout(() => {
//       setIsOpen(false);
//     }, 200);
//   };

//   const handleDragEnd = (event: DragEndEvent) => {
//     const { active, over } = event;

//     if (over && active.id !== over.id) {
//       const oldIndex = selectedTechnologies.indexOf(active.id as string);
//       const newIndex = selectedTechnologies.indexOf(over.id as string);
//       onTechnologiesChange(arrayMove(selectedTechnologies, oldIndex, newIndex));
//     }
//   };

//   const highlightMatch = (text: string, query: string) => {
//     if (!query.trim()) return text;

//     const parts = text.split(new RegExp(`(${query})`, "gi"));
//     return (
//       <>
//         {parts.map((part, index) =>
//           part.toLowerCase() === query.toLowerCase() ? (
//             <span key={index} className="text-black font-semibold">
//               {part}
//             </span>
//           ) : (
//             <span key={index}>{part}</span>
//           )
//         )}
//       </>
//     );
//   };

//   return (
//     <div className="flex flex-col gap-1 flex-1 relative">
//       {label && (
//         <label className="text-sm font-semibold text-[#3b3b3b]">
//           {label} <span className="text-red-500">*</span>
//         </label>
//       )}

//       {/* Input Field */}
//       <div className="relative">
//         <input
//           ref={inputRef}
//           type="text"
//           value={inputValue}
//           onChange={handleInputChange}
//           onKeyDown={handleKeyDown}
//           onBlur={handleBlur}
//           onFocus={() =>
//             inputValue.trim() && setIsOpen(filteredSuggestions.length > 0)
//           }
//           placeholder={placeholder}
//           className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
//           autoComplete="off"
//         />

//         {/* Dropdown */}
//         {isOpen && filteredSuggestions.length > 0 && (
//           <div
//             ref={dropdownRef}
//             className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
//             style={{ top: "100%", marginTop: "4px" }}
//           >
//             {filteredSuggestions.map((suggestion, index) => (
//               <div
//                 key={index}
//                 onClick={() => handleSelect(suggestion)}
//                 className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${
//                   index === highlightedIndex
//                     ? "bg-blue-500 text-white"
//                     : "hover:bg-gray-100 text-gray-800"
//                 }`}
//               >
//                 {highlightMatch(suggestion, inputValue)}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {error && <span className="text-xs text-red-500">{error}</span>}

//       {/* Chips Display Area - Horizontal Wrapping */}
//       {selectedTechnologies.length > 0 && (
//         <DndContext
//           sensors={sensors}
//           collisionDetection={closestCenter}
//           onDragEnd={handleDragEnd}
//         >
//           <SortableContext
//             items={selectedTechnologies}
//             strategy={horizontalListSortingStrategy}
//           >
//             <div className="flex flex-wrap gap-2 p-2 bg-[#faf9f8] rounded-md border border-gray-200 mt-2">
//               {selectedTechnologies.map((technology) => (
//                 <SortableChip
//                   key={technology}
//                   technology={technology}
//                   onRemove={() => handleRemove(technology)}
//                 />
//               ))}
//             </div>
//           </SortableContext>
//         </DndContext>
//       )}
//     </div>
//   );
// };

// export default TechnologyChipsInput; before filtering with start



import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


interface TechnologyChipsInputProps {
  selectedTechnologies: string[];
  onTechnologiesChange: (technologies: string[]) => void;
  suggestions: string[];
  label?: string;
  placeholder?: string;
  error?: string;
  layout?: "horizontal" | "vertical";
}


interface SortableChipProps {
  technology: string;
  onRemove: () => void;
  fullWidth?: boolean; // NEW: Control chip width
}

const SortableChip: React.FC<SortableChipProps> = ({ technology, onRemove, fullWidth = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: technology });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between ${fullWidth ? 'w-full' : 'w-auto'} bg-white border border-gray-300 px-3 py-2 rounded-md text-sm font-medium group hover:bg-gray-50 transition-colors ${
        isDragging ? "cursor-grabbing shadow-lg" : ""
      }`}
    >
      {/* Left Section: Grip + Text */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Grip Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        >
          <GripVertical size={16} className="text-gray-400" />
        </div>
        
        {/* Technology Text */}
        <span className="select-none text-gray-800 truncate">{technology}</span>
      </div>
      
      {/* Right Section: X Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex-shrink-0 ml-2 hover:bg-gray-200 rounded p-0.5 transition-colors"
        aria-label={`Remove ${technology}`}
      >
        <X size={16} className="text-gray-600" />
      </button>
    </div>
  );
};


const TechnologyChipsInput: React.FC<TechnologyChipsInputProps> = ({
  selectedTechnologies,
  onTechnologiesChange,
  suggestions,
  label,
  placeholder = "Start typing...",
  error,
  layout = "horizontal",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [justSelected, setJustSelected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter suggestions - ONLY ITEMS THAT START WITH INPUT
  useEffect(() => {
    if (inputValue.trim() && !justSelected) {
      const filtered = suggestions.filter(
        (item) =>
          item.toLowerCase().startsWith(inputValue.toLowerCase()) &&
          !selectedTechnologies.includes(item)
      );
      setFilteredSuggestions(filtered);
      setHighlightedIndex(-1);
      setIsOpen(filtered.length > 0);
    } else {
      setFilteredSuggestions([]);
      if (justSelected) {
        setIsOpen(false);
      }
    }
  }, [inputValue, suggestions, selectedTechnologies, justSelected]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (dropdownRef.current && isOpen && highlightedIndex >= 0) {
      const highlightedElement = dropdownRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJustSelected(false);
    setInputValue(e.target.value);
  };

  const handleSelect = (technology: string) => {
    if (!selectedTechnologies.includes(technology)) {
      onTechnologiesChange([...selectedTechnologies, technology]);
    }
    setInputValue("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    setJustSelected(true);
    inputRef.current?.focus();
  };

  const handleRemove = (technology: string) => {
    onTechnologiesChange(
      selectedTechnologies.filter((t) => t !== technology)
    );
  };

  const addCustomTechnology = (technology: string) => {
    const trimmedTech = technology.trim();
    if (trimmedTech && !selectedTechnologies.includes(trimmedTech)) {
      onTechnologiesChange([...selectedTechnologies, trimmedTech]);
      setInputValue("");
      setIsOpen(false);
      setJustSelected(true);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      if (isOpen && highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        handleSelect(filteredSuggestions[highlightedIndex]);
      } 
      else if (inputValue.trim()) {
        addCustomTechnology(inputValue);
      }
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          if (prev === -1) return 0;
          return prev < filteredSuggestions.length - 1 ? prev + 1 : prev;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          if (prev === -1) return filteredSuggestions.length - 1;
          return prev > 0 ? prev - 1 : -1;
        });
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 200);
  };

  const handleFocus = () => {
    if (justSelected) {
      setJustSelected(false);
    }
    
    if (inputValue.trim()) {
      const filtered = suggestions.filter(
        (item) =>
          item.toLowerCase().startsWith(inputValue.toLowerCase()) &&
          !selectedTechnologies.includes(item)
      );
      if (filtered.length > 0) {
        setFilteredSuggestions(filtered);
        setIsOpen(true);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedTechnologies.indexOf(active.id as string);
      const newIndex = selectedTechnologies.indexOf(over.id as string);
      onTechnologiesChange(arrayMove(selectedTechnologies, oldIndex, newIndex));
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    if (text.toLowerCase().startsWith(query.toLowerCase())) {
      const matchedPart = text.substring(0, query.length);
      const remainingPart = text.substring(query.length);
      
      return (
        <>
          <span className="text-black font-semibold">{matchedPart}</span>
          <span>{remainingPart}</span>
        </>
      );
    }
    
    return text;
  };

  return (
    <div className="flex flex-col gap-1 flex-1 relative">
      {label && (
        <label className="text-sm font-semibold text-[#3b3b3b]">
          {label} <span className="text-red-500">*</span>
        </label>
      )}

      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-blue-500"
          autoComplete="off"
        />

        {/* Dropdown */}
        {isOpen && filteredSuggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
            style={{ top: "100%", marginTop: "4px" }}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseLeave={() => setHighlightedIndex(-1)}
                className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                  index === highlightedIndex
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100 text-gray-800"
                }`}
              >
                {highlightMatch(suggestion, inputValue)}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}

      {/* Chips Display Area - CONDITIONAL LAYOUT */}
      {selectedTechnologies.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={selectedTechnologies}
            strategy={layout === "vertical" ? verticalListSortingStrategy : horizontalListSortingStrategy}
          >
            <div className={`flex ${layout === "vertical" ? "flex-col" : "flex-wrap"} gap-2 p-2 bg-[#faf9f8] rounded-md border border-gray-200 mt-2`}>
              {selectedTechnologies.map((technology) => (
                <SortableChip
                  key={technology}
                  technology={technology}
                  onRemove={() => handleRemove(technology)}
                  fullWidth={false}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default TechnologyChipsInput;
