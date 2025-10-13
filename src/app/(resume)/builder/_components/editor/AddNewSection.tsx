import React from "react";
import { Plus } from "lucide-react";

const AddNewSection: React.FC = () => {
//   const [hover, setHover] = useState(false);

  return (
    <div
      className="mt-5 pt-4 border-t border-gray-200"
    //   onMouseEnter={() => setHover(true)}
    //   onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-6 h-6 rounded-lg shadow">
          <Plus size={16} className="text-orange-500" />
        </div>
        <span className="font-semibold text-sm text-gray-700">
          Add New Sections
        </span>
      </div>

      {/* List shows only on hover */}
      {/* {hover && (
        <p className="text-xs text-orange-500 ml-8">
          Hover to see available sections below
        </p>
      )} */}
    </div>
  );
};

export default AddNewSection;



