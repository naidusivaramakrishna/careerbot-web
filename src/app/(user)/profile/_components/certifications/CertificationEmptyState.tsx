import { Award, Plus } from "lucide-react";

export default function CertificationEmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="border border-dashed border-gray-200 rounded-xl py-12 flex flex-col items-center gap-3 bg-gray-50/50">
            <div className="w-12 h-12 rounded-xl bg-[#EEF3FB] flex items-center justify-center">
                <Award className="w-6 h-6 text-[#2257a7]" />
            </div>
            <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-800">No certifications added yet</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Showcase your professional certifications and licenses to strengthen your profile.
                </p>
            </div>
            <button
                type="button"
                data-testid="add-certification-btn"
                onClick={onAdd}
                className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#2257a7] border border-[#2257a7] bg-[#EEF3FB] hover:bg-[#dde8f7] px-4 py-2 rounded-lg transition"
            >
                <Plus className="w-4 h-4" />
                Add Certification
            </button>
        </div>
    );
}
