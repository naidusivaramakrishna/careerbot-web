"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md animate-fadeIn overflow-hidden"
      onClick={handleBackdropClick}
    >
      <div className="h-full overflow-y-auto overflow-x-hidden p-4">
        <div className="min-h-full flex items-center justify-center py-8">
          <div
            ref={modalRef}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl relative animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 bg-gray-100 hover:bg-gray-200 rounded-full p-2.5 transition-all duration-200 hover:scale-110 group shadow-lg"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-600 group-hover:text-gray-900 group-hover:rotate-90 transition-transform duration-200" />
            </button>

            <div className="px-6 pb-8 pt-2">{children}</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        div::-webkit-scrollbar {
          width: 10px;
        }
        div::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        div::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 5px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default ResumeUploadModal;
