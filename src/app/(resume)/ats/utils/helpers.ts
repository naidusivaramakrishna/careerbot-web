import { X, AlertTriangle, Lightbulb, CheckCircle } from "lucide-react";
import type { AnalysisItem } from "./data";

// ─── ATS localStorage keys ────────────────────────────────────────────────────

export const ATS_UPLOAD_KEYS = [
  "uploadedResumeFile",
  "uploadedFileName",
  "uploadedFileSize",
  "uploadedFileType",
  "isImageBased",
  "currentScore",
  "atsAnalysisData",
] as const;

export function clearAtsUploadStorage() {
  ATS_UPLOAD_KEYS.forEach((k) => localStorage.removeItem(k));
}

// ─── File validation ──────────────────────────────────────────────────────────

/** Returns an error string if the file extension or size is invalid, else null. */
export function validateResumeFile(
  file: File,
  options: { allowDoc?: boolean; checkSize?: boolean } = {}
): string | null {
  const { allowDoc = false, checkSize = false } = options;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowed = allowDoc ? ["pdf", "docx", "doc"] : ["pdf", "docx"];
  if (!allowed.includes(ext)) {
    return `Invalid file type. Only ${allowed.map((e) => e.toUpperCase()).join(", ")} are allowed.`;
  }
  if (checkSize && file.size > 10 * 1024 * 1024) {
    return "File size exceeds 10MB. Please upload a smaller file.";
  }
  return null;
}

// ─── Error extraction ─────────────────────────────────────────────────────────

/** Extracts a readable message from an unknown caught error. */
export function extractErrorMessage(
  err: unknown,
  fallback = "An error occurred. Please try again."
): string {
  if (err instanceof Error) {
    try {
      const p = JSON.parse(err.message);
      const m = p.message ?? p.error?.message ?? p.error ?? p.detail;
      return typeof m === "string" ? m : err.message;
    } catch {
      return err.message || fallback;
    }
  }
  if (typeof err === "string") return err;
  return fallback;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export const getScoreColor = (s: number) => {
  if (s > 80) return "#15803D";
  if (s >= 70) return "#15803D";
  if (s >= 50) return "#84CC16";
  if (s >= 40) return "#F97316";
  return "#EF4444";
};

export const getScoreLabel = (s: number) => {
  if (s > 80) return "Excellent";
  if (s >= 70) return "Excellent";
  if (s >= 50) return "Good";
  if (s >= 40) return "Average";
  return "Bad";
};

export const getConfidenceRating = (score: number): string => {
  let rating;
  if (score < 40) {
    rating = 0.5 + (score / 39) * 1.0;
  } else if (score < 50) {
    rating = 1.5 + ((score - 40) / 9) * 0.5;
  } else if (score < 60) {
    rating = 2.0 + ((score - 50) / 9) * 0.5;
  } else if (score < 75) {
    rating = 2.5 + ((score - 60) / 14) * 1.0;
  } else if (score < 90) {
    rating = 3.5 + ((score - 75) / 14) * 1.0;
  } else {
    rating = 4.5 + ((score - 90) / 10) * 0.5;
  }
  return Math.min(5.0, rating).toFixed(1);
};

export const getSeverityStyle = (severity: AnalysisItem["severity"]) => {
  switch (severity) {
    case "High":
      return {
        icon: X,
        iconColor: "text-red-500",
        label: "High - May cause resume rejection",
        labelBg: "bg-red-100",
        labelColor: "text-red-800",
        fixBg: "bg-red-50",
        fixIconColor: "text-red-600",
        cardBorderColor: "border-red-200",
        pointsBg: "bg-red-100 text-red-700 border border-red-200",
      };
    case "Medium":
      return {
        icon: AlertTriangle,
        iconColor: "text-yellow-500",
        label: "Medium - Reduced ranking in search",
        labelBg: "bg-yellow-100",
        labelColor: "text-yellow-800",
        fixBg: "bg-yellow-50",
        fixIconColor: "text-yellow-600",
        cardBorderColor: "border-yellow-200",
        pointsBg: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      };
    case "Positive":
      return {
        icon: CheckCircle,
        iconColor: "text-green-500",
        label: "Positive - Easy for recruiters to reach you",
        labelBg: "bg-green-100",
        labelColor: "text-green-800",
        fixBg: "bg-green-50",
        fixIconColor: "text-green-600",
        cardBorderColor: "border-green-200",
        pointsBg: "bg-green-100 text-green-700 border border-green-200",
      };
    default:
      return {
        icon: Lightbulb,
        iconColor: "text-gray-500",
        label: "Info",
        labelBg: "bg-gray-100",
        labelColor: "text-gray-800",
        fixBg: "bg-gray-50",
        fixIconColor: "text-gray-600",
        cardBorderColor: "border-gray-300",
        pointsBg: "bg-gray-100 text-gray-700 border border-gray-200",
      };
  }
};
