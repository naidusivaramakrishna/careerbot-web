
"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, ChevronDown, Check, Star } from "lucide-react";

const filterOptions = [
  { id: "recommended", label: "Recommended" },
  { id: "top-matched", label: "Top Matched" },
  { id: "most-recent", label: "Most Recent" },
];

const locations = [
  "Hyderabad, India",
  "Bangalore, India",
  "Chennai, India",
  "Pune, India",
  "Mumbai, India",
  "Delhi, India",
  "Kolkata, India",
  "Ahmedabad, India",
  "Jaipur, India",
  "Surat, India",
  "Lucknow, India",
  "Kanpur, India",
  "Nagpur, India",
  "Indore, India",
  "Thane, India",
  "Bhopal, India",
  "Visakhapatnam, India",
  "Pimpri-Chinchwad, India",
  "Patna, India",
  "Vadodara, India",
  "Ghaziabad, India",
  "Ludhiana, India",
  "Agra, India",
  "Nashik, India",
  "Faridabad, India",
  "Meerut, India",
  "Rajkot, India",
  "Kalyan-Dombivli, India",
  "Vasai-Virar, India",
  "Varanasi, India",
  "Srinagar, India",
  "Aurangabad, India",
  "Dhanbad, India",
  "Amritsar, India",
  "Navi Mumbai, India",
  "Allahabad, India",
  "Ranchi, India",
  "Howrah, India",
  "Coimbatore, India",
  "Jabalpur, India",
  "Gwalior, India",
  "Vijayawada, India",
  "Jodhpur, India",
  "Madurai, India",
  "Raipur, India",
  "Kota, India",
  "Guwahati, India",
  "Chandigarh, India",
  "Solapur, India",
  "Hubli-Dharwad, India",
  "Bareilly, India",
  "Moradabad, India",
  "Mysore, India",
  "Gurgaon, India",
  "Aligarh, India",
  "Jalandhar, India",
  "Tiruchirappalli, India",
  "Bhubaneswar, India",
  "Salem, India",
  "Mira-Bhayandar, India",
  "Warangal, India",
  "Thiruvananthapuram, India",
  "Bhiwandi, India",
  "Saharanpur, India",
  "Guntur, India",
  "Amravati, India",
  "Bikaner, India",
  "Noida, India",
  "Jamshedpur, India",
  "Bhilai, India",
  "Cuttack, India",
  "Firozabad, India",
  "Kochi, India",
  "Nellore, India",
  "Bhavnagar, India",
  "Dehradun, India",
  "Durgapur, India",
  "Asansol, India",
  "Rourkela, India",
  "Nanded, India",
  "Kolhapur, India",
  "Ajmer, India",
  "Akola, India",
  "Gulbarga, India",
  "Jamnagar, India",
  "Ujjain, India",
  "Loni, India",
  "Siliguri, India",
  "Jhansi, India",
  "Ulhasnagar, India",
  "Jammu, India",
  "Sangli-Miraj & Kupwad, India",
  "Mangalore, India",
  "Erode, India",
  "Belgaum, India",
  "Ambattur, India",
  "Tirunelveli, India",
  "Malegaon, India",
  "Gaya, India",
  "Tiruppur, India",
  "Davanagere, India",
  "Kozhikode, India",
  "Akbarpur, India",
  "Remote",
];

// 🔹 SEARCH DATA - Companies and Titles
const searchData = {
  companies: ["Google", "Microsoft", "Amazon", "Apple", "Meta", "Netflix", "Tesla", "Stripe", "Cognizant", "Deloitte", "Infosys"],
  titles: ["Software Engineer", "Product Manager", "UI Designer", "Data Scientist", "DevOps Engineer", "Full Stack Developer", "Senior Developer", "UX Researcher"],
};

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLocation?: string;
  onLocationChange?: (location: string) => void;
}

type SortFilter = "recommended" | "top-matched" | "most-recent";

export default function SearchBar({
  searchQuery,
  onSearchChange,
  selectedLocation = "Bangalore, India",
  onLocationChange
}: SearchBarProps) {
  const [locationOpen, setLocationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortFilter, setSortFilter] = useState<SortFilter>("recommended");

  const searchRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  // close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
      if (
        filterRef.current &&
        !filterRef.current.contains(e.target as Node)
      ) {
        setFilterOpen(false);
      }
      if (
        locationRef.current &&
        !locationRef.current.contains(e.target as Node)
      ) {
        setLocationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // 🔍 FILTER LOGIC for companies and titles
  const filterItems = (items: string[]) =>
    items.filter((item) =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const allItems = [...searchData.companies, ...searchData.titles];
  const filteredItems = filterItems(allItems);

  return (
    <div className="mt-6 relative">
      <div className="flex items-center h-[56px] w-full rounded-full bg-white px-6 shadow-sm border border-gray-300 focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus-within:outline-none transition-[border,box-shadow] duration-200 ease-out">
        {/* FILTER DROPDOWN */}
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            {sortFilter === "recommended" && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
            <span className="text-xs uppercase tracking-wide">{filterOptions.find(f => f.id === sortFilter)?.label}</span>
            <ChevronDown size={14} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* FILTER MENU */}
          {filterOpen && (
            <div className="absolute left-0 top-12 w-40 bg-white rounded-lg shadow-lg z-50">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSortFilter(option.id as SortFilter);
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition-all`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="mx-4 h-6 w-px bg-gray-300" />

        {/* SEARCH */}
        <div
          ref={searchRef}
          className="flex items-center gap-3 flex-1 relative"
        >
          <Search size={20} className="text-blue-600" />

          <input
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search jobs, skills, companies…"
            className="w-full text-sm outline-none placeholder-gray-400"
          />

          {/* 🔽 SEARCH DROPDOWN - Company and title suggestions */}
          {searchOpen && filteredItems.length > 0 && (
            <div className="absolute top-12 left-0 w-48 bg-white rounded-lg shadow-lg z-50 max-h-32 overflow-y-auto">
              {filteredItems.map((item) => (
                <div
                  key={item}
                  onClick={() => {
                    onSearchChange(item);
                    setSearchOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-100"
                >
                  <Search size={14} className="text-gray-400 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LOCATION */}
        <div ref={locationRef} className="relative">
          <div
            onClick={() => setLocationOpen(!locationOpen)}
            className="flex items-center gap-2 text-sm text-black font-semibold cursor-pointer"
          >
            <MapPin size={16} className="text-red-600" />
            <span>{selectedLocation}</span>
            <ChevronDown size={16} className="text-gray-400" />
          </div>

          {/* LOCATION MENU */}
          {locationOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto scrollbar-thin">
              {locations.map((location) => (
                <div
                  key={location}
                  onClick={() => {
                    onLocationChange?.(location);
                    setLocationOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-100"
                >
                  <span>{location}</span>
                  {selectedLocation === location && (
                    <Check size={12} className="text-indigo-600" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
