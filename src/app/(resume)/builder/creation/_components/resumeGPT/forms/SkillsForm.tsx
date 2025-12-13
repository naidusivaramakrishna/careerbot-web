"use client";
import { useState } from "react";

interface Props {
  onSave: (data: string[]) => void;
}

export default function SkillsForm({ onSave }: Props) {
  const [skills, setSkills] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const addSkill = () => {
    if (!input.trim()) return;
    setSkills([...skills, input.trim()]);
    setInput("");
  };

  const handleSave = () => {
    onSave(skills);
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow">
      <h3 className="font-semibold mb-2">Add Skills</h3>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Enter a skill"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <button onClick={addSkill} className="px-3 py-1 bg-[#2557a7] text-white rounded">
          Add
        </button>
      </div>
      <ul className="list-disc pl-5 mb-2">
        {skills.map((skill, i) => (
          <li key={i}>{skill}</li>
        ))}
      </ul>
      <button onClick={handleSave} className="px-4 py-2 bg-[#2557a7] text-white rounded">
        Save
      </button>
    </div>
  );
}
