"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import logger from "@/lib/logger";

function OAuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("An error occurred during sign-in");

  useEffect(() => {
    const message = searchParams.get("message");
    logger.error("OAuth error:", message);

    const errorMap: Record<string, string> = {
      google_auth_failed: "Google sign-in failed. Please try again.",
      unexpected_error: "An unexpected error occurred. Please try again.",
      MissingTokens: "Sign-in completed but tokens were missing.",
      TokenStorageFailed: "Failed to store authentication tokens.",
    };

    if (message && errorMap[message]) {
      setErrorMessage(errorMap[message]);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Sign-in Failed</h1>
          <p className="text-gray-600 mb-6">{errorMessage}</p>

          <button
            onClick={() => router.push("/recruiter/auth")}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Back to Sign-in
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full mt-3 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OAuthError() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <OAuthErrorContent />
    </Suspense>
  );
}
