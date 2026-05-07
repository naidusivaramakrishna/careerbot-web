'use client';

import { Settings, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  displayName: string;
  displayEmail: string;
  displayInitial: string;
  profilePicUrl: string | null;
  isLoggingOut: boolean;
  showMenu: boolean;
  onToggle: () => void;
  onLogout: () => void;
  onClose: () => void;
}

export function UserMenuDropdown({
  displayName, displayEmail, displayInitial,
  profilePicUrl, isLoggingOut, showMenu,
  onToggle, onLogout, onClose,
}: Props) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-blue-300 transition-all focus:outline-none"
        style={{ background: '#2557a7' }}
        aria-label="User menu"
        aria-expanded={showMenu}
      >
        {profilePicUrl ? (
          <Image src={profilePicUrl} alt="Profile" width={32} height={32} className="object-cover w-full h-full" unoptimized={profilePicUrl.startsWith('http')} />
        ) : (
          <span className="text-white text-xs font-bold">{displayInitial}</span>
        )}
      </button>

      {showMenu && (
        <div className="absolute right-0 top-10 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            {displayEmail && <p className="text-xs text-gray-500 truncate mt-0.5">{displayEmail}</p>}
          </div>
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings size={15} className="text-gray-400 shrink-0" />
            Settings
          </Link>
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <LogOut size={15} className="shrink-0" />
            {isLoggingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      )}
    </div>
  );
}
