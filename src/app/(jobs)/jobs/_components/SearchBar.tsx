

// "use client";

// import { Search, MapPin, ChevronDown } from "lucide-react";

// export default function SearchBar() {
//   return (
//     <div className="mt-6">
//       <div
//         className="
//           flex items-center
//           h-[56px]
//           w-full
//           rounded-full
//           bg-white
//           px-6
//           shadow-sm
//           border
//         "
//       >
//         {/* LEFT SEARCH */}
//         <div className="flex items-center gap-3 flex-1">
//           <Search size={18} className="text-gray-400" />
//           <input
//             placeholder="Search jobs, companies, or skills..."
//             className="w-full text-sm outline-none placeholder-gray-400"
//           />
//         </div>

//         {/* DIVIDER */}
//         <div className="mx-4 h-6 w-px bg-gray-300" />

//         {/* LOCATION */}
//         <div className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
//           <MapPin size={16} className="text-gray-400" />
//           <span>Hyderabad, India</span>
//           <ChevronDown size={16} className="text-gray-400" />
//         </div>
//       </div>
//     </div>
//   );
// }










// "use client";

// import { useState, useRef, useEffect } from "react";
// import { Search, MapPin, ChevronDown, Check } from "lucide-react";

// const locations = [
//   "Hyderabad, India",
//   "Bangalore, India",
//   "Chennai, India",
//   "Pune, India",
//   "Mumbai, India",
//   "Remote",
// ];

// const searchSuggestions = [
//   "UI/UX Designer",
//   "Product Designer",
//   "Frontend Developer",
//   "React Developer",
//   "UX Researcher",
// ];

// export default function SearchBar() {
//   const [locationOpen, setLocationOpen] = useState(false);
//   const [searchOpen, setSearchOpen] = useState(false);
//   const [selectedLocation, setSelectedLocation] =
//     useState("Hyderabad, India");

//   const searchRef = useRef<HTMLDivElement>(null);

//   // close search dropdown on outside click
//   useEffect(() => {
//     function handleClickOutside(e: MouseEvent) {
//       if (
//         searchRef.current &&
//         !searchRef.current.contains(e.target as Node)
//       ) {
//         setSearchOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () =>
//       document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <div className="mt-6 relative">
//       <div
//         className="
//           flex items-center
//           h-[56px]
//           w-full
//           rounded-full
//           bg-white
//           px-6
//           shadow-sm
//           border
//         "
//       >
//         {/* LEFT SEARCH */}
//         <div
//           ref={searchRef}
//           className="flex items-center gap-3 flex-1 relative"
//         >
//           <Search size={18} className="text-gray-400" />

//           <input
//             onFocus={() => setSearchOpen(true)}
//             placeholder="Search jobs, companies, or skills..."
//             className="w-full text-sm outline-none placeholder-gray-400"
//           />

//           {/* GOOGLE-LIKE SEARCH DROPDOWN */}
//           {searchOpen && (
//             <div className="absolute top-12 left-0 w-full bg-white border rounded-xl shadow-lg z-50">
//               {searchSuggestions.map((item) => (
//                 <div
//                   key={item}
//                   className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
//                   onClick={() => setSearchOpen(false)}
//                 >
//                   🔍 {item}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* DIVIDER */}
//         <div className="mx-4 h-6 w-px bg-gray-300" />

//         {/* LOCATION DROPDOWN */}
//         <div
//           onClick={() => setLocationOpen(!locationOpen)}
//           className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
//         >
//           <MapPin size={16} className="text-gray-400" />
//           <span>{selectedLocation}</span>
//           <ChevronDown size={16} className="text-gray-400" />
//         </div>
//       </div>

//       {/* LOCATION MENU */}
//       {locationOpen && (
//         <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-50">
//           {locations.map((location) => (
//             <div
//               key={location}
//               onClick={() => {
//                 setSelectedLocation(location);
//                 setLocationOpen(false);
//               }}
//               className="flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
//             >
//               <span>{location}</span>
//               {selectedLocation === location && (
//                 <Check size={14} className="text-indigo-600" />
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }











