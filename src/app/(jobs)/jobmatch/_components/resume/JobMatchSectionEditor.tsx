"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  sectionKey: string;
  sectionLabel: string;
  initialData: any;
  onSave: (key: string, data: any) => void;
  onClose: () => void;
}

/* ── shared field ── */
const Field = ({
  label, value, onChange, multiline = false, placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string;
}) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
    {multiline ? (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
      />
    ) : (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
      />
    )}
  </div>
);

/* ── Contact editor ── */
const ContactEditor = ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <Field label="Full Name" value={value.name || ""} onChange={v => onChange({ ...value, name: v })} placeholder="e.g. John Smith" />
      <Field label="Title / Role" value={value.title || ""} onChange={v => onChange({ ...value, title: v })} placeholder="e.g. Frontend Developer" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Field label="Email" value={value.email || ""} onChange={v => onChange({ ...value, email: v })} placeholder="john@example.com" />
      <Field label="Phone" value={value.phone || ""} onChange={v => onChange({ ...value, phone: v })} placeholder="+91 9876543210" />
    </div>
    <Field label="Location" value={value.location || ""} onChange={v => onChange({ ...value, location: v })} placeholder="City, Country" />
    <div className="grid grid-cols-2 gap-3">
      <Field label="LinkedIn URL" value={value.linkedin || ""} onChange={v => onChange({ ...value, linkedin: v })} placeholder="linkedin.com/in/..." />
      <Field label="GitHub URL" value={value.github || ""} onChange={v => onChange({ ...value, github: v })} placeholder="github.com/..." />
    </div>
    <Field label="Portfolio / Website" value={value.portfolio || ""} onChange={v => onChange({ ...value, portfolio: v })} placeholder="https://yourportfolio.com" />
  </div>
);

/* ── Summary editor ── */
const SummaryEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    rows={7}
    placeholder="Write a compelling professional summary..."
    className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
  />
);

/* ── Tags editor (skills / soft-skills) ── */
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
      <div className="flex gap-2 mb-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
        />
        <button onClick={add} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {value.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            {tag}
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="hover:text-red-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {value.length === 0 && <p className="text-xs text-gray-400 italic">No items yet. Type and press Enter or + to add.</p>}
      </div>
    </div>
  );
};

