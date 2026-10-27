"use client";

import React, { useState } from "react";
import { FileText, Image as ImageIcon, Loader2, Paperclip } from "lucide-react";
import { openOrDownloadTicketAttachment } from "@/api/chatbotApi";

export interface TicketAttachmentLinkProps {
  ticketId: string;
  attachment: { attachment_id: string; filename: string; view_url?: string };
  className?: string;
}

const describeError = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : "Couldn't open this attachment. Please try again.";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const fileIconFor = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (IMAGE_EXTENSIONS.has(ext)) return ImageIcon;
  if (ext === "pdf") return FileText;
  return Paperclip;
};

/**
 * One ticket attachment, rendered as a clickable row. Two paths:
 * - Guest tickets carry a pre-authorized view_url (single-use token link,
 *   no auth needed) -- a plain anchor is correct and sufficient there.
 * - Everyone else (ticket owner, staff) has no view_url; opening it needs
 *   a credentialed fetch through openOrDownloadTicketAttachment (handles
 *   the owning endpoint's 403-vs-stale-cookie quirk -- see that function's
 *   comment), so this renders a button with its own loading/error state
 *   instead of a navigable href.
 */
export default function TicketAttachmentLink({ ticketId, attachment, className = "" }: TicketAttachmentLinkProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Icon = fileIconFor(attachment.filename);

  if (attachment.view_url) {
    return (
      <a
        href={attachment.view_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:border-[#2557a7] hover:bg-[#eef4ff] hover:text-[#2557a7] ${className}`}
      >
        <Icon className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="truncate">{attachment.filename}</span>
      </a>
    );
  }

  const handleClick = async () => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      await openOrDownloadTicketAttachment(ticketId, attachment.attachment_id, attachment.filename);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 transition hover:border-[#2557a7] hover:bg-[#eef4ff] hover:text-[#2557a7] disabled:cursor-wait disabled:opacity-70"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#2557a7]" />
        ) : (
          <Icon className="h-4 w-4 shrink-0 text-gray-400" />
        )}
        <span className="truncate">{attachment.filename}</span>
      </button>
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
