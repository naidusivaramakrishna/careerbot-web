"use client"
import AuthModal from "@/components/SignUpModal";
import { useEffect, useState } from "react";

export default function Home() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Check for showLogin query parameter (from http.ts redirect)
    const params = new URLSearchParams(window.location.search);
    if (params.get('showLogin') === 'true') {
      setOpen(true);
      // Clean up URL to avoid showing the param on refresh
      window.history.replaceState({}, '', '/');
    }

    const openLogin = () => {
      setOpen(true);
    };

    window.addEventListener("openLoginModal", openLogin);

    return () => {
      window.removeEventListener("openLoginModal", openLogin);
    };
  }, []);

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="flex justify-self-end text-sm  gap-2 border border-neutral-200 cursor-pointer bg-black text-white font-semibold rounded-lg px-6 py-2 m-4">
        SignUp
      </button>
      <AuthModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
