import { Sparkles, Upload } from "lucide-react";
import { useEffect, useRef } from "react";

interface AddResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWithAI: () => void;
  onUploadExisting: () => void;
}

const AddResumeModal = ({
  isOpen,
  onClose,
  onCreateWithAI,
  onUploadExisting,
}: AddResumeModalProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItem = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 z-50"
      style={{ top: "calc(100% + 8px)" }}
    >
      {/* Arrow */}
      <div className="absolute right-4 -top-1.5 w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45 z-10" />

      <div className="relative bg-white rounded-2xl w-72 overflow-hidden border border-gray-200"
        style={{ boxShadow: "0 20px 60px -10px rgba(0,0,0,0.15), 0 8px 24px -6px rgba(0,0,0,0.08)" }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">New Resume</p>
        </div>

        <div className="p-2">
          {/* Create with AI */}
          <button
            onClick={() => handleItem(onCreateWithAI)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)" }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 group-hover:text-[#1f4e98] transition-colors">
                Create with AI
              </p>
              <p className="text-xs text-gray-400">Build a tailored resume from scratch</p>
            </div>
          </button>

          {/* Upload Existing */}
          <button
            onClick={() => handleItem(onUploadExisting)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors">
              <Upload className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Upload Existing</p>
              <p className="text-xs text-gray-400">PDF or DOCX supported</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddResumeModal;
