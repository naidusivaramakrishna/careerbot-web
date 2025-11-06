"use client";
import { useState } from "react";
import { FolderKanban, Pencil, Sparkles, Trash2 } from "lucide-react";
import { formatDateRange } from "@/utils/formatDate";
import { ProfileData } from "../_types/ProfileData";
import Image from "next/image";

interface ProjectsSectionProps {
    tempProfile: ProfileData;
    setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}

const ProjectsSection = ({ tempProfile, setTempProfile }: ProjectsSectionProps) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [projectsForm, setProjectsForm] = useState<NonNullable<ProfileData["projects"]>[number]>({});

    return (
        <div>
            {(tempProfile.projects?.length ?? 0) === 0 || editingIndex !== null ? (
                <div className="mb-4 border border-neutral-200 rounded-lg p-4 flex flex-col gap-2">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col">
                            <label className="text-base font-medium">Project Name</label>
                            <input
                                type="text"
                                name="projectName"
                                value={projectsForm.projectName || ""}
                                onChange={(e) => setProjectsForm({ ...projectsForm, [e.target.name]: e.target.value })}
                                className="border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-base font-medium">Role</label>
                            <input
                                type="text"
                                name="role"
                                value={projectsForm.role || ""}
                                onChange={(e) => setProjectsForm({ ...projectsForm, [e.target.name]: e.target.value })}
                                className="border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-base font-medium">Technologies</label>
                            <input
                                type="text"
                                name="technologies"
                                placeholder="Technologies (comma separated)"
                                value={projectsForm.technologies || ""}
                                onChange={(e) =>
                                    setProjectsForm({ ...projectsForm, technologies: e.target.value.split(",") })
                                }
                                className="border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-base font-medium">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={projectsForm.startDate || ""}
                                onChange={(e) =>
                                    setProjectsForm({ ...projectsForm, [e.target.name]: e.target.value })
                                }
                                className="border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-base font-medium">End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={projectsForm.endDate || ""}
                                onChange={(e) =>
                                    setProjectsForm({ ...projectsForm, [e.target.name]: e.target.value })
                                }
                                className="border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-base font-medium">Project Link</label>
                            <input
                                type="text"
                                name="link"
                                value={projectsForm.link || ""}
                                onChange={(e) => setProjectsForm({ ...projectsForm, [e.target.name]: e.target.value })}
                                className="border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                            />
                        </div>
                    </div>
                    <div className="w-full my-2">
                        <div className='flex justify-between py-2'>
                            <label className="text-base font-medium">Description</label>
                            <div className='flex items-center gap-2'>
                                <Image src="/assets/icons/magic-pencil.svg" className='w-6 h-6' width={12} height={12} alt='magic-pencil' />
                                <div>Let AI help you write this summary....</div>
                            </div>
                        </div>
                        <div className="relative w-full">
                            <textarea
                                rows={4}
                                name="description"
                                placeholder="Description"
                                value={projectsForm.description || ""}
                                onChange={(e) => setProjectsForm({ ...projectsForm, [e.target.name]: e.target.value })}
                                className="w-full border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
                            />
                            <Sparkles className="absolute right-4 top-4 text-[#1F00EC] w-6 h-6 cursor-pointer" />
                        </div>
                    </div>
                    <div className="col-span-2 flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                const updated = [...(tempProfile.projects || [])];
                                if (editingIndex !== null && editingIndex < updated.length) {
                                    updated[editingIndex] = projectsForm;
                                } else {
                                    updated.push(projectsForm);
                                }
                                setTempProfile({ ...tempProfile, projects: updated });
                                setProjectsForm({});
                                setEditingIndex(null);
                            }}
                            className="bg-[#155DFC]  text-white px-4 py-1.5 cursor-pointer rounded"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => {
                                setProjectsForm({});
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
                    {(tempProfile.projects || []).map((proj, index) => (
                        <div key={index} className="mb-4 bg-white border border-gray-300 flex items-start justify-between rounded-xl py-6 shadow-sm px-4 gap-2">
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold">{proj.projectName}</h3>
                                </div>
                                <div className="flex justify-between items-center ">
                                    <p className="text-sm">Role: {proj.role}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-neutral-500">
                                        {formatDateRange(proj.startDate, proj.endDate)}
                                    </p>
                                    {proj.link && (
                                        <div>
                                            <a href={proj.link} target="_blank" className="text-blue-600 underline text-sm">
                                                GitHub
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <p className="text-gray-800">
                                    <span className="text-sm">Technologies: </span>
                                    {proj.technologies?.map((technology: string, index: number) => (
                                        <span key={index} className=" text-sm bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg mr-2 cursor-pointer">{technology}</span>
                                    ))}
                                </p>
                                <ul className="list-disc list-inside text-sm space-y-1 my-2">
                                    {proj.description?.split("\n").map((line: string, i: number) => (
                                        <li key={i}>{line}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProjectsForm(proj);
                                        setEditingIndex(index);
                                    }}
                                    className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const updated = [...(tempProfile.projects || [])];
                                        updated.splice(index, 1);
                                        setTempProfile({ ...tempProfile, projects: updated });
                                    }}
                                    className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-self-end">
                        <button
                            type="button"
                            onClick={() => {
                                setProjectsForm({});
                                setEditingIndex(tempProfile.projects?.length || 0);
                            }}
                            className="bg-[#155DFC] text-white text-sm cursor-pointer flex gap-2 items-center px-4 py-2 rounded-lg "
                        >
                            <FolderKanban className="w-4 h-4" />
                            <span>Add Project</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProjectsSection;
