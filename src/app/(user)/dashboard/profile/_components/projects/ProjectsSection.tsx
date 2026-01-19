// "use client";
// import { useState } from "react";
// import { FolderKanban, Pencil, Sparkles, Trash2 } from "lucide-react";
// import { formatDateRange } from "@/utils/formatDate";
// import { ProfileData } from "../../_types/ProfileData";
// import Image from "next/image";

// interface ProjectsSectionProps {
//     tempProfile: ProfileData;
//     setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
// }

// const ProjectsSection = ({ tempProfile, setTempProfile }: ProjectsSectionProps) => {
//     const [editingIndex, setEditingIndex] = useState<number | null>(null);
//     const [projectsForm, setProjectsForm] = useState<NonNullable<ProfileData["projects"]>[number]>({});

//     return (
//         <div>
//             {(tempProfile.projects?.length ?? 0) === 0 || editingIndex !== null ? (
//                 <div className="mb-4 border border-neutral-200 rounded-lg p-4 flex flex-col gap-2">
//                     <div className="grid grid-cols-3 gap-3">
//                         <div className="flex flex-col">
//                             <label className="text-sm font-medium">Project Name</label>
//                             <input
//                                 type="text"
//                                 name="projectName"
//                                 value={projectsForm.projectName || ""}
//                                 onChange={(e) => setProjectsForm({ ...projectsForm, [e.target.name]: e.target.value })}
//                                 className="border border-neutral-200 p-2.5 text-sm  rounded-lg bg-white outline-neutral-500"
//                             />
//                         </div>
//                         <div className="flex flex-col">
//                             <label className="text-sm font-medium">Role</label>
//                             <input
//                                 type="text"
//                                 name="role"
//                                 value={projectsForm.role || ""}
//                                 onChange={(e) => setProjectsForm({ ...projectsForm, [e.target.name]: e.target.value })}
//                                 className="border border-neutral-200 p-2.5 text-sm  rounded-lg bg-white outline-neutral-500"
//                             />
//                         </div>
//                         <div className="flex flex-col">
//                             <label className="text-sm font-medium">Technologies</label>
//                             <input
//                                 type="text"
//                                 name="technologies"
//                                 placeholder="Technologies (comma separated)"
//                                 value={projectsForm.technologies || ""}
//                                 onChange={(e) =>
//                                     setProjectsForm({ ...projectsForm, technologies: e.target.value.split(",") })
//                                 }
//                                 className="border border-neutral-200 p-2.5 text-sm  rounded-lg bg-white outline-neutral-500"
//                             />
//                         </div>
//                         <div className="flex flex-col">
//                             <label className="text-sm font-medium">Start Date</label>
//                             <input
//                                 type="date"
//                                 name="startDate"
//                                 value={projectsForm.startDate || ""}
//                                 onChange={(e) =>
//                                     setProjectsForm({ ...projectsForm, [e.target.name]: e.target.value })
//                                 }
//                                 className="border border-neutral-200 p-2.5 text-sm  rounded-lg bg-white outline-neutral-500"
//                             />
//                         </div>
//                         <div className="flex flex-col">
//                             <label className="text-sm font-medium">End Date</label>
//                             <input
//                                 type="date"
//                                 name="endDate"
//                                 value={projectsForm.endDate || ""}
//                                 onChange={(e) =>
//                                     setProjectsForm({ ...projectsForm, [e.target.name]: e.target.value })
//                                 }
//                                 className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500"
//                             />
//                         </div>
//                         <div className="flex flex-col">
//                             <label className="text-sm font-medium">Project Link</label>
//                             <input
//                                 type="text"
//                                 name="link"
//                                 value={projectsForm.link || ""}
//                                 onChange={(e) => setProjectsForm({ ...projectsForm, [e.target.name]: e.target.value })}
//                                 className="border border-neutral-200 p-2.5 text-sm  rounded-lg bg-white outline-neutral-500"
//                             />
//                         </div>
//                     </div>
//                     <div className="w-full my-2">
//                         <div className='flex justify-between py-2'>
//                             <label className="text-sm font-medium">Description</label>
//                             <div className='flex items-center gap-2'>
//                                 <Image src="/assets/icons/magic-pencil.svg" className='w-4 h-4' width={12} height={12} alt='magic-pencil' />
//                                 <div className="text-sm">Let AI help you write this summary....</div>
//                             </div>
//                         </div>
//                         <div className="relative w-full">
//                             <textarea
//                                 rows={4}
//                                 name="description"
//                                 placeholder="Description"
//                                 value={projectsForm.description || ""}
//                                 onChange={(e) => setProjectsForm({ ...projectsForm, [e.target.name]: e.target.value })}
//                                 className="w-full border border-neutral-200 p-2.5 text-sm  rounded-lg bg-white outline-neutral-500"
//                             />
//                             <Sparkles className="absolute right-4 top-4 text-[#1F00EC] w-4 h-4 cursor-pointer" />
//                         </div>
//                     </div>
//                     <div className="col-span-2 flex gap-2 justify-end">
//                         <button
//                             type="button"
//                             onClick={() => {
//                                 const updated = [...(tempProfile.projects || [])];
//                                 if (editingIndex !== null && editingIndex < updated.length) {
//                                     updated[editingIndex] = projectsForm;
//                                 } else {
//                                     updated.push(projectsForm);
//                                 }
//                                 setTempProfile({ ...tempProfile, projects: updated });
//                                 setProjectsForm({});
//                                 setEditingIndex(null);
//                             }}
//                             className="bg-[#155DFC]  text-white px-4 py-1.5 cursor-pointer rounded"
//                         >
//                             Save
//                         </button>
//                         <button
//                             onClick={() => {
//                                 setProjectsForm({});
//                                 setEditingIndex(null);
//                             }}
//                             className="bg-gray-400 text-white px-3 py-1 rounded"
//                         >
//                             Cancel
//                         </button>
//                     </div>
//                 </div>
//             ) : (
//                 <>
//                     {(tempProfile.projects || []).map((proj, index) => (
//                         <div key={index} className="mb-4 bg-white border border-gray-300 flex items-start justify-between rounded-xl py-6 shadow-sm px-4 gap-2">
//                             <div className="flex flex-col gap-2">
//                                 <div className="flex justify-between items-center">
//                                     <h3 className="font-semibold">{proj.projectName}</h3>
//                                 </div>
//                                 <div className="flex justify-between items-center ">
//                                     <p className="text-sm">Role: {proj.role}</p>
//                                 </div>
//                                 <div className="flex justify-between items-center">
//                                     <p className="text-xs text-neutral-500">
//                                         {formatDateRange(proj.startDate, proj.endDate)}
//                                     </p>
//                                     {proj.link && (
//                                         <div>
//                                             <a href={proj.link} target="_blank" className="text-blue-600 underline text-sm">
//                                                 GitHub
//                                             </a>
//                                         </div>
//                                     )}
//                                 </div>
//                                 <p className="text-gray-800">
//                                     <span className="text-sm">Technologies: </span>
//                                     {proj.technologies?.map((technology: string, index: number) => (
//                                         <span key={index} className=" text-sm bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg mr-2 cursor-pointer">{technology}</span>
//                                     ))}
//                                 </p>
//                                 <ul className="list-disc list-inside text-sm space-y-1 my-2">
//                                     {proj.description?.split("\n").map((line: string, i: number) => (
//                                         <li key={i}>{line}</li>
//                                     ))}
//                                 </ul>
//                             </div>
//                             <div className="flex gap-2">
//                                 <button
//                                     type="button"
//                                     onClick={() => {
//                                         setProjectsForm(proj);
//                                         setEditingIndex(index);
//                                     }}
//                                     className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
//                                 >
//                                     <Pencil className="w-4 h-4" />
//                                 </button>
//                                 <button
//                                     type="button"
//                                     onClick={() => {
//                                         const updated = [...(tempProfile.projects || [])];
//                                         updated.splice(index, 1);
//                                         setTempProfile({ ...tempProfile, projects: updated });
//                                     }}
//                                     className="bg-background border border-neutral-200 cursor-pointer shadow-xs px-3 py-1 hover:bg-accent hover:text-accent-foreground rounded-md"
//                                 >
//                                     <Trash2 className="w-4 h-4" />
//                                 </button>
//                             </div>
//                         </div>
//                     ))}
//                     <div className="flex justify-self-end">
//                         <button
//                             type="button"
//                             onClick={() => {
//                                 setProjectsForm({});
//                                 setEditingIndex(tempProfile.projects?.length || 0);
//                             }}
//                             className="bg-[#155DFC] text-white text-sm cursor-pointer flex gap-2 items-center px-4 py-2 rounded-lg "
//                         >
//                             <FolderKanban className="w-4 h-4" />
//                             <span>Add Project</span>
//                         </button>
//                     </div>
//                 </>
//             )}
//         </div>
//     );
// };

