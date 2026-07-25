"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
    EmploymentInfo,
    getEmploymentInfo,
    updateEmploymentInfo,
} from "@/api/userApi";
import Modal from "@/components/common/Modal";
import { useProfileContext } from "../../context/ProfileContext";
import { ProfileData } from "../../_types/ProfileData";
import EmploymentInfoEmptyState from "./EmploymentInfoEmptyState";
import EmploymentInfoForm from "./EmploymentInfoForm";
import EmploymentInfoCard from "./EmploymentInfoCard";
interface Props {
    tempProfile: ProfileData;
    setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}

export default function EmploymentInfoSection({
    tempProfile,
    setTempProfile,
}: Props) {
    const { setProfileData } = useProfileContext();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [employmentInfoForm, setEmploymentInfoForm] =
        useState<Partial<EmploymentInfo>>({});
    const [loading, setLoading] = useState(false);

    const employmentInfo = tempProfile.employmentInfo;

    const isEmpty =
        !employmentInfo || Object.keys(employmentInfo).length === 0;

    /* ---------------- FETCH ---------------- */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getEmploymentInfo();
                if (!data) return;

                setTempProfile((prev) => ({
                    ...prev,
                    employmentInfo: data,
                }));

                setProfileData((prev) => ({
                    ...prev,
                    employmentInfo: data,
                }));
            } catch {
                toast.error("Failed to load employment information");
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---------------- MODAL HANDLERS ---------------- */
    const openAddModal = useCallback(() => {
        setEmploymentInfoForm({});
        setIsModalOpen(true);
    }, []);

    const openEditModal = useCallback(() => {
        setEmploymentInfoForm(employmentInfo || {});
        setIsModalOpen(true);
    }, [employmentInfo]);

    const closeModal = useCallback(() => {
        setEmploymentInfoForm({});
        setIsModalOpen(false);
    }, []);

    /* ---------------- SAVE ---------------- */
    const handleSave = async () => {
        try {
            setLoading(true);

            const saved =
                (await updateEmploymentInfo(employmentInfoForm)) ??
                employmentInfoForm;

            // 🔑 Update temp profile (UI source of truth)
            setTempProfile((prev) => ({
                ...prev,
                employmentInfo: saved,
            }));

            // 🔑 Update global context
            setProfileData((prev) => ({
                ...prev,
                employmentInfo: saved,
            }));

            toast.success("Employment information saved");
            closeModal();
        } catch {
            toast.error("Failed to save employment information");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {isEmpty ? (
                <EmploymentInfoEmptyState onAdd={openAddModal} />
            ) : (
                <EmploymentInfoCard
                    emp={employmentInfo}
                    onEdit={openEditModal}
                    onDelete={() => { }}
                />
            )}

            <Modal
                open={isModalOpen}
                onClose={closeModal}
                title="Employment Information"
            >
                <EmploymentInfoForm
                    employmentInfoForm={employmentInfoForm}
                    setEmploymentInfoForm={setEmploymentInfoForm}
                    onSave={handleSave}
                    onCancel={closeModal}
                    loading={loading}
                />
            </Modal>
        </div>
    );
}
