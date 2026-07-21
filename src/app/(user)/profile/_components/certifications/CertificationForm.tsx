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

    const inputClass = (field: string) =>
        `w-full border text-sm rounded-lg px-3 py-2.5 bg-gray-50 outline-none transition
         focus:ring-2 focus:ring-[#2257a7]/20 focus:border-[#2257a7] focus:bg-white
         ${getFieldError(field)
            ? "border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-400"
            : "border-gray-200 hover:border-gray-300"
        }`;

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Certification Name</label>
                    <input type="text" name="certification_name" id="cert-name" data-testid="cert-name-input"
                        value={certificationForm.certification_name || ""} onChange={handleChange} className={inputClass("certification_name")} />
                    {getFieldError("certification_name") && <p role="alert" className="text-red-500 text-xs">{getFieldError("certification_name")}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Issuer</label>
                    <input type="text" name="issuer" id="cert-issuer" data-testid="cert-issuer-input"
                        value={certificationForm.issuer || ""} onChange={handleChange} className={inputClass("issuer")} />
                    {getFieldError("issuer") && <p role="alert" className="text-red-500 text-xs">{getFieldError("issuer")}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Start Date</label>
                    <input type="date" name="start_date" id="cert-start-date" data-testid="cert-start-date-input"
                        value={certificationForm.start_date || ""} onChange={handleChange} className={inputClass("start_date")} />
                    {getFieldError("start_date") && <p role="alert" className="text-red-500 text-xs">{getFieldError("start_date")}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">End Date</label>
                    <input type="date" name="end_date" id="cert-end-date" data-testid="cert-end-date-input"
                        value={certificationForm.end_date || ""} onChange={handleChange} className={inputClass("end_date")} />
                    {getFieldError("end_date") && <p role="alert" className="text-red-500 text-xs">{getFieldError("end_date")}</p>}
                </div>
            </div>

            <div className="flex gap-2 justify-end pt-1 border-t border-gray-100">
                <button type="button" onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg transition">
                    Cancel
                </button>
                <button type="button" data-testid="cert-save-btn" onClick={onSave} disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#2257a7] hover:bg-[#1a4590] rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}
