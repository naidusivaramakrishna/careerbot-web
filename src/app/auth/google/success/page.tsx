"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { httpClient } from "@/lib/http";
import { getStoredAuthRedirect } from "@/lib/authRedirect";

function GoogleOAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Completing sign in...");
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const processOAuth = async () => {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");

      if (!accessToken || !refreshToken) {
        setStatus("Sign in failed — missing tokens");
        setTimeout(() => router.push("/"), 1500);
        return;
      }

      try {
        setStatus("Establishing session...");
        // Google OAuth backend sends tokens as URL params instead of httpOnly cookies
        // directly. Call /auth/refresh with the refresh_token so the backend sets the
        // httpOnly cookie session that the rest of the app depends on.
        await httpClient.post("/auth/refresh", { refresh_token: refreshToken });
      } catch {
        // Backend may have already set cookies via the callback redirect; continue anyway.
      }

      setStatus("Redirecting to dashboard...");
      sessionStorage.removeItem("__signing_out");
      await new Promise((resolve) => setTimeout(resolve, 500));
      // getStoredAuthRedirect() returns whatever page the user came from, or /dashboard
      router.push(getStoredAuthRedirect());
    };

    processOAuth();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Google Sign-in</h2>
        <p className="text-gray-500 text-sm">{status}</p>
      </div>
    </div>
  );
}

const Fallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
  </div>
);

export default function GoogleOAuthSuccess() {
  return (
    <Suspense fallback={<Fallback />}>
      <GoogleOAuthContent />
    </Suspense>
  );
}
