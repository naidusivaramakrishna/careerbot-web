import "../../globals.css";
import { ResumeProvider } from "./_context/ResumeContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="__variable_188709 __variable_9a8899 antialiased">
        <ResumeProvider>{children}</ResumeProvider>
      </body>
    </html>
  );
}