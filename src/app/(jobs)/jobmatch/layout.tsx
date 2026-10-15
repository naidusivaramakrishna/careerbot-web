import "./neutral-theme.css";

export default function JobMatchPublicLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="jobmatchTheme min-h-screen antialiased">
      {children}
    </div>
  );
}
