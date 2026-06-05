"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  sectionKey: string;
  sectionLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (key: string, data: any) => void;
  onClose: () => void;
}

/* ── Section tips for ATS Suggestions panel ── */
const SECTION_TIPS: Record<string, string[]> = {
  contact: [
    "Use a professional email address — avoid nicknames or numbers.",
    "Include your LinkedIn URL to boost recruiter trust.",
    "Keep location as City, State — avoid a full home address.",
  ],
  summary: [
    "Keep your summary to 3–5 sentences.",
    "Start with your job title and years of experience.",
    "Include 2–3 key skills relevant to the target role.",
  ],
  skills: [
    "List 8–15 relevant technical skills.",
    "Match keywords directly from the job description.",
    "Avoid listing generic soft skills in this section.",
  ],
  softSkills: [
    "Focus on skills relevant to leadership and collaboration.",
    "Avoid overused buzzwords like 'hardworking' or 'team player'.",
    "Pick soft skills that are reflected in your experience bullets.",
  ],
  experience: [
    "Start each bullet with a strong action verb (Led, Built, Improved).",
    "Quantify achievements wherever possible (e.g. 40% faster).",
    "Keep descriptions concise — 2–4 bullets per role.",
  ],
  internships: [
    "Treat internship bullets the same as full-time experience.",
    "Highlight what you delivered, not just what you learned.",
    "Include company name and duration clearly.",
  ],
  education: [
    "Include GPA if it is above 3.0 / 8.0 CGPA.",
    "List most recent education first.",
    "Include relevant coursework if you are a fresher.",
  ],
  projects: [
    "Include a GitHub or live demo link where possible.",
    "Mention the technologies used in each project.",
    "Describe the problem solved, not just what was built.",
  ],
  certifications: [
    "Include the issuing authority and exact year.",
    "Prioritize certifications relevant to the job role.",
    "Use the exact certification name as issued.",
  ],
  achievements: [
    "Focus on quantifiable or competitive achievements.",
    "Include rank, recognition level, or award scope.",
    "Keep each achievement to 1–2 sentences.",
  ],
  languages: [
    "Be honest about proficiency levels.",
    "Native / Fluent languages are most valued by employers.",
  ],
  hobbies: [
    "Keep hobbies relevant or unique — avoid generic ones.",
    "Only include if you have space on your resume.",
  ],
};

/* ── shared field ── */
const Field = ({
  label, value, onChange, multiline = false, placeholder = "", required = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string; required?: boolean;
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {multiline ? (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors bg-gray-50 focus:bg-white"
      />
    ) : (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors bg-gray-50 focus:bg-white"
      />
    )}
  </div>
);

/* ── Contact editor ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ContactEditor = ({ value, onChange }: { value: any; onChange: (v: any) => void }) => {
  const portfolioStr =
    typeof value.portfolio === "string"
      ? value.portfolio
      : typeof value.portfolio === "object" && value.portfolio
      ? value.portfolio.url || value.portfolio.link || value.portfolio.website || ""
      : "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name" required value={value.name || ""} onChange={v => onChange({ ...value, name: v })} placeholder="e.g. John Smith" />
        <Field label="Email" required value={value.email || ""} onChange={v => onChange({ ...value, email: v })} placeholder="john@example.com" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone Number" required value={value.phone || ""} onChange={v => onChange({ ...value, phone: v })} placeholder="+91 9876543210" />
        <Field label="Location" required value={value.location || ""} onChange={v => onChange({ ...value, location: v })} placeholder="City, Country" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="LinkedIn URL" value={value.linkedin || ""} onChange={v => onChange({ ...value, linkedin: v })} placeholder="linkedin.com/in/username" />
        <Field label="GitHub URL" value={value.github || ""} onChange={v => onChange({ ...value, github: v })} placeholder="github.com/username" />
      </div>
      <Field label="Portfolio URL" value={portfolioStr} onChange={v => onChange({ ...value, portfolio: v })} placeholder="https://yourportfolio.com" />
    </div>
  );
};

/* ── Summary editor ── */
const SummaryEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Professional Summary</label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={8}
      placeholder="Write a compelling professional summary that highlights your key skills and experience..."
      className="w-full px-3.5 py-2.5 text-sm text-gray-700 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors bg-gray-50 focus:bg-white"
    />
    <p className="text-[11px] text-gray-400 mt-1.5">{value.length} characters</p>
  </div>
);

