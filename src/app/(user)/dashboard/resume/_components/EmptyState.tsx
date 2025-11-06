import { CircleCheckBig, Plus, Upload } from "lucide-react";
import Image from "next/image";
import { FaLinkedinIn } from "react-icons/fa";

const EmptyState = ({ selected, onSelect }: { 
  selected: string | null; 
  onSelect: (id: string) => void;
}) => (
  <div className="flex items-center justify-center p-6">
    <div className="grid md:grid-cols-2 gap-4 max-w-5xl w-full">
      <div
        onClick={() => onSelect("builder")}
        className={`cursor-pointer bg-white border-2 rounded-xl flex flex-col justify-between shadow-sm transition
          ${selected === "builder" ? "border-[#155DFC]" : "border-gray-300"}`}
      >
        <div className='p-6'>
          <div className='flex flex-col items-center justify-center'>
            <div className="w-18 h-18 flex items-center cursor-pointer justify-center border border-dashed border-gray-400 rounded-lg my-4">
              <Plus className="text-[#2500F9] w-8 h-8" />
            </div>
            <h2 className="text-2xl font-semibold my-2">
              Craft a Professional <br /> Resume in Minutes
            </h2>
            <p className="max-w-xs text-center text-lg my-4">
              Step-by-step builder to craft a polished resume from scratch.
            </p>
          </div>
          <ul className="text-lg space-y-2 mt-4 pl-8">
            <li className="flex items-center gap-2 text-lg">
              <CircleCheckBig className="h-4 w-4 text-green-500" />
              ATS-friendly formatting
            </li>
            <li className="flex items-center gap-2 text-lg">
              <CircleCheckBig className="h-4 w-4 text-green-500" />
              Pre-designed templates
            </li>
          </ul>
        </div>
        <div>
          <Image 
            src="/assets/images/resume_dashboard_ai.svg" 
            alt='resume_dashboard_ai' 
            className='w-[300px] h-[250px] flex justify-self-end' 
            width={80} 
            height={80} 
          />
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        <div
          onClick={() => onSelect("linkedin")}
          className={`cursor-pointer bg-white border-2 h-full rounded-xl p-6 shadow-sm transition flex flex-col justify-center items-center text-center
            ${selected === "linkedin" ? "border-[#155DFC]" : "border-gray-300"}`}
        >
          <div className="bg-[#0A66C2] rounded-lg p-3 mb-3 w-18 h-18 flex items-center justify-center">
            <FaLinkedinIn className="text-white w-8 h-8" />
          </div>
          <h3 className="font-semibold text-2xl my-2">Import from LinkedIn</h3>
          <p className="text-lg max-w-xs text-center">
            Build your resume straight from your LinkedIn—fast and effortless.
          </p>
        </div>

        <div
          onClick={() => onSelect("upload")}
          className={`cursor-pointer bg-white h-full border-2 rounded-xl p-6 shadow-sm transition flex flex-col justify-center items-center text-center
            ${selected === "upload" ? "border-[#155DFC]" : "border-gray-300"}`}
        >
          <div className="bg-gray-200 rounded-lg p-3 mb-3 w-18 h-18 flex items-center justify-center">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="font-semibold text-2xl my-2">Upload existing resume</h3>
          <p className="text-lg max-w-xs text-center">
            Already have a resume? Let&apos;s upgrade it for your next opportunity.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default EmptyState