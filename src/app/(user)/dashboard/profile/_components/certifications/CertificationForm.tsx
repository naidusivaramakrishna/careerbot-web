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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setCertificationForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="mb-4 border border-neutral-200 rounded-lg p-4 flex flex-col gap-2">
            <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold">Certification</label>
                    <input
                        type="text"
                        name="certification_name"
                        value={certificationForm.certification_name || ""}
                        onChange={handleChange}
                        className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
                    />
                    {getFieldError("certification_name") && (
                        <p className="text-red-500 text-sm mt-1">{getFieldError("certification_name")}</p>
                    )}
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold">Issuer</label>
                    <input
                        type="text"
                        name="issuer"
                        value={certificationForm.issuer || ""}
                        onChange={handleChange}
                        className="border border-neutral-200 p-2.5 text-sm  rounded-lg bg-white outline-neutral-500"
                    />
                    {getFieldError("issuer") && (
                        <p className="text-red-500 text-sm mt-1">{getFieldError("issuer")}</p>
                    )}
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold">Issue Date</label>
                    <input
                        type="date"
                        name="start_date"
                        value={certificationForm.start_date || ""}
                        onChange={handleChange}
                        className="border border-neutral-200 p-2.5 text-sm  rounded-lg bg-white outline-neutral-500"
                    />
                    {getFieldError("start_date") && (
                        <p className="text-red-500 text-sm mt-1">{getFieldError("start_date")}</p>
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
