"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { addCertification, deleteCertification, Certification, getCertification, updateCertification } from "@/api/userApi";
import { CertificationSectionProps, ValidationError } from "../../_types/certification-types";
import CertificationForm from "./CertificationForm";
import CertificationList from "./CertificationList";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import Modal from "@/components/common/Modal";
import CertificationEmptyState from "./CertificationEmptyState";
import { useProfileContext } from "../../context/ProfileContext";

export default function CertificationsSection({
    tempProfile,
    setTempProfile,
}: CertificationSectionProps) {
    const { setProfileData } = useProfileContext(); //  Get setProfileData from context
    const [editingIndex, setEditingIndex] = useState<number | null>(0);
    const [certificationForm, setCertificationForm] = useState<Partial<Certification>>({});
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{
        id?: string;
        index?: number;
    } | null>(null);

    useEffect(() => {
        const fetchCertifications = async () => {
            //  Only fetch if certification data doesn't exist yet
            if (tempProfile.certifications && tempProfile.certifications.length > 0) {
                if (tempProfile.certifications.length > 0) setEditingIndex(null);
                return;
            }
            try {
                setLoading(true);
                const data = await getCertification();
                const updatedProfile = { ...tempProfile, certifications: data };
                setTempProfile(updatedProfile);
                setProfileData(updatedProfile); // ✅ Update context too
                if (data.length > 0) setEditingIndex(null);
            } catch {
                toast.error("Failed to load certification details.");
            } finally {
                setLoading(false);
            }
        };
        fetchCertifications();
    }, []);

    const handleSave = async () => {
        try {
            setLoading(true);
            setValidationErrors([]);

            let updatedList = [...(tempProfile.certifications || [])];

            if (editingIndex !== null) {
                const existing = updatedList[editingIndex];
                if (existing?.id) {
                    const updated = await updateCertification(existing.id, certificationForm);
                    updatedList[editingIndex] = updated;
                    toast.success("Certification updated");
                }
            } else {
                const newCert = await addCertification(certificationForm as Omit<Certification, "id">);
                updatedList.push(newCert);
                toast.success("Certification added");
            }

            setTempProfile((prev) => ({ ...prev, certifications: updatedList }));
            setProfileData((prev) => ({ ...prev, certifications: updatedList }));

            setIsModalOpen(false);
            setCertificationForm({});
        } catch (err: any) {
            if (err?.response?.data?.error?.details?.validation_errors) {
                setValidationErrors(err.response.data.error.details.validation_errors);
            } else toast.error("Error saving certification");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id?: string, index?: number) => {
        try {
            setLoading(true);
            if (id) await deleteCertification(id);
            const updated = [...(tempProfile.certifications || [])];
            updated.splice(index!, 1);
            // ✅ Update both local and context state using functional updates
            setTempProfile((prev) => ({ ...prev, certifications: updated }));
            setProfileData((prev) => {
                const newProfile = { ...prev, certifications: updated };
                // // console.log('✅ Updated profile data after delete:', newProfile);
                return newProfile;
            });

            toast.success("Certification deleted");
            if (updated.length === 0) setEditingIndex(0);
        } catch {
            toast.error("Failed to delete certification");
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setCertificationForm({});
        setEditingIndex(null);
        setIsModalOpen(true);
    };

    const openEditModal = (exp: Partial<Certification>, index: number) => {
        setCertificationForm(exp);
        setEditingIndex(index);
        setIsModalOpen(true);
    };

    const modalTitle =
        editingIndex === null ? "Add Certification" : "Edit Certification";

    return (
        <div>
            {/* EMPTY STATE */}
            {!tempProfile.certifications?.length ? (
                <CertificationEmptyState onAdd={openAddModal} />
            ) : (
                <>
                    <CertificationList
                        certificationList={tempProfile.certifications}
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
                    <CertificationForm
                        certificationForm={certificationForm}
                        setCertificationForm={setCertificationForm}
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
                title="Delete Certification"
                description="Are you sure you want to delete this certification? This action cannot be undone."
            />
        </div>
    );
}



