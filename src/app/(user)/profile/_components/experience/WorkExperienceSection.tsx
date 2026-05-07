"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getExperience, updateExperience, deleteExperience, Experience } from "@/api/userApi";
import { addExperienceItem } from "../../_utils/autoFillHelper";
import ExperienceForm from "./ExperienceForm";
import ExperienceList from "./ExperienceList";
import { ExperienceSectionProps, ValidationError } from "../../_types/experience-types";
import { useProfileContext } from "../../context/ProfileContext";
import { useDashboard } from "@/contexts/DashboardContext";
import ExperienceEmptyState from "./ExperienceEmptyState";
import Modal from "@/components/common/Modal";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import logger from "@/lib/logger";

interface WorkExperienceSectionProps extends ExperienceSectionProps {
    isAutoFill?: boolean; // Flag to indicate if data is from resume/LinkedIn import
}

export default function WorkExperienceSection({
    tempProfile,
    setTempProfile,
    isAutoFill = false,
}: WorkExperienceSectionProps) {
    const { setProfileData } = useProfileContext();
    const { refreshDashboard } = useDashboard();
    const [editingIndex, setEditingIndex] = useState<number | null>(0);
    const [experienceForm, setExperienceForm] = useState<Partial<Experience>>({});
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{
        id?: string;
        index?: number;
    } | null>(null);

    useEffect(() => {

        const fetchExperience = async () => {
            //  Only fetch if experience data doesn't exist yet
            if (tempProfile.workExperience && tempProfile.workExperience.length > 0) {
                if (tempProfile.workExperience.length > 0) setEditingIndex(null);
                return;
            }
            try {
                setLoading(true);
                const data = await getExperience();
                const updatedProfile = { ...tempProfile, workExperience: data }
                setTempProfile(updatedProfile);
                setProfileData(updatedProfile) //  Update context too
                if (data.length > 0) setEditingIndex(null);
            } catch {
                toast.error("Failed to load experience details.");
            } finally {
                setLoading(false);
            }
        };
        fetchExperience();
    }, []);

    const handleSave = async () => {
        try {
            setLoading(true);
            setValidationErrors([]);

            const updatedList = [...(tempProfile.workExperience || [])];

            if (editingIndex !== null) {
                const existing = updatedList[editingIndex];
                if (existing?.id) {
                    const updated = await updateExperience(existing.id, experienceForm);
                    updatedList[editingIndex] = updated;
                    toast.success("Experience updated");
                }
            } else {
                // Use auto-fill endpoint for resume/LinkedIn import, regular endpoint for manual entry
                const newExp = await addExperienceItem(experienceForm, isAutoFill);
                updatedList.push(newExp);
                toast.success("Experience added");
            }

            setTempProfile((prev) => ({ ...prev, workExperience: updatedList }));
            setProfileData((prev) => ({ ...prev, workExperience: updatedList }));

            // Refresh dashboard with delay to prevent multiple toast notifications
            setTimeout(() => {
                refreshDashboard();
            }, 300);

            setIsModalOpen(false);
            setExperienceForm({});
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { details?: { validation_errors?: ValidationError[] }, message?: string } } } } | null;
            if (error?.response?.data?.error?.details?.validation_errors) {
                setValidationErrors(error.response.data.error.details.validation_errors);
            } else {
                // Parse simple error message and map to the relevant field
                const errorMessage = error?.response?.data?.error?.message || '';
                const errors: ValidationError[] = [];
                const msg = errorMessage.toLowerCase();

                if (msg.includes('title') || msg.includes('position')) {
                    errors.push({ field: 'job_title', message: errorMessage });
                } else if (msg.includes('company')) {
                    errors.push({ field: 'company', message: errorMessage });
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
                } else if (msg.includes('location')) {
                    errors.push({ field: 'location', message: errorMessage });
                } else if (msg.includes('job type') || msg.includes('job_type')) {
                    errors.push({ field: 'job_type', message: errorMessage });
                }

                if (errors.length > 0) {
                    setValidationErrors(errors);
                } else {
                    toast.error(errorMessage || "Error saving experience");
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id?: string, index?: number) => {
        try {
            setLoading(true);
            if (id) await deleteExperience(id);
            const updated = [...(tempProfile.workExperience || [])];
            updated.splice(index!, 1);

            //  Update both local and context state using functional updates
            setTempProfile((prev) => ({ ...prev, workExperience: updated }));
            setProfileData((prev) => {
                const newProfile = { ...prev, workExperience: updated };
                logger.info('✅ Updated profile data after delete:', newProfile);
                return newProfile;
            });

            // Refresh dashboard with delay to prevent multiple toast notifications
            setTimeout(() => {
                refreshDashboard();
            }, 300);

            toast.success("Experience deleted");
            if (updated.length === 0) setEditingIndex(0);
        } catch {
            toast.error("Failed to delete experience");
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setExperienceForm({});
        setEditingIndex(null);
        setIsModalOpen(true);
    };

    const openEditModal = (exp: Partial<Experience>, index: number) => {
        setExperienceForm(exp);
        setEditingIndex(index);
        setIsModalOpen(true);
    };

    const modalTitle =
        editingIndex === null ? "Add Work Experience" : "Edit Work Experience";

    return (
        <div>
            {/* EMPTY STATE */}
            {!tempProfile.workExperience?.length ? (
                <ExperienceEmptyState onAdd={openAddModal} />
            ) : (
                <>
                    <ExperienceList
                        experienceList={tempProfile.workExperience}
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
                    <ExperienceForm
                        experienceForm={experienceForm}
                        setExperienceForm={setExperienceForm}
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



