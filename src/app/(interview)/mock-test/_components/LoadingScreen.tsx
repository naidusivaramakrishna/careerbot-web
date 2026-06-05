'use client';

/**
 * Full-page loading state used by every mock-test page while initial data
 * loads. Navy spinner on the section-intro light bg, with an
 * uppercase-tracking-widest label so users know what's loading.
 */
export default function LoadingScreen({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ background: '#F8F9FB' }}
      role="status"
      aria-live="polite"
    >
      <div
        className="w-12 h-12 border-4 rounded-full animate-spin"
        style={{ borderColor: '#dbeafe', borderTopColor: '#1e3a8a' }}
        aria-hidden="true"
      />
      <p
        className="font-bold text-xs tracking-widest uppercase"
        style={{ color: '#1e3a8a' }}
      >
        {label}
      </p>
    </div>
  );
}
