"use client";
import React, { useMemo } from "react";

interface TemplatePreviewRendererProps {
  previewHtml?: string | null;
  previewCss?: string | null;
  title?: string;
  className?: string;
  height?: string;
  width?: string;
  fallbackImage?: string;
  scale?: number; // Custom scale for thumbnail view (e.g., 0.2 for small cards)
  hideScroll?: boolean; // Hide scrollbars for thumbnail previews
  fillContainer?: boolean; // Fill container without centering/padding (like image)
}

/**
 * Renders template preview using backend-generated HTML/CSS in an iframe
 * Falls back to image if HTML/CSS not available
 */
export default function TemplatePreviewRenderer({
  previewHtml,
  previewCss,
  title = "Template Preview",
  className = "",
  height = "600px",
  width = "100%",
  fallbackImage,
  scale = 0.95,
  hideScroll = false,
  fillContainer = false,
}: TemplatePreviewRendererProps) {
  // Build complete HTML document for iframe
  const srcDoc = useMemo(() => {
    if (!previewHtml || !previewCss) return null;

    const htmlStyle = fillContainer
      ? `display: block !important;
      background: #fff !important;
      overflow: ${hideScroll ? 'hidden' : 'auto'} !important;
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;`
      : `display: flex !important;
      align-items: flex-start !important;
      justify-content: center !important;
      background: #f5f5f5 !important;
      overflow: ${hideScroll ? 'hidden' : 'auto'} !important;
      padding: 20px 0 !important;`;

    const bodyStyle = fillContainer
      ? `transform: scale(${scale}) !important;
      transform-origin: top left !important;
      margin: 0 !important;
      width: ${100 / scale}% !important;
      max-width: none !important;
      padding: 0 !important;`
      : `transform: scale(${scale}) !important;
      transform-origin: top center !important;
      margin: 0 !important;`;

    const fillContainerCss = fillContainer
      ? `html { display: block !important; margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow: hidden !important; }
      body { margin: 0 !important; padding: 12px 12px 12px 12px !important; box-sizing: border-box !important; max-width: none !important; display: block !important; overflow-x: hidden !important; overflow-y: hidden !important; }
      body *, body *:before, body *:after { width: auto !important; max-width: 100% !important; }
      div { width: 100% !important; max-width: 100% !important; }
      table { width: 100% !important; }
      p { width: 100% !important; max-width: 100% !important; }`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${previewCss}
    html {
      ${htmlStyle}
    }
    body {
      ${bodyStyle}
    }
    ${fillContainerCss}
  </style>
</head>
<body>
  ${previewHtml}
</body>
</html>`;
  }, [previewHtml, previewCss, title, scale, hideScroll, fillContainer]);

  // If we have HTML/CSS, render in iframe
  if (srcDoc) {
    return (
      <iframe
        title={title}
        srcDoc={srcDoc}
        className={className}
        style={{
          width,
          height,
          border: "none",
          backgroundColor: "#ffffff",
        }}
        sandbox="allow-same-origin"
      />
    );
  }

  // Fallback to image if available
  if (fallbackImage) {
    return (
      <img
        src={fallbackImage}
        alt={title}
        className={className}
        style={{
          width,
          height,
          objectFit: "contain",
          borderRadius: "8px",
          backgroundColor: "#f9fafb",
        }}
      />
    );
  }

  // No preview available
  return (
    <div
      className={className}
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f3f4f6",
        borderRadius: "8px",
        border: "1px dashed #d1d5db",
        color: "#6b7280",
        fontSize: "14px",
      }}
    >
      Preview not available
    </div>
  );
}
