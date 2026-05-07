import { Certification } from "@/api/userApi";
import { ValidationError } from "../../_types/experience-types";

interface Props {
    certificationForm: Partial<Certification>;
    setCertificationForm: React.Dispatch<React.SetStateAction<Partial<Certification>>>;
    onSave: () => void;
    onCancel: () => void;
    loading: boolean;
    validationErrors: ValidationError[];
}

export default function CertificationForm({
    certificationForm,
    setCertificationForm,
    onSave,
    onCancel,
    loading,
    validationErrors,
}: Props) {
    const getFieldError = (field: string) => {
        const error = validationErrors.find(
            (err) => err.field === `body.${field}` || err.field === field
        );
        return error?.message;
    };

    const toISODate = (value: string): string => {
        const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
        const match = value.match(ddmmyyyy);
        if (match) return `${match[3]}-${match[2]}-${match[1]}`;
        return value;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isDateField = name === 'start_date' || name === 'end_date';
        setCertificationForm((prev) => ({ ...prev, [name]: isDateField ? toISODate(value) : value }));
    };

    return (
        <div className="mb-4 border border-neutral-200 rounded-lg p-4 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">Certification</label>
                    <input
                        type="text"
                        name="certification_name"
                        value={certificationForm.certification_name || ""}
                        onChange={handleChange}
                        className={`border p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("certification_name")
                            ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                            : "border-neutral-200"
                            }`}
                    />
                    {getFieldError("certification_name") && (
                        <p className="text-red-600 text-xs mt-1">{getFieldError("certification_name")}</p>
                    )}
                </div>
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">Issuer</label>
                    <input
                        type="text"
                        name="issuer"
                        value={certificationForm.issuer || ""}
                        onChange={handleChange}
                        className={`border p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("issuer")
                            ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                            : "border-neutral-200"
                            }`}
                    />
                    {getFieldError("issuer") && (
                        <p className="text-red-600 text-xs mt-1">{getFieldError("issuer")}</p>
                    )}
                </div>
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">Start Date</label>
                    <input
                        type="date"
                        name="start_date"
                        value={certificationForm.start_date || ""}
                        onChange={handleChange}
                        className={`border p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("start_date")
                            ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                            : "border-neutral-200"
                            }`}
                    />
                    {getFieldError("start_date") && (
                        <p className="text-red-600 text-xs mt-1">{getFieldError("start_date")}</p>
                    )}
                </div>
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">End Date</label>
                    <input
                        type="date"
                        name="end_date"
                        value={certificationForm.end_date || ""}
                        onChange={handleChange}
                        className={`border p-2.5 text-sm rounded-lg bg-gray-100 outline-neutral-500 transition-colors ${getFieldError("end_date")
                            ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
                            : "border-neutral-200"
                            }`}
                    />
                    {getFieldError("end_date") && (
                        <p className="text-red-600 text-xs mt-1">{getFieldError("end_date")}</p>
                    )}
                </div>
            </div>
            <div className="col-span-2 flex gap-2 justify-end mt-3">
                <button
                    type="button"
                    onClick={onSave}
                    disabled={loading}
                    className="bg-[#155DFC] text-white px-4 py-1.5 cursor-pointer rounded disabled:opacity-50"
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}