import { Montserrat } from "next/font/google";
import Nav from "./_components/Navbar";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata = {
  title: "ATS Resume Analyzer - CareerBot",
  description: "Analyze your resume with our ATS system",
};

export default function ATSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${montserrat.variable} antialiased font-montserrat min-h-screen`}>
      <Nav />
      {children}
      <footer />
    </div>
  );
}
