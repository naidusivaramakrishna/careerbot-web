// "use client";
// import React from "react";

// interface Props {
//   onSelect: (section: string) => void;
//   disabledSections: string[];
// }

// export default function SectionButtons({ onSelect, disabledSections }: Props) {
//   const sections = [
//     "Professional Summary",
//     "Education",
//     "Work Experience",
//     "Projects",
//     "Certifications",
//     "Volunteering",
//     "References",
//     "Internships",
//     "Awards",
//     "Skills",
//     "Achievements", // ✅ new
//   ];

//   return (
//     <div className="flex flex-wrap gap-2">
//       {sections
//         .filter((s) => !disabledSections.includes(s))
//         .map((section) => (
//           <button
//             key={section}
//             onClick={() => onSelect(section)}
//             className="px-3 py-1 bg-orange-500 text-white rounded-full"
//           >
//             {section}
//           </button>
//         ))}
//     </div>
//   );
// } bedore demo


"use client";
import React from "react";

interface Props {
  onSelect: (section: string) => void;
  disabledSections: string[];
}

export default function SectionButtons({ onSelect, disabledSections }: Props) {
  const sections = [
    "Professional Summary",
    "Education",
    "Work Experience",
    "Projects",
    "Certifications",
    "Volunteering",
    "References",
    "Internships",
    "Awards",
    "Skills",
    "Achievements",
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {sections
        .filter((s) => !disabledSections.includes(s))
        .map((section) => (
          <button
            key={section}
            onClick={() => onSelect(section)}
            className="px-3 py-1 bg-orange-500 text-white rounded-full"
          >
            {section}
          </button>
        ))}
    </div>
  );
}