"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, ChevronDown, Check } from "lucide-react";
import { searchJobs, Job } from "@/api/jobsApi";

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

// 🔹 MIXED SEARCH DATA
const searchData = {
  skills: ["React", "Figma", "JavaScript", "UX Research"],
  companies: ["Google", "Microsoft", "Card", "Swiggy"],
};

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLocation?: string;
  onLocationChange?: (location: string) => void;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  selectedLocation = "Bangalore, India",
  onLocationChange
}: SearchBarProps) {
  const [locationOpen, setLocationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch jobs when searchQuery changes
  useEffect(() => {
    if (searchQuery.length > 0) {
      setIsLoadingJobs(true);
      searchJobs({ query: searchQuery, limit: 20 })
        .then(response => {
          if (response.success && response.data) {
            setFilteredJobs(response.data);
          } else {
            setFilteredJobs([]);
          }
        })
        .catch(() => setFilteredJobs([]))
        .finally(() => setIsLoadingJobs(false));
    } else {
      setFilteredJobs([]);
    }
  }, [searchQuery]);

  // 🔍 FILTER LOGIC for skills and companies
  const filterItems = (items: string[]) =>
    items.filter((item) =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredSkills = filterItems(searchData.skills);
  const filteredCompanies = filterItems(searchData.companies);

  return (
    <div className="mt-6 relative">
      <div className="flex items-center h-[56px] w-full rounded-full bg-white px-6 shadow-sm border">
        {/* SEARCH */}
        <div
          ref={searchRef}
          className="flex items-center gap-3 flex-1 relative"
        >
          <Search size={18} className="text-gray-400" />

          <input
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search jobs, skills, or companies..."
            className="w-full text-sm outline-none placeholder-gray-400"
          />

          {/* 🔽 SEARCH DROPDOWN */}
          {searchOpen && (
            <div className="absolute top-12 left-0 w-full bg-white border rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
              {/* JOBS */}
              {(filteredJobs.length > 0 || isLoadingJobs) && (
                <>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500">
                    Jobs
                  </p>
                  {isLoadingJobs ? (
                    <p className="px-4 py-2 text-sm text-gray-400">Loading...</p>
                  ) : (
                    filteredJobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => {
                          onSearchChange(job.title);
                          setSearchOpen(false);
                        }}
                        className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
                      >
                        {job.title}
                      </div>
                    ))
                  )}
                </>
              )}

              {/* SKILLS */}
              {filteredSkills.length > 0 && (
                <>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500">
                    Skills
                  </p>
                  {filteredSkills.map((item) => (
                    <div
                      key={item}
                      onClick={() => {
                        onSearchChange(item);
                        setSearchOpen(false);
                      }}
                      className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
                    >
                       {item}
                    </div>
                  ))}
                </>
              )}

              {/* COMPANIES */}
              {filteredCompanies.length > 0 && (
                <>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500">
                    Companies
                  </p>
                  {filteredCompanies.map((item) => (
                    <div
                      key={item}
                      onClick={() => {
                        onSearchChange(item);
                        setSearchOpen(false);
                      }}
                      className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
                    >
                       {item}
                    </div>
                  ))}
                </>
              )}

              {/* NO RESULTS */}
              {filteredJobs.length === 0 &&
                !isLoadingJobs &&
                filteredSkills.length === 0 &&
                filteredCompanies.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-400">
                    No results found
                  </p>
                )}
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="mx-4 h-6 w-px bg-gray-300" />

        {/* LOCATION */}
        <div
          onClick={() => setLocationOpen(!locationOpen)}
          className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
        >
          <MapPin size={16} className="text-gray-400" />
          <span>{selectedLocation}</span>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>

      {/* LOCATION MENU */}
      {locationOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto scrollbar-thin">
          {locations.map((location) => (
            <div
              key={location}
              onClick={() => {
                onLocationChange?.(location);
                setLocationOpen(false);
              }}
              className="flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
            >
              <span>{location}</span>
              {selectedLocation === location && (
                <Check size={14} className="text-indigo-600" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
