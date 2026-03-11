import type { Metadata } from "next";
import ClientLayout from "@/app/(user)/profile/ClientLayout";
import { Toaster } from "sonner";

export const metadata: Metadata = {
    title: "Settings",
    description: "Settings page of Careerbot",
};

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <ClientLayout>
                {children}
                <Toaster richColors position="bottom-right" />
            </ClientLayout>
        </>
    );
}
