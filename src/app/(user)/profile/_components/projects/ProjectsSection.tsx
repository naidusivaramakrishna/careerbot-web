"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Projects, deleteProject, getProjects, updateProjects } from "@/api/userApi";
import { addProjectItem } from "../../_utils/autoFillHelper";
import { ExperienceSectionProps, ValidationError } from "../../_types/experience-types";
import { useProfileContext } from "../../context/ProfileContext";
import { useDashboard } from "@/contexts/DashboardContext";
import Modal from "@/components/common/Modal";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import ProjectsEmptyState from "./ProjectsEmptyState";
import ProjectsList from "./ProjectsList";
import ProjectsForm from "./ProjectsForm";

interface ProjectsSectionProps extends ExperienceSectionProps {
    isAutoFill?: boolean; // Flag to indicate if data is from resume/LinkedIn import
}

export default function ProjectsSection({
    tempProfile,
    setTempProfile,
    isAutoFill = false,
}: ProjectsSectionProps) {
    const { setProfileData } = useProfileContext();
    const { refreshDashboard } = useDashboard();
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

            const updatedList = [...(tempProfile.projects || [])];

            if (editingIndex !== null) {
                const existing = updatedList[editingIndex];
                if (existing?.id) {
                    const updated = await updateProjects(existing.id, projectsForm);
                    updatedList[editingIndex] = updated;
                    toast.success("Project updated");
                }
            } else {
                // Use auto-fill endpoint for resume/LinkedIn import, regular endpoint for manual entry
                const newPro = await addProjectItem(projectsForm, isAutoFill);
                updatedList.push(newPro);
                toast.success("Project added");
            }

            setTempProfile((prev) => ({ ...prev, projects: updatedList }));
            setProfileData((prev) => ({ ...prev, projects: updatedList }));

            // Refresh dashboard with delay to prevent multiple toast notifications
            setTimeout(() => {
                refreshDashboard();
            }, 300);

            setIsModalOpen(false);
            setProjectsForm({});
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { details?: { validation_errors?: ValidationError[] }, message?: string } } } } | null;
            if (error?.response?.data?.error?.details?.validation_errors) {
                setValidationErrors(error.response.data.error.details.validation_errors);
            } else {
                const errorMessage = error?.response?.data?.error?.message || '';
                const errors: ValidationError[] = [];
                const msg = errorMessage.toLowerCase();

                if (msg.includes('project name') || msg.includes('project_name')) {
                    errors.push({ field: 'project_name', message: errorMessage });
                } else if (msg.includes('role')) {
                    errors.push({ field: 'role', message: errorMessage });
                } else if (msg.includes('technolog')) {
                    errors.push({ field: 'technologies', message: errorMessage });
                } else if (msg.includes('project link') || msg.includes('project_link') || msg.includes('url') || msg.includes('link')) {
                    errors.push({ field: 'project_link', message: errorMessage });
                } else if (msg.includes('start date') || msg.includes('start_date')) {
                    const startMsg = msg.includes('yyyy-mm-dd') || msg.includes('valid date in')
                        ? 'Please select a valid start date'
                        : errorMessage;
                    errors.push({ field: 'start_date', message: startMsg });
                } else if (msg.includes('end date') || msg.includes('end_date')) {
                    const endMsg = msg.includes('yyyy-mm-dd') || msg.includes('valid date in')
                        ? 'Please select a valid end date'
                        : errorMessage;
                    errors.push({ field: 'end_date', message: endMsg });
                } else if (msg.includes('description')) {
                    errors.push({ field: 'description', message: errorMessage });
                }

                if (errors.length > 0) {
                    setValidationErrors(errors);
                } else {
                    toast.error(errorMessage || "Error saving projects");
                }
            }
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

            // Refresh dashboard with delay to prevent multiple toast notifications
            setTimeout(() => {
                refreshDashboard();
            }, 300);

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
