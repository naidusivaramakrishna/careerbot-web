import { Pencil, Trash2, MapPin } from "lucide-react";
import { EmploymentInfo } from "@/api/userApi";

interface Props {
    emp?: Partial<EmploymentInfo>;
    onEdit: () => void;
    onDelete: () => void;
}

export default function EmploymentInfoCard({
    emp,
    onEdit,
    onDelete,
}: Props) {
    if (!emp) return null;

    return (
        <div className="mb-4 bg-white border border-gray-300 rounded-xl py-6 shadow-sm px-4 gap-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-lg font-semibold">Employment Info</h1>
                {/* ACTIONS */}
                <div className="flex gap-2 mt-1">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="bg-background text-sm cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md flex items-center gap-2"
                    >
                        <Pencil className="w-4 h-4" />
                        Edit
                    </button>
                </div>
            </div>
            <div className="mb-4 w-full">
                {/* LEFT CONTENT */}
                <div className="flex flex-col gap-3">
                    {/* TAGS */}
                    <div className="flex flex-col gap-2">
                        {emp.employment_status && (
                            <div className="flex gap-8 ">
                                <span className="text-sm w-1/2">Employment status ?</span>
                                <span className=" px-3 py-1 rounded-lg bg-[#f2f4f5] text-sm font-semibold">
                                    {emp.employment_status}
                                </span>
                            </div>
                        )}
                        {emp.preferred_job_type && (
                            <div className="flex gap-8">
                                <span className="text-sm w-1/2">Preferred Job type ?</span>
                                <span className="px-3 py-1 rounded-lg bg-[#f2f4f5] text-sm font-semibold">
                                    {emp.preferred_job_type}
                                </span>
                            </div>
                        )}
                        {emp.work_mode && (
                            <div className="flex gap-8">
                                <span className="text-sm w-1/2">Work Mode ?</span>
                                <span className="px-3 py-1 rounded-lg bg-[#f2f4f5] text-sm font-semibold">
                                    {emp.work_mode}
                                </span>
                            </div>
                        )}
                        <div className="flex gap-8">
                            <span className="text-sm w-1/2">Authorized to work ?</span>
                            <span className="px-3 py-1 rounded-lg bg-[#f2f4f5] text-sm font-semibold">
                                {emp.authorized_to_work ? "Yes" : "No"}
                            </span>
                        </div>
                        <div className="flex gap-8">
                            <span className="text-sm w-1/2">Willing to Relocate ?</span>
                            <span className="px-3 py-1 rounded-lg bg-[#f2f4f5] text-sm font-semibold">
                                {emp.willing_to_relocate ? "Yes" : "No"}
                            </span>
                        </div>
                        {emp.disability_status && (
                            <div className="flex gap-8">
                                <span className="text-sm w-1/2">Disability ?</span>
                                <span className="px-3 py-1 rounded-lg bg-[#f2f4f5] text-sm font-semibold">
                                    {emp.disability_status}
                                </span>
                            </div>
                        )}
                        {emp.gender && (
                            <div className="flex gap-8">
                                <span className="text-sm w-1/2">Gender ?</span>
                                <span className="px-3 py-1 rounded-lg bg-[#f2f4f5] text-sm font-semibold">
                                    {emp.gender}
                                </span>
                            </div>
                        )}
                        {emp.notice_period_days && (
                            <div className="flex gap-8">
                                <span className="text-sm w-1/2">Notice Period ?</span>
                                <span className="px-3 py-1 rounded-lg bg-[#f2f4f5] text-sm font-semibold">
                                    {emp.notice_period_days} days
                                </span>
                            </div>
                        )}
                    </div>

                    {/* PREFERRED INDUSTRIES */}
                    {emp.preferred_industries?.length ? (
                        <TagGroup
                            title="Preferred Industries"
                            items={emp.preferred_industries}
                            variant="blue"
                        />
                    ) : null}

                    {/* PREFERRED ROLES */}
                    {emp.preferred_roles?.length ? (
                        <TagGroup
                            title="Preferred Roles"
                            items={emp.preferred_roles}
                            variant="green"
                        />
                    ) : null}

                    {/* PREFERRED LOCATIONS */}
                    {emp.preferred_locations?.length ? (
                        <div>
                            <p className="font-semibold text-sm mb-1 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                Preferred Locations
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {emp.preferred_locations.map((loc, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-1 rounded-md bg-neutral-100 text-neutral-700 text-xs font-semibold"
                                    >
                                        {loc}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

/* ---------------- HELPER ---------------- */

function TagGroup({
    title,
    items,
    variant,
}: {
    title: string;
    items: string[];
    variant: "blue" | "green";
}) {
    return (
        <div>
            <p className="font-semibold text-sm mb-1">{title}</p>
            <div className="flex flex-wrap gap-2">
                {items.map((item, i) => (
                    <span
                        key={i}
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${variant === "blue"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-green-50 text-green-700"
                            }`}
                    >
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}
