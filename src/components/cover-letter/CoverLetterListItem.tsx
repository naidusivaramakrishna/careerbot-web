'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, MoreVertical } from 'lucide-react';

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const STATUS_STYLES: Record<'generated' | 'draft', string> = {
  generated: 'bg-green-50 text-green-700',
  draft: 'bg-amber-50 text-amber-700',
};

const STATUS_LABELS: Record<'generated' | 'draft', string> = {
  generated: '✓ Generated',
  draft: '✎ Draft',
};

export interface CoverLetterListItemProps {
  id: string;
  jobTitle: string;
  company?: string;
  createdAt: Date;
  status: 'generated' | 'draft';
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export default function CoverLetterListItem({
  id,
  jobTitle,
  company,
  createdAt,
  status,
  isActive,
  onClick,
  onDelete,
}: CoverLetterListItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointer = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMenuOpen(false);
      }}
      className={[
        'relative flex items-start gap-3 px-3 py-3 mx-2 rounded-lg cursor-pointer transition-colors select-none outline-none focus-visible:ring-2 focus-visible:ring-[#2557a7]',
        isActive
          ? 'bg-blue-50 border-l-2 border-blue-600'
          : 'border-l-2 border-transparent hover:bg-slate-50',
      ].join(' ')}
    >
      {/* File icon */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mt-0.5">
        <FileText className="w-4 h-4 text-[#2557a7]" />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate pr-1">{jobTitle}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {company ? `${company} · ` : ''}
          {timeAgo(createdAt)}
        </p>
        <span
          className={`mt-1.5 inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* 3-dot menu — visible on hover or when open */}
      {(isHovered || menuOpen) && (
        <div
          className="flex-shrink-0 relative"
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-slate-200 bg-white shadow-lg py-1"
            >
              <button
                type="button"
                role="menuitem"
                disabled
                className="w-full text-left px-3 py-1.5 text-sm text-slate-400 cursor-not-allowed flex justify-between"
              >
                Rename
                <span className="text-xs opacity-60">soon</span>
              </button>
              <button
                type="button"
                role="menuitem"
                disabled
                className="w-full text-left px-3 py-1.5 text-sm text-slate-400 cursor-not-allowed flex justify-between"
              >
                Duplicate
                <span className="text-xs opacity-60">soon</span>
              </button>
              <hr className="my-1 border-slate-100" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(id);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}