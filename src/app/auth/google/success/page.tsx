"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredAuthRedirect } from "@/lib/authRedirect";
import { isAuthenticated } from "@/api/authApi";
import { clearPendingVerification } from "@/lib/pendingVerification";

function GoogleOAuthContent() {
  const router = useRouter();
  const [status, setStatus] = useState("Completing sign in...");
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    // Timers are tracked so a user who navigates away mid-verification is not
    // yanked back to "/" by a stale redirect, and so no state is set after
    // unmount.
    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;
    const goHomeAfter = (ms: number) => {
      redirectTimer = setTimeout(() => {
        if (!cancelled) router.push("/");
      }, ms);
    };

    const processOAuth = async () => {
      // NO tokens are read from the URL, and none are accepted from it.
      //
      // The backend's Google callback redirects here with the session already
      // established as httpOnly cookies and NOTHING in the query string —
      // verified against
      //   careerbot-api origin/integration/develop2_072026_pr:
      //   app/api/v1/endpoints/google_oauth.py
      // where the handler builds RedirectResponse(f"{frontend_url}/auth/google/
      // success") and then calls set_access_token_cookie /
      // set_refresh_token_cookie. LinkedIn's handler does the same.
      //
      // Two consequences, both of which this rewrite fixes:
      //
      // 1. BROKEN LOGIN. This page required access_token and refresh_token
      //    query params and bounced the user home with "missing tokens" when
      //    they were absent. They are ALWAYS absent, so every Google sign-in
      //    failed at the last step even though the cookies had landed.
      //
      // 2. LOGIN CSRF / TOKEN INJECTION. Because the legitimate flow never
      //    supplies those params, the only thing that could was a crafted
      //    link. This page took an arbitrary refresh_token from a public URL
      //    and exchanged it for session cookies — letting an attacker sign a
      //    victim's browser into an ACCOUNT THE ATTACKER CONTROLS, then watch
      //    what the victim does in it.
      //
      // The cookies are the session. Verifying them is the whole job.
      try {
        setStatus("Verifying session...");
        const authed = await isAuthenticated();
        if (cancelled) return;
        if (!authed) {
          setStatus("Session verification failed");
          goHomeAfter(1500);
          return;
        }

        setStatus("Redirecting to dashboard...");
        sessionStorage.removeItem("__signing_out");
        // A session was just handed over, the same as authApi.signIn: drop any
        // unverified-signup record so the "Resume Email Verification" banner
        // does not follow the signed-in user around.
        clearPendingVerification();
        await new Promise((resolve) => setTimeout(resolve, 400));
        if (cancelled) return;
        // Hard navigation — not router.push — so that:
        // 1. The Next.js client-side router cache (RSC payloads) is bypassed,
        //    preventing a previous user's stale cached page from being served.
        // 2. The server-side auth guard in (user)/layout.tsx re-runs with the
        //    new session cookies.
        // 3. Module-scoped JS caches (e.g. cachedUserId) reset to null.
        // signOut() uses the same pattern for the same reasons.
        window.location.href = getStoredAuthRedirect();
      } catch {
        if (cancelled) return;
        localStorage.removeItem("token_last_refreshed_at");
        setStatus("Sign in failed — please try again");
        goHomeAfter(1500);
      }
    };

    processOAuth();

    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [router]);

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
