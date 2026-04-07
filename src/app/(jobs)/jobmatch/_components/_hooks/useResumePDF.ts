"use client";

import { useState, useEffect } from "react";
import httpClient from "@/lib/http";

export const useResumePDF = (resumeId: string | null, matchId?: string | null) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDocx, setIsDocx] = useState(false);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => {
    console.log("🔄 Manual PDF refetch triggered");
    setRefetchTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (!resumeId) {
      console.warn("⚠️ No resume ID provided - will use frontend template");
      // Don't set error, let fallback handle it
      return;
    }

    let isMounted = true;

    const fetchResume = async () => {
      setIsLoading(true);
      setPdfError(null);

      try {
        console.log("📥 Fetching resume with ID:", resumeId, "| Refetch count:", refetchTrigger);

        // Add cache-busting timestamp to prevent browser caching
        const cacheBuster = Date.now();

        // IMPORTANT: Use the download endpoint for preview to get complete resume data
        // The preview endpoint returns incomplete data (missing skills categorization)
        // Include match_id to get JD-matched skills highlighted
        const matchParam = matchId ? `&match_id=${matchId}` : '';
        const resp = await httpClient.get(
          `/parser/download/${resumeId}?format=pdf&_=${cacheBuster}${matchParam}&nocache=${cacheBuster}`,
          {
            responseType: "blob",
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Force-Refresh': 'true',
            }
          }
        );

        if (!isMounted) return;

        const blob = resp.data as Blob;
        const contentType = resp.headers["content-type"] || "";

        console.log("📄 File content-type:", contentType);
        console.log("📦 Blob size:", blob.size);

        // Handle DOCX files
        if (
          contentType.includes("openxml") ||
          contentType.includes("wordprocessingml") ||
          contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
          contentType.includes("msword")
        ) {
          console.log("✅ Detected DOCX file");
          setIsDocx(true);
          setDocxBlob(blob);
          setPdfBlobUrl(null);
          setPdfError(null);
          return;
        }

        // Handle PDF files
        if (contentType.includes("pdf") || contentType.includes("application/pdf")) {
          console.log("✅ Detected PDF file");
          setIsDocx(false);
          setDocxBlob(null);
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
          setPdfError(null);
          return;
        }

        console.warn("⚠️ Unsupported file type:", contentType);
        setPdfError("Unsupported document type. Please use PDF or DOCX format.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("❌ Error loading resume PDF:", err);
        // Don't set error - let it fall back to frontend template
        if (isMounted) {
          console.log("📋 Will fall back to frontend template");
          setPdfBlobUrl(null);
          setPdfError(null); // Clear error so fallback works
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchResume();

    // Cleanup function
    return () => {
      isMounted = false;
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [resumeId, matchId, refetchTrigger]);

  return { pdfBlobUrl, pdfError, isLoading, isDocx, docxBlob, refetch };
};
