"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { httpClient } from "@/lib/http";
import { getStoredAuthRedirect } from "@/lib/authRedirect";
import { isAuthenticated } from "@/api/authApi";

function LinkedInOAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Completing sign in...");
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const processOAuth = async () => {
      const refreshToken = searchParams.get("refresh_token");

      try {
        setStatus("Establishing session...");

        // Mark session as fresh BEFORE calling /auth/refresh so the axios
        // interceptor treats any 401 as transient and does NOT redirect to
        // the login page mid-exchange.
        localStorage.setItem("token_last_refreshed_at", Date.now().toString());

        // If the backend included a refresh_token in the redirect URL, use it
        // to exchange for httpOnly session cookies. If it's absent the backend
        // already set the cookies directly via the callback route — skip this step.
        if (refreshToken) {
          try {
            await httpClient.post("/auth/refresh", { refresh_token: refreshToken });
          } catch {
            // Refresh call failed — cookies from the callback route may still work.
          }
        }

        setStatus("Verifying session...");
        const authed = await isAuthenticated();
        if (!authed) {
          localStorage.removeItem("token_last_refreshed_at");
          setStatus("Session verification failed");
          setTimeout(() => router.push("/"), 1500);
          return;
        }

        setStatus("Redirecting to dashboard...");
        sessionStorage.removeItem("__signing_out");
        await new Promise((resolve) => setTimeout(resolve, 400));
        router.push(getStoredAuthRedirect());
      } catch {
        localStorage.removeItem("token_last_refreshed_at");
        setStatus("Sign in failed — please try again");
        setTimeout(() => router.push("/"), 1500);
      }
    };

    processOAuth();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">LinkedIn Sign-in</h2>
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

export default function LinkedInOAuthSuccess() {
  return (
    <Suspense fallback={<Fallback />}>
      <LinkedInOAuthContent />
    </Suspense>
  );
}