// export default ProjectsSection;





"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Projects, addProject, deleteProject, getProjects, updateProjects } from "@/api/userApi";
import { ExperienceSectionProps, ValidationError } from "../../_types/experience-types";
import { useProfileContext } from "../../context/ProfileContext";
import Modal from "@/components/common/Modal";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import ProjectsEmptyState from "./ProjectsEmptyState";
import ProjectsList from "./ProjectsList";
import ProjectsForm from "./ProjectsForm";

export default function ProjectsSection({
    tempProfile,
    setTempProfile,
}: ExperienceSectionProps) {
    const { setProfileData } = useProfileContext();
    const [editingIndex, setEditingIndex] = useState<number | null>(0);
    const [projectsForm, setProjectsForm] = useState<Partial<Projects>>({});
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{
        id?: string;
        index?: number;
    } | null>(null);

    useEffect(() => {

        const fetchProjects = async () => {
            //  Only fetch if projects data doesn't exist yet
            if (tempProfile.projects && tempProfile.projects.length > 0) {
                if (tempProfile.projects.length > 0) setEditingIndex(null);
                return;
            }
            try {
                setLoading(true);
                const data = await getProjects();
                const updatedProfile = { ...tempProfile, projects: data }
                setTempProfile(updatedProfile);
                setProfileData(updatedProfile) //  Update context too
                if (data.length > 0) setEditingIndex(null);
            } catch {
                toast.error("Failed to load project details.");
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const handleSave = async () => {
        try {
            setLoading(true);
            setValidationErrors([]);

            let updatedList = [...(tempProfile.projects || [])];

            if (editingIndex !== null) {
                const existing = updatedList[editingIndex];
                if (existing?.id) {
                    const updated = await updateProjects(existing.id, projectsForm);
                    updatedList[editingIndex] = updated;
                    toast.success("Project updated");
                }
            } else {
                const newPro = await addProject(projectsForm as Omit<Projects, "id">);
                updatedList.push(newPro);
                toast.success("Project added");
            }

            setTempProfile((prev) => ({ ...prev, projects: updatedList }));
            setProfileData((prev) => ({ ...prev, projects: updatedList }));

            setIsModalOpen(false);
            setProjectsForm({});
        } catch (err: any) {
            if (err?.response?.data?.error?.details?.validation_errors) {
                setValidationErrors(err.response.data.error.details.validation_errors);
            } else toast.error("Error saving projects");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id?: string, index?: number) => {
        try {
            setLoading(true);
            if (id) await deleteProject(id);
            const updated = [...(tempProfile.projects || [])];
            updated.splice(index!, 1);

            //  Update both local and context state using functional updates
            setTempProfile((prev) => ({ ...prev, projects: updated }));
            setProfileData((prev) => {
                const newProfile = { ...prev, projects: updated };
                return newProfile;
            });
            toast.success("Projects deleted");
            if (updated.length === 0) setEditingIndex(0);
        } catch {
            toast.error("Failed to delete projects");
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setProjectsForm({});
        setEditingIndex(null);
        setIsModalOpen(true);
    };

    const openEditModal = (exp: Partial<Projects>, index: number) => {
        setProjectsForm(exp);
        setEditingIndex(index);
        setIsModalOpen(true);
    };

    const modalTitle =
        editingIndex === null ? "Add Projects" : "Edit Projects";

    return (
        <div>
            {/* EMPTY STATE */}
            {!tempProfile.projects?.length ? (
                <ProjectsEmptyState onAdd={openAddModal} />
            ) : (
                <>
                    <ProjectsList
                        projectsList={tempProfile.projects}
                        onEdit={openEditModal}
                        onDelete={(id, index) => setDeleteTarget({ id, index })}
                        onAdd={openAddModal}
                    />
                </>
            )}

            {/* MODAL */}
            <div className="">
                <Modal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={modalTitle}
                >
                    <ProjectsForm
                        projectsForm={projectsForm}
                        setProjectsForm={setProjectsForm}
                        onSave={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                        loading={loading}
                        validationErrors={validationErrors}
                    />
                </Modal>
            </div>
            <ConfirmDeleteModal
                open={!!deleteTarget}
                loading={loading}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    await handleDelete(deleteTarget.id, deleteTarget.index);
                    setDeleteTarget(null);
                }}
            />
        </div>
    );
}