import { FileText, Plus } from "lucide-react";

export default function EmploymentInfoEmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="border border-dashed border-neutral-400 rounded-xl py-16 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#d6e5fe] flex items-center justify-center">
                <FileText className="w-7 h-7 text-[#2257a7]" />
            </div>
            <h3 className="text-lg font-semibold">Add Employment Info</h3>
            <p className="text-sm text-neutral-500">
                Include details like gender,disability,relocate,workmode,job_type etc
            </p>
            <button
                onClick={onAdd}
                className="mt-2 border-2 border-[#2257a7] text-[#2257a7] px-6 py-2 rounded-lg font-semibold cursor-pointer flex items-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Add Employment Info
            </button>
        </div>
    );
}
