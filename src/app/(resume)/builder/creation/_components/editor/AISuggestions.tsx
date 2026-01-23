// import React from "react";

// interface Props {
//   options: string[];
//   onSelect: (s: string) => void;
//   onClose: () => void;
// }

// const AISuggestions: React.FC<Props> = ({ options, onSelect, onClose }) => {
//   return (
//     <div className="w-[301px] h-[400px] bg-white shadow-lg rounded-lg border border-blue-400 p-2 flex flex-col gap-2">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <span className="text-sm font-semibold text-gray-700">
//           AI Suggestions
//         </span>
//         <button
//           type="button"
//           onClick={onClose}
//           className="text-gray-500 hover:text-gray-800 text-lg"
//         >
//           ×
//         </button>
//       </div>

//       {/* Suggestions List */}
//       <div className="flex flex-col gap-2 max-h-60 overflow-y-auto scrollbar-hide">
//         {options.map((s, i) => (
//           <button
//             key={i}
//             type="button"
//             onClick={() => onSelect(s)}
//             className="text-left px-2 py-2 border-gray-300 rounded-md text-xs text-black bg-blue-100 hover:bg-blue-300"
//           >
//             {s}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default AISuggestions; before tips modified

// import React from "react";

// interface Props {
//   options: string[];
//   onSelect: (s: string) => void;
//   onClose: () => void;
// }

// const AISuggestions: React.FC<Props> = ({ options, onSelect, onClose }) => {
//   return (
//     <div className="w-full bg-[#faf9f8] border-[#e5e5e5] shadow-lg rounded-lg border p-4 flex flex-col gap-3">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <span className="text-base font-bold text-[#2d2d2d]">
//           AI Suggestions
//         </span>
//         <button
//           type="button"
//           onClick={onClose}
//           className="text-gray-500 hover:text-gray-800 text-xl font-bold"
//         >
//           ×
//         </button>
//       </div>

//       {/* Divider */}
//       <div className="border-t border-gray-300"></div>

//       {/* Suggestions List */}
//       <div className="flex flex-col gap-2 max-h-96 overflow-y-auto scrollbar-hide">
//         {options.map((s, i) => (
//           <button
//             key={i}
//             type="button"
//             onClick={() => onSelect(s)}
//             className="text-left px-3 py-3 rounded-md text-sm text-[#3b3b3b] bg-white hover:bg-[#e8eff9] transition"
//           >
//             {s}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default AISuggestions; before suggestion lift



import React from "react";

interface Props {
  options: string[];
  onSelect: (s: string) => void;
  onClose: () => void;
}

const AISuggestions: React.FC<Props> = ({ options, onSelect, onClose }) => {
  return (
    <div className="w-full bg-[#faf9f8] border-[#e5e5e5] shadow-lg rounded-lg border p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-base font-bold text-[#2d2d2d]">
          AI Suggestions
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 text-xl font-bold"
        >
          ×
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-300"></div>

      {/* Suggestions List */}
      <div className="flex flex-col gap-2 max-h-75 overflow-y-auto scrollbar-hide">
        {options.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(s)}
            className="text-left px-3 py-3 rounded-md text-sm text-[#2d2d2d] bg-white hover:bg-[#e8eff9] transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AISuggestions;


