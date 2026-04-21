"use client"
import AuthModal from "@/components/SignUpModal";
import { useTenant } from "@/contexts/TenantContext";
import { useEffect, useState } from "react";

export default function Home() {
  const [open, setOpen] = useState(false)
  const [initialFormType, setInitialFormType] = useState<"signup" | "signin">("signup")
  const { setActiveTenant } = useTenant()

  useEffect(() => {
    // Check for URL query parameters
    const params = new URLSearchParams(window.location.search);

    // Set tenant from URL parameter if provided
    const tenantId = params.get('tenant_id');
    if (tenantId) {
      setActiveTenant(tenantId);
    }

    if (params.get('showLogin') === 'true') {
      setInitialFormType("signin");
      setOpen(true);
      // Store verified state in sessionStorage before cleaning URL
      if (params.get('verified') === 'true') {
        sessionStorage.setItem('emailVerified', 'true');
      }
      // Clean up URL to avoid showing the param on refresh
      window.history.replaceState({}, '', '/');
    }

    const openLogin = () => {
      setInitialFormType("signin");
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
        onClick={() => { setInitialFormType("signup"); setOpen(true); }}
        className="flex justify-self-end text-sm  gap-2 border border-neutral-200 cursor-pointer bg-black text-white font-semibold rounded-lg px-6 py-2 m-4">
        SignUp
      </button>
      <AuthModal
        open={open}
        onClose={() => setOpen(false)}
        initialFormType={initialFormType}
      />
    </div>
  );
}
