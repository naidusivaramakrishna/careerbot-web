"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { addCertification, deleteCertification, Certification, getCertification, updateCertification } from "@/api/userApi";
import { CertificationSectionProps,ValidationError } from "../../_types/certification-types";
import CertificationForm from "./CertificationForm";
import CertificationList from "./CertificationList";

export default function CertificationsSection({
    tempProfile,
    setTempProfile,
}: CertificationSectionProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(0);
    const [certificationForm, setCertificationForm] = useState<Partial<Certification>>({});
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCertifications= async () => {
            try {
                setLoading(true);
                const data = await getCertification();
                setTempProfile((p) => ({ ...p, certifications: data }));
                if (data.length > 0) setEditingIndex(null);
            } catch {
                toast.error("Failed to load certification details.");
            } finally {
                setLoading(false);
            }
        };
        fetchCertifications();
    }, [setTempProfile]);

    const handleSave = async () => {
        try {
            setLoading(true);
            setValidationErrors([]);

            if (editingIndex !== null) {
                const existing = tempProfile.certifications?.[editingIndex];
                if (existing?.id) {
                    const updated = await updateCertification(existing.id, certificationForm);
                    const updatedList = [...(tempProfile.certifications || [])];
                    updatedList[editingIndex] = updated;
                    setTempProfile({ ...tempProfile, certifications: updatedList });
                    toast.success("Certification updated successfully");
                } else {
                    const newCertification = await addCertification(certificationForm as Omit<Certification, "id">);
                    setTempProfile({
                        ...tempProfile,
                        certifications: [...(tempProfile.certifications || []), newCertification],
                    });
                    toast.success("Certification added successfully");
                }
            }

            setEditingIndex(null);
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
            setTempProfile({ ...tempProfile, certifications: updated });
            toast.success("Certification deleted");
            if (updated.length === 0) setEditingIndex(0);
        } catch {
            toast.error("Failed to delete certification");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {editingIndex !== null ? (
                <CertificationForm
                    certificationForm={certificationForm}
                    setCertificationForm={setCertificationForm}
                    onSave={handleSave}
                    onCancel={() => {
                        setEditingIndex(null);
                        setCertificationForm({});
                        setValidationErrors([]);
                    }}
                    loading={loading}
                    validationErrors={validationErrors}
                />
            ) : (
                <CertificationList
                    certificationList={tempProfile.certifications || []}
                    onEdit={(cert, i) => {
                        setCertificationForm(cert);
                        setEditingIndex(i);
                    }}
                    onDelete={handleDelete}
                    onAdd={() => {
                        setCertificationForm({});
                        setEditingIndex((tempProfile.certifications?.length || 0) + 1);
                    }}
                />
            )}
        </div>
    );
}



