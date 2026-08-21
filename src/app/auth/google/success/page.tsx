"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import logger from "@/lib/logger";
import { httpClient } from "@/lib/http";

function OAuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Processing OAuth tokens...");
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const processOAuth = async () => {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");

      logger.info("🔐 Google OAuth Success", { 
        accessToken: !!accessToken, 
        refreshToken: !!refreshToken 
      });

      if (!accessToken || !refreshToken) {
        logger.error("❌ Missing OAuth tokens");
        setStatus("Error: Missing tokens");
        setTimeout(() => router.push("/recruiter/auth?error=MissingTokens"), 1000);
        return;
      }

      try {
        setStatus("Storing credentials...");
        
        // 1) Store tokens in localStorage for HTTP client to use
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("access_token_backup", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem("token_last_refreshed_at", Date.now().toString());

        logger.info("✅ Tokens stored in localStorage");

        // 2) Decode token to extract user info
        try {
          const parts = accessToken.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            localStorage.setItem("recruiterData", JSON.stringify({
              id: payload.sub,
              email: payload.email || "",
              status: "active",
            }));
            logger.info("✅ Recruiter data extracted from token");
          }
        } catch (err) {
          logger.warn("Could not decode token payload:", err);
        }

        // 3) Call /auth/refresh to establish session with refresh token
        // This endpoint validates the refresh_token and can set httpOnly cookies
        setStatus("Establishing session...");
        logger.info("📍 Calling /auth/refresh with refresh_token");

        try {
          // ✅ Send refresh_token in request body (required by backend)
          const refreshResponse = await httpClient.post(
            "/auth/refresh",
            { refresh_token: refreshToken }
          );
          logger.info("✅ Session established", refreshResponse.status);
        } catch (refreshError) {
          logger.error("⚠️  /auth/refresh failed, but continuing with localStorage tokens:", refreshError);
          // Don't fail - localStorage tokens work as fallback
          // The backend will still accept Authorization header on subsequent requests
        }

        // 4) Wait briefly then redirect to dashboard
        setStatus("Redirecting to dashboard...");
        await new Promise(resolve => setTimeout(resolve, 500));

        logger.info("🎯 Redirecting to /recruiter/dashboard");
        router.push("/recruiter/dashboard");

      } catch (error) {
        logger.error("❌ OAuth processing failed:", error);
        setStatus("Error processing sign-in");
        setTimeout(() => router.push("/recruiter/auth?error=ProcessingFailed"), 2000);
      }
    };

    processOAuth();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="animate-spin mb-6">
          <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Google Sign-in</h2>
        <p className="text-gray-600 text-sm">{status}</p>
      </div>
    </div>
  );
}

export default function GoogleOAuthSuccess() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="animate-spin mb-4">
              <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
            </div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <OAuthSuccessContent />
    </Suspense>
  );
}
