import React from 'react';
import { Eye } from 'lucide-react';
import { type TemplateResponse } from '@/api/resumeApi';
import { Badge } from '@/components/common';

interface TemplateCardProps {
  template: TemplateResponse;
  onClick: () => void;
}

export default function TemplateCard({ template, onClick }: TemplateCardProps) {
  // Get preview image URL - fallback to local assets if preview_url not available
  const getPreviewImage = () => {
    if (template.preview_url) {
      return template.preview_url;
    }
    // Fallback to local assets based on template ID/name
    return '/assets/templates/template-1.png';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-[#2557a7] hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
      {/* Preview Image Container */}
      <div className="relative h-64 bg-gray-100 overflow-hidden">
        <img
          src={getPreviewImage()}
          alt={template.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = '/assets/templates/template-1.png';
          }}
        />

        {/* ATS Badge */}
        {template.ats_friendly && (
          <div className="absolute top-3 right-3 bg-[#2557a7] text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-md">
            ATS Friendly
          </div>
        )}

        {/* Hover Overlay with Preview Button */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-[#2557a7] rounded-lg font-semibold shadow-lg hover:bg-gray-50 transition-colors">
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
          {template.name}
        </h3>
        {template.subtitle && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {template.subtitle}
          </p>
        )}

        {/* Premium Badge */}
        {template.is_premium && (
          <Badge variant="default" className="text-[10px] px-2 py-0.5">
            Premium
          </Badge>
        )}
      </div>
    </div>
  );
}
