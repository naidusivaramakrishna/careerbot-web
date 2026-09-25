export default function JobMatchPublicLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="min-h-screen antialiased">
      {children}
    </div>
  );
}
