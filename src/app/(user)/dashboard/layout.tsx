import type { Metadata } from "next";
import ClientLayout from "./ClientLayout";
import { Toaster } from "sonner";

export const metadata: Metadata = {
    title: "Careerbot Profile",
    description: "Profile section of Careerbot",
};

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                    <ClientLayout>
                        {children}
                        <Toaster richColors position="bottom-right" />
                    </ClientLayout>
            </body>
        </html>
    );
}
