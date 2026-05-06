import { Linkedin, Sparkles, Upload } from "lucide-react";

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
  if (!isOpen) return null;

  const handleItem = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <div
      className="absolute bg-white rounded-2xl w-80 p-5 shadow-xl border border-neutral-200 z-50"
      style={{ top: "calc(100% + 10px)", right: 0 }}
    >
      <ul className="space-y-2">
        <li
          onClick={() => handleItem(onCreateWithAI)}
          className="flex items-center gap-3 px-4 py-1 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50"
        >
          <Sparkles className="w-4 h-4" />
          <div>
            <p className="font-medium text-sm">Create with AI</p>
            <p className="text-xs text-gray-500">Build from scratch</p>
          </div>
        </li>

        <li
          onClick={() => handleItem(onUploadExisting)}
          className="flex items-center gap-3 px-4 py-1 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50"
        >
          <Upload className="w-4 h-4" />
          <div>
            <p className="font-medium text-sm">Upload Existing</p>
            <p className="text-xs text-gray-500">PDF or DOCX supported</p>
          </div>
        </li>

        <li className="flex items-center gap-3 px-4 py-1 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 opacity-50 pointer-events-none">
          <Linkedin className="w-4 h-4" />
          <div>
            <p className="font-medium text-sm">Import from LinkedIn</p>
            <p className="text-xs text-gray-500">Coming soon</p>
          </div>
        </li>
      </ul>
    </div>
  );
};

export default AddResumeModal;
