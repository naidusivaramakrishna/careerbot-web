import React from "react";
import { useResume } from "../../../_context/ResumeContext";
import { useValidation } from "../../../_hooks/useValidation";

interface CertificationEntry {
  name: string;
  issuedBy?: string;
  year?: string;
}

const Certifications: React.FC = () => {
  const { resumeData, setResumeData } = useResume();
  const {
    errors,
    validateRequired,
    clearError,
    clearSectionIndexErrors,
    reindexErrors,
  } = useValidation();

  const handleChange = (index: number, field: keyof CertificationEntry, value: string) => {
    const updated = [...(resumeData.certifications || [])];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData({ ...resumeData, certifications: updated });
    clearError("cert", index, field); // ✅ clear error while typing
  };

  const addCertification = () => {
    setResumeData({
      ...resumeData,
      certifications: [
        ...(resumeData.certifications || []),
        { name: "", issuedBy: "", year: "" },
      ],
    });
  };

  const removeCertification = (index: number) => {
    const updated = [...(resumeData.certifications || [])];
    updated.splice(index, 1);
    setResumeData({ ...resumeData, certifications: updated });

    clearSectionIndexErrors("cert", index); // ✅ clear removed field errors
    reindexErrors("cert", index); // ✅ reindex shifted items
  };

  return (
    <div className="flex flex-col gap-6 ml-8 mt-3">
      {(resumeData.certifications || []).map((cert: CertificationEntry, index: number) => (
        <div key={index} className="flex flex-col gap-3 border-b pb-4">
          {/* Certification Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Certification Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cert.name}
              placeholder="Enter Certification Name"
              onChange={(e) => handleChange(index, "name", e.target.value)}
              onBlur={() => validateRequired("cert", index, { name: cert.name })} // ✅ validate on blur
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
            {errors[`cert-${index}-name`] && (
              <span className="text-xs text-red-500">{errors[`cert-${index}-name`]}</span>
            )}
          </div>

          {/* Issued By */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">Issued By</label>
            <input
              type="text"
              value={cert.issuedBy || ""}
              placeholder="Enter Issued By"
              onChange={(e) => handleChange(index, "issuedBy", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
          </div>

          {/* Year */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">Year</label>
            <input
              type="text"
              value={cert.year || ""}
              placeholder="Enter Year"
              onChange={(e) => handleChange(index, "year", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-black border-gray-300 hover:border-gray-700"
            />
          </div>

          {/* Remove Button */}
          <button
            type="button"
            onClick={() => removeCertification(index)}
            className="self-start text-xs text-red-500 hover:underline mt-1"
          >
            Remove
          </button>
        </div>
      ))}

      {/* Add Certification Button */}
      <button
        type="button"
        onClick={addCertification}
        className="w-fit px-10 py-2 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        + Add Certification
      </button>
    </div>
  );
};

export default Certifications;

