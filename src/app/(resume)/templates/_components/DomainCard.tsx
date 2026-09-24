"use client";

import React from 'react';
import { TemplatePreviewRenderer } from '@/components/templates';

const FALLBACK_IMAGE = '/assets/templates/template-1.jpg';

interface DomainCardProps {
  domainName: string;
  templateCount: number;
  previewImage: string;
  previewHtml?: string;
  previewCss?: string;
  onClick: () => void;
}

export default function DomainCard({
  domainName,
  previewImage,
  previewHtml,
  previewCss,
  onClick,
}: DomainCardProps) {

  return (
    <button
      data-testid={`domain-card-${domainName.toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onClick}
      className="relative bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden shadow-sm hover:ring-[#2257a7] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer text-left flex flex-col p-0"
    >
      {/* Resume Preview Container */}
      <div className="relative w-full bg-linear-to-br from-slate-50 to-slate-100/60 overflow-hidden flex-1" style={{ minHeight: "480px" }}>
        {/* Resume Content Preview */}
        <TemplatePreviewRenderer
          previewHtml={previewHtml}
          previewCss={previewCss}
          fallbackImage={previewImage || FALLBACK_IMAGE}
          title={domainName}
          height="100%"
          width="100%"
          scale={0.65}
          hideScroll={true}
          fillContainer={true}
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Card Footer */}
      <h3 className="absolute bottom-0 left-0 right-0 font-semibold text-slate-800 group-hover:text-[#2257a7] transition-colors text-xs leading-tight text-center py-2 px-2 border-t border-slate-100 bg-white">
        {domainName}
      </h3>
    </button>
  );
}
