"use client";

import { AlertCircle, X, RefreshCw, Zap, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

interface ErrorPopupModalProps {
  error: string | null;
  onRetry?: () => void;
  onClose: () => void;
  details?: {
    error_code?: string;
    credits_required?: number;
    credits_remaining?: number;
  };
}

export default function ErrorPopupModal({
  error,
  onRetry,
  onClose,
  details,
}: ErrorPopupModalProps) {
  const router = useRouter();
  if (!error) return null;

  const errorLower = error.toLowerCase();

  // Detect error types
  const isCreditsError =
    errorLower.includes("credits") ||
    errorLower.includes("payment") ||
    details?.error_code === "HTTP_402";

  const isScannedPdf =
    errorLower.includes("scanned") ||
    errorLower.includes("image-based") ||
    errorLower.includes("extractable text");

  const isAuthError =
    errorLower.includes("authentication") ||
    errorLower.includes("credentials") ||
    errorLower.includes("401") ||
    details?.error_code === "HTTP_401";

  const isNetworkError =
    errorLower.includes("network") ||
    errorLower.includes("connection") ||
    errorLower.includes("fetch");

  // Determine styling
  let bgColor = "from-red-50/95 to-rose-50/95";
  let borderColor = "border-red-300/50";
  let iconBg = "from-red-500 to-rose-600";
  let titleColor = "text-red-900";
  let textColor = "text-red-800";
  let buttonColor =
    "from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-600/40 hover:shadow-red-600/50";
  let iconShadow = "shadow-red-500/30";
  let title = "Error";
  let icon = AlertCircle;
  let message = error;
  let showRetryButton = !!onRetry;
  let buttonLabel = "Try Again";
  let secondaryAction: {
    label: string;
    onClick: () => void;
    show: boolean;
  } = { label: "", onClick: () => {}, show: false };

  if (isCreditsError) {
    bgColor = "from-blue-50/95 to-indigo-50/95";
    borderColor = "border-blue-200/60";
    iconBg = "from-[#2557a7] to-[#1a3f82]";
    titleColor = "text-blue-900";
    textColor = "text-blue-800";
    buttonColor =
      "from-[#2557a7] to-[#1a3f82] hover:from-[#1e4d96] hover:to-[#152e60] shadow-blue-600/40 hover:shadow-blue-600/50";
    iconShadow = "shadow-blue-500/30";
    title = "Insufficient Credits";
    icon = Zap;
    message = error;
    showRetryButton = false;

    if (details?.credits_required && details?.credits_remaining !== undefined) {
      const shortage = details.credits_required - details.credits_remaining;
      message = `You need ${details.credits_required} credits but only have ${details.credits_remaining}. You're short by ${shortage} credits.`;
    }

    secondaryAction = {
      label: "Buy Credits",
      onClick: () => {
        onClose();
        router.push("/settings?tab=billing");
      },
      show: true,
    };
  } else if (isScannedPdf) {
    bgColor = "from-amber-50/95 to-orange-50/95";
    borderColor = "border-amber-300/50";
    iconBg = "from-amber-500 to-orange-600";
    titleColor = "text-amber-900";
    textColor = "text-amber-800";
    buttonColor =
      "from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-600/40 hover:shadow-amber-600/50";
    iconShadow = "shadow-amber-500/30";
    title = "PDF Format Issue";
    message = "This appears to be a scanned/image-based PDF. Please upload a text-based PDF resume instead.";
  } else if (isAuthError) {
    bgColor = "from-indigo-50/95 to-purple-50/95";
    borderColor = "border-indigo-300/50";
    iconBg = "from-indigo-500 to-purple-600";
    titleColor = "text-indigo-900";
    textColor = "text-indigo-800";
    buttonColor =
      "from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-600/40 hover:shadow-indigo-600/50";
    iconShadow = "shadow-indigo-500/30";
    title = "Authentication Failed";
    message = "Please sign in again to continue.";
    showRetryButton = false;
    secondaryAction = {
      label: "Sign In",
      onClick: () => {
        onClose();
        router.push("/auth/login");
      },
      show: true,
    };
  } else if (isNetworkError) {
    bgColor = "from-cyan-50/95 to-blue-50/95";
    borderColor = "border-cyan-300/50";
    iconBg = "from-cyan-500 to-blue-600";
    titleColor = "text-cyan-900";
    textColor = "text-cyan-800";
    buttonColor =
      "from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-cyan-600/40 hover:shadow-cyan-600/50";
    iconShadow = "shadow-cyan-500/30";
    title = "Network Error";
    message = "Check your connection and try again.";
  }

  const handleRetryClick = () => {
    onClose();
    setTimeout(onRetry, 200);
  };

  const IconComponent = icon;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
        <div
          className={`relative bg-gradient-to-br ${bgColor} backdrop-blur-xl ${borderColor} border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden`}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr opacity-10 rounded-full blur-3xl" />

          <div className="relative p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${iconBg} rounded-xl flex items-center justify-center shadow-lg ${iconShadow} flex-shrink-0`}
              >
                <IconComponent className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-200/50 rounded-lg"
                aria-label="Close error modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            <h3 className={`text-lg font-bold ${titleColor} mb-3`}>{title}</h3>

            {/* Message */}
            <p className={`text-sm ${textColor} mb-6 leading-relaxed font-medium`}>
              {message}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {showRetryButton && onRetry && (
                <button
                  onClick={handleRetryClick}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${buttonColor} text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105`}
                >
                  <RefreshCw className="w-4 h-4" />
                  {buttonLabel}
                </button>
              )}

              {secondaryAction.show && (
                <button
                  onClick={secondaryAction.onClick}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${buttonColor} text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105`}
                >
                  {isCreditsError && <Zap className="w-4 h-4" />}
                  {isAuthError && <Lock className="w-4 h-4" />}
                  {secondaryAction.label}
                </button>
              )}

              {!showRetryButton && !secondaryAction.show && (
                <button
                  onClick={onClose}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${buttonColor} text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105`}
                >
                  Dismiss
                </button>
              )}

              {(showRetryButton || secondaryAction.show) && (
                <button
                  onClick={onClose}
                  className="px-4 py-3 bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 text-sm font-semibold rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
