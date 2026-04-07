"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface Props {
  formData: {
    certificates: { name: string }[];
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFormData: (data: any) => void;
}

const CertificatesEditor: React.FC<Props> = ({ formData, setFormData }) => {
  const [input, setInput] = useState("");

  const certificates = formData.certificates || [];

  const addCertificate = () => {
    if (!input.trim()) return;

    setFormData({
      ...formData,
      certificates: [
        ...certificates,
        { name: input.trim() },
      ],
    });

    setInput("");
  };

  const removeCertificate = (idx: number) => {
    setFormData({
      ...formData,
      certificates: certificates.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="grid grid-cols-2 gap-10">
      {/* LEFT SIDE */}
      <div>
        <p className="text-sm font-medium mb-2">
          Show your certificates, licenses, and training in your field.
        </p>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCertificate();
            }
          }}
          placeholder="e.g. CPR Certified. Press Enter to add new."
          className="w-full border-b-2 border-blue-600 py-2 text-sm focus:outline-none"
        />

        {/* LIST */}
        <div className="mt-6 space-y-3">
          {certificates.map((cert, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
            >
              <span className="text-sm">{cert.name}</span>
              <button onClick={() => removeCertificate(idx)}>
                <X className="w-4 h-4 text-gray-500 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE – TIPS */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Tips</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          Professional certifications are a great way to stand out from the
          crowd in your job search. Some jobs require specific certifications,
          and including certifications can help showcase your skills and
          abilities with an objective measure.
          <br />
          <br />
          Extra certifications can also be a great way to show your interests
          and proficiencies outside of work. Press enter to save and add
          another.
          <br />
          <br />
          Include name of certification, certifying organization and date
          received. List job-critical certifications at the top of the list,
          and consider adding them in your resume summary and work experience
          as well.
        </p>
      </div>
    </div>
  );
};

export default CertificatesEditor;
