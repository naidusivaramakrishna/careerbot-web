import { Linkedin, Sparkles, Upload } from "lucide-react";

const AddResumeModal = ({ isOpen }: {
    isOpen: boolean;
    onClose: () => void;
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="absolute bg-white rounded-2xl w-80 p-5 shadow-xl border border-neutral-200 z-50"
            style={{
                top: "calc(100% + 10px)",
                right: 0,
            }}
        >
            <ul className="space-y-2">
                <li className="flex items-center gap-3 px-4 py-1 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <Sparkles className="w-4 h-4" />
                    <div>
                        <p className="font-medium text-sm">Create with AI</p>
                        <p className="text-xs text-gray-500">Build from scratch</p>
                    </div>
                </li>
                <li className="flex items-center gap-3 px-4 py-1 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    <div>
                        <p className="font-medium text-sm">Upload Existing</p>
                        <p className="text-xs text-gray-500">PDF or DOCX supported</p>
                    </div>
                </li>
                <li className="flex items-center gap-3 px-4 py-1 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <Linkedin className="w-4 h-4" />
                    <div>
                        <p className="font-medium text-sm">Import from LinkedIn</p>
                        <p className="text-xs text-gray-500">Quick setup</p>
                    </div>
                </li>
            </ul>
        </div>
    );
};

export default AddResumeModal
