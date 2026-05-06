"use client";

import React, { useState } from 'react';
import Image from 'next/image';

const FALLBACK_IMAGE = '/assets/templates/template-1.jpg';

interface DomainCardProps {
  domainName: string;
  templateCount: number;
  previewImage: string;
  onClick: () => void;
}

export default function DomainCard({
  domainName,
  previewImage,
  onClick,
}: DomainCardProps) {
  const [imgSrc, setImgSrc] = useState(previewImage || FALLBACK_IMAGE);

  return (
    <button
      onClick={onClick}
      className="relative bg-white rounded-xl ring-1 ring-slate-200 overflow-hidden shadow-sm hover:ring-teal-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer text-left flex flex-col"
    >
      {/* Resume Preview Container */}
      <div className="relative w-full bg-linear-to-br from-slate-50 to-slate-100/60 overflow-hidden">
        {/* Resume Content Preview */}
        <Image
          src={imgSrc}
          alt={domainName}
          width={400}
          height={500}
          className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
          priority={false}
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Card Footer */}
      <h3 className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors text-xs leading-tight text-center py-2 px-2 border-t border-slate-100">
        {domainName}
      </h3>
    </button>
  );
}
