import React, { useState, useRef, useEffect } from "react";


interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  suggestions: string[];
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
}


const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  onBlur,
  placeholder,
  suggestions,
  label,
  required,
  error,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [justSelected, setJustSelected] = useState(false); // Track if option was just selected
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Filter suggestions based on input value - ONLY ITEMS THAT START WITH THE INPUT
  useEffect(() => {
    if (value.trim() && !justSelected) {
      const filtered = suggestions.filter((item) =>
        item.toLowerCase().startsWith(value.toLowerCase())
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
  }, [value, suggestions, justSelected]);


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
    setJustSelected(false); // Reset flag when user types
    onChange(e.target.value);
  };


  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setJustSelected(true); // Mark that we just selected
    inputRef.current?.focus();
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
          handleSelect(filteredSuggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };


  const handleFocus = () => {
    // Reset the justSelected flag when user clicks back into input
    if (justSelected) {
      setJustSelected(false);
    }
    
    // Only show dropdown if there's text and there are matching suggestions
    if (value.trim()) {
      const filtered = suggestions.filter((item) =>
        item.toLowerCase().startsWith(value.toLowerCase())
      );
      if (filtered.length > 0) {
        setFilteredSuggestions(filtered);
        setIsOpen(true);
      }
    }
  };


  const handleBlur = () => {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
      onBlur?.();
    }, 200);
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
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={`w-full px-3 py-3.5 text-sm rounded-md text-black hover:bg-gray-100 bg-[#faf9f8] border-b-2 border-transparent focus:outline-none focus:border-[#2557a7] ${className}`}
        autoComplete="off"
      />
      {error && <span className="text-xs text-red-500">{error}</span>}


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
                  ? "bg-[#2557a7] text-white"
                  : "hover:bg-gray-100 text-gray-800"
              }`}
            >
              {highlightMatch(suggestion, value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export default AutocompleteInput;