/* ── Tags editor ── */
const TagsEditor = ({ value, onChange, placeholder }: {
  value: string[]; onChange: (v: string[]) => void; placeholder: string;
}) => {
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim();
    if (t && !value.includes(t)) { onChange([...value, t]); setInput(""); }
  };
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Skills</label>
      <div className="flex gap-2 mb-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-gray-50 focus:bg-white"
        />
        <button onClick={add} className="px-4 py-2.5 bg-[#2557a7] text-white rounded-lg hover:bg-[#1e4a96] transition-colors text-sm font-semibold">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50 rounded-lg border border-gray-200">
        {value.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-white text-gray-700 border border-gray-200 rounded-full shadow-sm">
            {tag}
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="hover:text-red-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {value.length === 0 && <p className="text-xs text-gray-400 italic self-center">Type above and press Enter or + to add skills.</p>}
      </div>
    </div>
  );
};

/* ── Experience / Internship item ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ExpItem = ({ item, onChange, onRemove }: { item: any; onChange: (v: any) => void; onRemove: () => void }) => {
  const [open, setOpen] = useState(true);
  const desc = Array.isArray(item.description) ? item.description.join("\n") : (item.description || "");
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none" role="button" tabIndex={0} onClick={() => setOpen(o => !o)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(o => !o)}>
        <span className="text-sm font-semibold text-gray-700 truncate">{item.role || item.title || "New Entry"}</span>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={e => { e.stopPropagation(); onRemove(); }} className="text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </div>
      {open && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role / Title" value={item.role || item.title || ""} onChange={v => onChange({ ...item, role: v, title: v })} placeholder="e.g. Frontend Developer" />
            <Field label="Company" value={item.company || item.organization || ""} onChange={v => onChange({ ...item, company: v })} placeholder="e.g. Google" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date" value={item.startDate || item.start_date || ""} onChange={v => onChange({ ...item, startDate: v, start_date: v })} placeholder="e.g. Jan 2022" />
            <Field label="End Date" value={item.endDate || item.end_date || ""} onChange={v => onChange({ ...item, endDate: v, end_date: v })} placeholder="Present" />
          </div>
          <Field label="Location" value={item.location || ""} onChange={v => onChange({ ...item, location: v })} placeholder="City, Country" />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Responsibilities <span className="text-gray-400 font-normal">(one per line)</span></label>
            <textarea
              value={desc}
              onChange={e => onChange({ ...item, description: e.target.value.split("\n") })}
              rows={4}
              placeholder={"- Led development of key features\n- Collaborated with cross-functional teams"}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Education item ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EduItem = ({ item, onChange, onRemove }: { item: any; onChange: (v: any) => void; onRemove: () => void }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none" role="button" tabIndex={0} onClick={() => setOpen(o => !o)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(o => !o)}>
        <span className="text-sm font-semibold text-gray-700 truncate">{item.degree || item.qualification || "New Entry"}</span>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={e => { e.stopPropagation(); onRemove(); }} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </div>
      {open && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Degree" value={item.degree || item.qualification || ""} onChange={v => onChange({ ...item, degree: v })} placeholder="e.g. B.Tech" />
            <Field label="Branch / Field" value={item.branch || item.field || item.specialization || ""} onChange={v => onChange({ ...item, branch: v })} placeholder="e.g. Computer Science" />
          </div>
          <Field label="School / University" value={item.school || item.institution || item.university || item.college || ""} onChange={v => onChange({ ...item, school: v })} placeholder="e.g. IIT Delhi" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Year" value={item.startDate || item.start_date || item.from || ""} onChange={v => onChange({ ...item, startDate: v })} placeholder="e.g. 2019" />
            <Field label="End Year" value={item.endDate || item.end_date || item.graduation_year || item.year || ""} onChange={v => onChange({ ...item, endDate: v })} placeholder="e.g. 2023" />
          </div>
          <Field label="Grade / CGPA / Percentage" value={item.grade || item.gpa || item.cgpa || item.percentage || ""} onChange={v => onChange({ ...item, grade: v })} placeholder="e.g. 8.5 CGPA" />
        </div>
      )}
    </div>
  );
};

/* ── Project item ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProjItem = ({ item, onChange, onRemove }: { item: any; onChange: (v: any) => void; onRemove: () => void }) => {
  const [open, setOpen] = useState(true);
  const tech = Array.isArray(item.technologies) ? item.technologies.join(", ") : (item.technologies || "");
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none" role="button" tabIndex={0} onClick={() => setOpen(o => !o)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(o => !o)}>
        <span className="text-sm font-semibold text-gray-700 truncate">{item.title || item.name || "New Project"}</span>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={e => { e.stopPropagation(); onRemove(); }} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </div>
      {open && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Project Title" value={item.title || item.name || ""} onChange={v => onChange({ ...item, title: v, name: v })} placeholder="e.g. Portfolio Website" />
            <Field label="Link / URL" value={item.link || item.url || ""} onChange={v => onChange({ ...item, link: v })} placeholder="https://github.com/..." />
          </div>
          <Field label="Description" value={item.description || item.summary || ""} onChange={v => onChange({ ...item, description: v })} multiline placeholder="Brief project description..." />
          <Field label="Technologies (comma separated)" value={tech} onChange={v => onChange({ ...item, technologies: v.split(",").map((t: string) => t.trim()).filter(Boolean) })} placeholder="React, Node.js, MongoDB" />
        </div>
      )}
    </div>
  );
};

/* ── Generic list editor ── */
const SimpleListEditor = ({ value, onChange, addLabel, fields, defaultItem }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (v: any[]) => void;
  addLabel: string;
  fields: { key: string; label: string; placeholder?: string; multiline?: boolean }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultItem: any;
}) => (
  <div className="space-y-3">
    {value.map((item, idx) => (
      <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex justify-end">
          <button onClick={() => onChange(value.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {fields.map(f => (
          <Field key={f.key} label={f.label} value={typeof item === "string" ? item : (item[f.key] || "")}
            onChange={v => onChange(value.map((x, i) => i === idx ? (typeof x === "string" ? v : { ...x, [f.key]: v }) : x))}
            placeholder={f.placeholder} multiline={f.multiline} />
        ))}
      </div>
    ))}
    <button onClick={() => onChange([...value, defaultItem])}
      className="w-full py-3 text-sm text-[#2557a7] font-semibold border border-dashed border-blue-200 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5">
      <Plus className="w-3.5 h-3.5" /> {addLabel}
    </button>
  </div>
);

/* ══ MAIN MODAL ══ */
const JobMatchSectionEditor: React.FC<Props> = ({ sectionKey, sectionLabel, initialData, onSave, onClose }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localData, setLocalData] = useState<any>(initialData);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => { setLocalData(initialData); setSavedAt(null); }, [sectionKey, initialData]);

  const tips = SECTION_TIPS[sectionKey] || ["Review this section for accuracy and completeness."];

  const renderBody = () => {
    switch (sectionKey) {
      case "contact":
        return <ContactEditor value={localData ?? {}} onChange={setLocalData} />;
      case "summary":
        return <SummaryEditor value={typeof localData === "string" ? localData : ""} onChange={setLocalData} />;
      case "skills":
        return <TagsEditor value={Array.isArray(localData) ? localData : []} onChange={setLocalData} placeholder="Add technical skill (e.g. React)…" />;
      case "softSkills":
        return <TagsEditor value={Array.isArray(localData) ? localData : []} onChange={setLocalData} placeholder="Add soft skill (e.g. Leadership)…" />;
      case "experience":
      case "internships": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: any[] = Array.isArray(localData) ? localData : [];
        return (
          <div className="space-y-3">
            {list.map((item, idx) => (
              <ExpItem key={idx} item={item} onChange={v => setLocalData(list.map((x, i) => i === idx ? v : x))} onRemove={() => setLocalData(list.filter((_, i) => i !== idx))} />
            ))}
            <button onClick={() => setLocalData([...list, { role: "", company: "", startDate: "", endDate: "", description: [] }])}
              className="w-full py-3 text-sm text-[#2557a7] font-semibold border border-dashed border-blue-200 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Entry
            </button>
          </div>
        );
      }
      case "education": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: any[] = Array.isArray(localData) ? localData : [];
        return (
          <div className="space-y-3">
            {list.map((item, idx) => (
              <EduItem key={idx} item={item} onChange={v => setLocalData(list.map((x, i) => i === idx ? v : x))} onRemove={() => setLocalData(list.filter((_, i) => i !== idx))} />
            ))}
            <button onClick={() => setLocalData([...list, { degree: "", branch: "", school: "", startDate: "", endDate: "", grade: "" }])}
              className="w-full py-3 text-sm text-[#2557a7] font-semibold border border-dashed border-blue-200 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Education
            </button>
          </div>
        );
      }
      case "projects": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: any[] = Array.isArray(localData) ? localData : [];
        return (
          <div className="space-y-3">
            {list.map((item, idx) => (
              <ProjItem key={idx} item={item} onChange={v => setLocalData(list.map((x, i) => i === idx ? v : x))} onRemove={() => setLocalData(list.filter((_, i) => i !== idx))} />
            ))}
            <button onClick={() => setLocalData([...list, { title: "", description: "", technologies: [], link: "" }])}
              className="w-full py-3 text-sm text-[#2557a7] font-semibold border border-dashed border-blue-200 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Project
            </button>
          </div>
        );
      }
      case "certifications":
        return <SimpleListEditor value={Array.isArray(localData) ? localData : []} onChange={setLocalData} addLabel="Add Certification" defaultItem={{ name: "", issuedBy: "", year: "" }}
          fields={[{ key: "name", label: "Certification Name", placeholder: "e.g. AWS Solutions Architect" }, { key: "issuedBy", label: "Issued By", placeholder: "e.g. Amazon Web Services" }, { key: "year", label: "Year", placeholder: "e.g. 2023" }]} />;
      case "achievements":
        return <SimpleListEditor value={Array.isArray(localData) ? localData : []} onChange={setLocalData} addLabel="Add Achievement" defaultItem={{ title: "", description: "" }}
          fields={[{ key: "title", label: "Title", placeholder: "e.g. 1st place at National Hackathon" }, { key: "description", label: "Description", placeholder: "Brief description…", multiline: true }]} />;
      case "languages":
        return <SimpleListEditor value={Array.isArray(localData) ? localData : []} onChange={setLocalData} addLabel="Add Language" defaultItem={{ language: "", proficiency: "" }}
          fields={[{ key: "language", label: "Language", placeholder: "e.g. English" }, { key: "proficiency", label: "Proficiency", placeholder: "e.g. Native, Fluent, Intermediate" }]} />;
      default:
        return <p className="text-sm text-gray-400 italic">No editor available for this section.</p>;
    }
  };

  const handleSave = () => {
    onSave(sectionKey, localData);
    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col mx-4">

        {/* Header — centered title like Resume Builder */}
        <div className="relative flex items-center justify-center px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-[17px] font-bold text-gray-900">{sectionLabel}</h2>
          <button onClick={onClose} className="absolute right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body — form left + ATS suggestions right */}
        <div className="flex-1 overflow-hidden flex min-h-0">

          {/* Form area */}
          <div className="flex-1 overflow-y-auto p-6 jm-sidebar-scroll" style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
            {renderBody()}
          </div>

          {/* ATS Suggestions panel */}
          <div className="w-[260px] shrink-0 border-l border-gray-100 bg-[#fffef5] p-5 overflow-y-auto jm-sidebar-scroll" style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
            <h3 className="text-[13px] font-bold text-gray-800 mb-3">ATS Suggestions</h3>
            <hr className="border-gray-200 mb-4" />

            <div className="space-y-4">
              {tips.map((tip, i) => (
                <div key={i}>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-amber-100 text-amber-700 rounded border border-amber-200 uppercase tracking-wide">
                    ● Manual Fix
                  </span>
                  <p className="text-[12px] text-gray-600 mt-2 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed mt-5 italic border-t border-gray-100 pt-4">
              * Auto Fix buttons apply changes automatically. Manual Fix items require your own edits.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0">
          <div>
            {savedAt && (
              <span className="text-[12px] text-green-600 font-semibold">✓ Saved {savedAt}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-semibold text-white bg-[#2557a7] hover:bg-[#1e4a96] rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default JobMatchSectionEditor;
