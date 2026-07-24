"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mapAuthError } from "@/lib/authMessages";

interface UseEmailFormConfig {
    onSubmit: (email: string) => Promise<{ message?: string }>;
    errorContext: string;
    successMessage?: string;
    redirectPath?: string;
    redirectDelayMs?: number;
    rateLimitSeconds?: number;
}

export function useEmailForm({
    onSubmit,
    errorContext,
    successMessage,
    redirectPath = "/?showLogin=true",
    redirectDelayMs = 5000,
    rateLimitSeconds,
}: UseEmailFormConfig) {
    const router = useRouter();
    const [email, setEmailState] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
    const [emailError, setEmailError] = useState("");
    const [lastAttemptTime, setLastAttemptTime] = useState(0);
    const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
        };
    }, []);

    const setEmail = (value: string) => {
        setEmailState(value);
        setEmailError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError("Please enter a valid email address");
            return;
        }

        const now = Date.now();
        if (rateLimitSeconds && lastAttemptTime > 0 && now - lastAttemptTime < rateLimitSeconds * 1000) {
            const s = Math.ceil((rateLimitSeconds * 1000 - (now - lastAttemptTime)) / 1000);
            setEmailError(`Please wait ${s}s before trying again`);
            return;
        }

        try {
            setStatus("loading");
            setEmailError("");
            const response = await onSubmit(email);
            setStatus("success");
            setLastAttemptTime(now);
            toast.success(response.message || successMessage || "Email sent successfully!");
            redirectTimerRef.current = setTimeout(() => router.push(redirectPath), redirectDelayMs);
        } catch (error: unknown) {
            const errorMsg = mapAuthError(error, errorContext);
            setStatus("idle");
            setLastAttemptTime(now);
            setEmailError(errorMsg);
        }
    };

    const goToSignIn = () => router.push(redirectPath);

    return { email, setEmail, emailError, status, handleSubmit, goToSignIn };
}