/* ── Experience / Internship item ── */
const ExpItem = ({ item, onChange, onRemove }: { item: any; onChange: (v: any) => void; onRemove: () => void }) => {
  const [open, setOpen] = useState(true);
  const desc = Array.isArray(item.description) ? item.description.join("\n") : (item.description || "");
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer select-none" role="button" tabIndex={0} onClick={() => setOpen(o => !o)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(o => !o)}>
        <span className="text-sm font-medium text-gray-700 truncate">{item.role || item.title || "New Entry"}</span>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={e => { e.stopPropagation(); onRemove(); }} className="text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </div>
      {open && (
        <div className="p-3 space-y-3">
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
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Responsibilities (one per line)</label>
            <textarea
              value={desc}
              onChange={e => onChange({ ...item, description: e.target.value.split("\n") })}
              rows={4}
              placeholder="- Led development of key features&#10;- Collaborated with cross-functional teams"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Education item ── */
const EduItem = ({ item, onChange, onRemove }: { item: any; onChange: (v: any) => void; onRemove: () => void }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer select-none" role="button" tabIndex={0} onClick={() => setOpen(o => !o)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(o => !o)}>
        <span className="text-sm font-medium text-gray-700 truncate">{item.degree || item.qualification || "New Entry"}</span>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={e => { e.stopPropagation(); onRemove(); }} className="text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </div>
      {open && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Degree" value={item.degree || item.qualification || ""} onChange={v => onChange({ ...item, degree: v })} placeholder="e.g. B.Tech / B.E." />
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
const ProjItem = ({ item, onChange, onRemove }: { item: any; onChange: (v: any) => void; onRemove: () => void }) => {
  const [open, setOpen] = useState(true);
  const tech = Array.isArray(item.technologies) ? item.technologies.join(", ") : (item.technologies || "");
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer select-none" role="button" tabIndex={0} onClick={() => setOpen(o => !o)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(o => !o)}>
        <span className="text-sm font-medium text-gray-700 truncate">{item.title || item.name || "New Project"}</span>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={e => { e.stopPropagation(); onRemove(); }} className="text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </div>
      {open && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Project Title" value={item.title || item.name || ""} onChange={v => onChange({ ...item, title: v, name: v })} placeholder="e.g. Portfolio Website" />
            <Field label="Link / URL" value={item.link || item.url || ""} onChange={v => onChange({ ...item, link: v })} placeholder="https://github.com/..." />
          </div>
          <Field label="Description" value={item.description || item.summary || ""} onChange={v => onChange({ ...item, description: v })} multiline placeholder="Brief project description..." />
          <Field
            label="Technologies (comma separated)"
            value={tech}
            onChange={v => onChange({ ...item, technologies: v.split(",").map((t: string) => t.trim()).filter(Boolean) })}
            placeholder="React, Node.js, MongoDB"
          />
        </div>
      )}
    </div>
  );
};

/* ── Generic list-of-objects editor ── */
const SimpleListEditor = ({ value, onChange, addLabel, fields, defaultItem }: {
  value: any[];
  onChange: (v: any[]) => void;
  addLabel: string;
  fields: { key: string; label: string; placeholder?: string; multiline?: boolean }[];
  defaultItem: any;
}) => (
  <div className="space-y-3">
    {value.map((item, idx) => (
      <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2.5">
        <div className="flex justify-end">
          <button onClick={() => onChange(value.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {fields.map(f => (
          <Field
            key={f.key}
            label={f.label}
            value={typeof item === "string" ? item : (item[f.key] || "")}
            onChange={v => onChange(value.map((x, i) => i === idx ? (typeof x === "string" ? v : { ...x, [f.key]: v }) : x))}
            placeholder={f.placeholder}
            multiline={f.multiline}
          />
        ))}
      </div>
    ))}
    <button
      onClick={() => onChange([...value, defaultItem])}
      className="w-full py-2.5 text-sm text-blue-600 border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
    >
      <Plus className="w-3.5 h-3.5" /> {addLabel}
    </button>
  </div>
);

/* ══ MAIN MODAL ══ */
const JobMatchSectionEditor: React.FC<Props> = ({ sectionKey, sectionLabel, initialData, onSave, onClose }) => {
  const [localData, setLocalData] = useState<any>(initialData);

  useEffect(() => { setLocalData(initialData); }, [sectionKey, initialData]);

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
        const list: any[] = Array.isArray(localData) ? localData : [];
        return (
          <div className="space-y-3">
            {list.map((item, idx) => (
              <ExpItem
                key={idx}
                item={item}
                onChange={v => setLocalData(list.map((x, i) => i === idx ? v : x))}
                onRemove={() => setLocalData(list.filter((_, i) => i !== idx))}
              />
            ))}
            <button
              onClick={() => setLocalData([...list, { role: "", company: "", startDate: "", endDate: "", description: [] }])}
              className="w-full py-2.5 text-sm text-blue-600 border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Entry
            </button>
          </div>
        );
      }

      case "education": {
        const list: any[] = Array.isArray(localData) ? localData : [];
        return (
          <div className="space-y-3">
            {list.map((item, idx) => (
              <EduItem
                key={idx}
                item={item}
                onChange={v => setLocalData(list.map((x, i) => i === idx ? v : x))}
                onRemove={() => setLocalData(list.filter((_, i) => i !== idx))}
              />
            ))}
            <button
              onClick={() => setLocalData([...list, { degree: "", branch: "", school: "", startDate: "", endDate: "", grade: "" }])}
              className="w-full py-2.5 text-sm text-blue-600 border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Education
            </button>
          </div>
        );
      }

      case "projects": {
        const list: any[] = Array.isArray(localData) ? localData : [];
        return (
          <div className="space-y-3">
            {list.map((item, idx) => (
              <ProjItem
                key={idx}
                item={item}
                onChange={v => setLocalData(list.map((x, i) => i === idx ? v : x))}
                onRemove={() => setLocalData(list.filter((_, i) => i !== idx))}
              />
            ))}
            <button
              onClick={() => setLocalData([...list, { title: "", description: "", technologies: [], link: "" }])}
              className="w-full py-2.5 text-sm text-blue-600 border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Project
            </button>
          </div>
        );
      }

      case "certifications":
        return (
          <SimpleListEditor
            value={Array.isArray(localData) ? localData : []}
            onChange={setLocalData}
            addLabel="Add Certification"
            defaultItem={{ name: "", issuedBy: "", year: "" }}
            fields={[
              { key: "name", label: "Certification Name", placeholder: "e.g. AWS Solutions Architect" },
              { key: "issuedBy", label: "Issued By", placeholder: "e.g. Amazon Web Services" },
              { key: "year", label: "Year", placeholder: "e.g. 2023" },
            ]}
          />
        );

      case "achievements":
        return (
          <SimpleListEditor
            value={Array.isArray(localData) ? localData : []}
            onChange={setLocalData}
            addLabel="Add Achievement"
            defaultItem={{ title: "", description: "" }}
            fields={[
              { key: "title", label: "Title", placeholder: "e.g. 1st place at National Hackathon" },
              { key: "description", label: "Description", placeholder: "Brief description…", multiline: true },
            ]}
          />
        );

      case "languages":
        return (
          <SimpleListEditor
            value={Array.isArray(localData) ? localData : []}
            onChange={setLocalData}
            addLabel="Add Language"
            defaultItem={{ language: "", proficiency: "" }}
            fields={[
              { key: "language", label: "Language", placeholder: "e.g. English" },
              { key: "proficiency", label: "Proficiency", placeholder: "e.g. Native, Fluent, Intermediate" },
            ]}
          />
        );

      default:
        return <p className="text-sm text-gray-400 italic">No editor available for this section.</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full bg-blue-500" />
            <h2 className="text-base font-bold text-gray-800">Edit {sectionLabel}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{renderBody()}</div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0">
          <p className="text-[11px] text-gray-400">Changes apply to this preview session only</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors">
              Cancel
            </button>
            <button
              onClick={() => { onSave(sectionKey, localData); onClose(); }}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobMatchSectionEditor;
