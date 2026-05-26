"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

/**
 * Reusable "Copy plain text" button.
 *
 * Uses navigator.clipboard with a fallback for old browsers. On
 * success: sonner toast + temporary check-mark icon. On failure:
 * sonner error.
 */
export interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export default function CopyButton({
  text,
  label = "Copy plain text",
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Old-browser fallback — write into a transient textarea.
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!ok) throw new Error("execCommand returned false");
      }
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the text manually.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={[
        "inline-flex items-center gap-2 px-4 py-2",
        "text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200",
        "rounded-lg transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-[#2257a7] focus:ring-offset-2",
        className ?? "",
      ].join(" ")}
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="w-4 h-4" aria-hidden="true" />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}
