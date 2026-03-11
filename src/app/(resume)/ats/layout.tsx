import Nav from "./_components/Navbar";

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
    <div className="antialiased font-montserrat min-h-screen">
      <Nav />
      {children}
      <footer />
    </div>
  );
}
