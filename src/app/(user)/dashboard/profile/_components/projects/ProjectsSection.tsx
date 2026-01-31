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
