"use client";
import { useState } from "react";
import { Medal, Pencil, Trash2 } from "lucide-react";
import { ProfileData } from "../../_types/ProfileData";

interface AchievementsSectionProps {
    tempProfile: ProfileData;
    setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}
const AchievementsSection = ({ tempProfile, setTempProfile }: AchievementsSectionProps) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<NonNullable<ProfileData["achievements"]>[number]>({});

    return (
        <div>
            {(tempProfile.achievements?.length ?? 0) === 0 || editingIndex !== null ? (
                <div className="mb-4 border border-neutral-200 rounded-lg p-4 flex flex-col gap-2">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col">
                            <label className="text-base font-medium">Achievment</label>
                            <input
                                type="text"
                                name="title"
                                value={form.title || ""}
                                onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                                className="border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-base font-medium">Issuer/Organization</label>
                            <input
                                type="text"
                                name="issuer"
                                value={form.issuer || ""}
                                onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                                className="border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-base font-medium">Date</label>
                            <input
                                type="date"
                                name="date"
                                value={form.date || ""}
                                onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                                className="border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-base font-medium">Description</label>
                        <textarea
                            rows={4}
                            name="description"
                            value={form.description || ""}
                            onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                            className="w-full border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                        />
                    </div>
                    <div className="col-span-2 flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                const updated = [...(tempProfile.achievements || [])];
                                if (editingIndex !== null && editingIndex < updated.length) {
                                    updated[editingIndex] = form;
                                } else {
                                    updated.push(form);
                                }
                                setTempProfile({ ...tempProfile, achievements: updated });
                                setForm({});
                                setEditingIndex(null);
                            }}
                            className="bg-[#155DFC] text-white px-4 py-1.5 cursor-pointer rounded"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setForm({});
                                setEditingIndex(null);
                            }}
                            className="bg-gray-400 text-white px-3 py-1 rounded"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {(tempProfile.achievements || []).map((item, index) => (
                        <div key={index} className="mb-4 bg-neutral-50 border border-gray-300 flex items-start justify-between rounded-xl py-6 shadow-sm px-4 gap-2">
                            <div>
                                <h3 className="font-semibold">{item.title}</h3>
                                <p className="text-sm">{item.issuer}</p>
                                <p className="text-xs text-neutral-500">{item.date}</p>
                                <ul className="list-disc list-inside text-sm space-y-1 my-2">
                                    {item.description?.split("\n").map((line: string, i: number) => (
                                        <li key={i}>{line}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForm(item);
                                        setEditingIndex(index);
                                    }}
                                    className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const updated = [...(tempProfile.achievements || [])];
                                        updated.splice(index, 1);
                                        setTempProfile({ ...tempProfile, achievements: updated });
                                    }}
                                    className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            setForm({});
                            setEditingIndex(tempProfile.achievements?.length || 0);
                        }}
                        className="bg-[#155DFC] text-white text-sm cursor-pointer flex gap-2 items-center px-4 py-2 rounded-lg "
                    >
                        <Medal className="w-4 h-4" />
                        <span>Add Achievement</span>
                    </button>
                </>
            )}
        </div>
    );
};

export default AchievementsSection;
