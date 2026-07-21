import { MapPin, Pencil } from "lucide-react";
import { EmploymentInfo } from "@/api/userApi";

interface Props {
    emp?: Partial<EmploymentInfo>;
    onEdit: () => void;
    onDelete: () => void;
}

export default function EmploymentInfoCard({ emp, onEdit }: Props) {
    if (!emp) return null;

    const rows: { label: string; value?: string | null }[] = [
        { label: "Employment Status", value: emp.employment_status },
        { label: "Preferred Job Type", value: emp.preferred_job_type },
        { label: "Work Mode", value: emp.work_mode },
        { label: "Authorized to Work", value: emp.authorized_to_work != null ? (emp.authorized_to_work ? "Yes" : "No") : undefined },
        { label: "Willing to Relocate", value: emp.willing_to_relocate != null ? (emp.willing_to_relocate ? "Yes" : "No") : undefined },
        { label: "Disability", value: emp.disability_status },
        { label: "Gender", value: emp.gender },
        { label: "Notice Period", value: emp.notice_period_days ? `${emp.notice_period_days} days` : undefined },
    ].filter((r) => r.value != null && r.value !== "");

    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-5 py-4">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-800">Employment Preferences</p>
                <button
                    type="button"
                    onClick={onEdit}
                    data-testid="employment-info-edit-btn"
                    aria-label="Edit employment info"
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-md px-2.5 py-1.5 transition"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                </button>
            </div>

            <div className="flex flex-col gap-2 mb-4">
                {rows.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{label}</span>
                        <span className="text-xs font-medium text-gray-700 bg-gray-100 rounded-full px-2.5 py-0.5 capitalize">
                            {value}
                        </span>
                    </div>
                ))}
            </div>

            {emp.preferred_industries?.length ? (
                <TagGroup title="Preferred Industries" items={emp.preferred_industries} variant="blue" />
            ) : null}
            {emp.preferred_roles?.length ? (
                <TagGroup title="Preferred Roles" items={emp.preferred_roles} variant="green" />
            ) : null}
            {emp.preferred_locations?.length ? (
                <div className="mt-3">
                    <p className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Preferred Locations
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {emp.preferred_locations.map((loc, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-700 rounded-md px-2 py-0.5 font-medium">
                                {loc}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function TagGroup({ title, items, variant }: { title: string; items: string[]; variant: "blue" | "green" }) {
    return (
        <div className="mt-3">
            <p className="text-xs font-medium text-gray-600 mb-1.5">{title}</p>
            <div className="flex flex-wrap gap-1.5">
                {items.map((item, i) => (
                    <span key={i} className={`text-xs rounded-md px-2 py-0.5 font-medium ${
                        variant === "blue" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
                    }`}>
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}
