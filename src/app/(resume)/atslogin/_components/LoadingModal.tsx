"use client";

import { Upload, FileText, Zap, CheckCircle } from "lucide-react";

interface LoadingModalProps {
  uploadProgress: number;
  analysisPhase: string;
}

export default function LoadingModal({ uploadProgress, analysisPhase }: LoadingModalProps) {
  return (
    <>
      <style>{`
        body, html {
          overflow: hidden !important;
        }

        @keyframes spin-smooth {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes ambient-glow {
          0%, 100% { box-shadow: 0 0 40px rgba(79, 70, 229, 0.1), 0 0 80px rgba(99, 102, 241, 0.05); }
          50% { box-shadow: 0 0 60px rgba(79, 70, 229, 0.2), 0 0 100px rgba(99, 102, 241, 0.1); }
        }

        @keyframes wave-progress {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        .modal-card {
          animation: ambient-glow 3s ease-in-out infinite;
        }

        .ai-loader-container {
          position: relative;
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-loader {
          position: relative;
          width: 140px;
          height: 140px;
          animation: rotate-blocks 4s linear infinite;
          filter: drop-shadow(0 0 30px rgba(59, 130, 246, 0.4));
        }

        .block-container {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .block {
          position: absolute;
          width: 50px;
          height: 50px;
          border-radius: 8px;
          animation: block-scale 2s ease-in-out infinite;
        }

        .block-1 {
          top: 5px;
          left: 5px;
          background: linear-gradient(135deg, #3B82F6, #5B6FFF);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
          animation-delay: 0s;
        }

        .block-2 {
          top: 5px;
          right: 5px;
          background: linear-gradient(135deg, #5B6FFF, #06B6D4);
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.6);
          animation-delay: 0.2s;
        }

        .block-3 {
          bottom: 5px;
          left: 5px;
          background: linear-gradient(135deg, #06B6D4, #22D3EE);
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.6);
          animation-delay: 0.4s;
        }

        .block-4 {
          bottom: 5px;
          right: 5px;
          background: linear-gradient(135deg, #22D3EE, #3B82F6);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
          animation-delay: 0.6s;
        }

        .spinner-ring {
          width: 80px;
          height: 80px;
          border: 4px solid #e5e7eb;
          border-top-color: #3B82F6;
          border-right-color: #06B6D4;
          border-radius: 50%;
          animation: spin-smooth 2s linear infinite;
        }

        .spinner-label {
          margin-top: 16px;
          font-size: 1.125rem;
          font-weight: 600;
          color: #3B82F6;
          letter-spacing: 0.05em;
        }
      `}</style>

      <div className="fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" style={{ left: '70px' }}>
        <div className="relative w-full max-w-2xl mx-4">
          <div className="modal-card bg-white rounded-2xl shadow-2xl shadow-gray-300/40 p-10 md:p-14 animate-in fade-in zoom-in duration-300 flex flex-col items-center border border-gray-200 relative overflow-hidden">
            <div className="text-center space-y-8 relative z-10">
              {/* Spinner Animation */}
              <div className="flex justify-center">
                <div className="spinner-ring"></div>
              </div>

              {/* Progress Percentage */}
              <div className="spinner-label">{uploadProgress}%</div>

              {/* Status Text */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Analyzing Your Resume</h3>
                <p className="text-sm text-gray-500 font-medium">{analysisPhase || "Processing..."}</p>
              </div>

              {/* Progress Bar with Gradient */}
              <div className="w-full space-y-4">
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300 shadow-lg shadow-indigo-500/20">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-lg shadow-indigo-400/50 relative"
                    style={{
                      width: `${uploadProgress}%`,
                      background: 'linear-gradient(90deg, #3B82F6 0%, #6366F1 25%, #06B6D4 50%, #6366F1 75%, #3B82F6 100%)',
                      backgroundSize: '300% 100%',
                      animation: 'wave-progress 3s linear infinite'
                    }}
                  ></div>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center justify-between gap-2">
                  {['Uploading', 'Parsing', 'Analyzing', 'Completing'].map((step, idx) => {
                    const isComplete = uploadProgress >= (idx + 1) * 25;
                    const isActive = uploadProgress > idx * 25 && uploadProgress < (idx + 1) * 25;

                    // Icon mapping for each step
                    const icons = [Upload, FileText, Zap, CheckCircle];
                    const IconComponent = icons[idx];

                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isComplete
                              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                              : isActive
                              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/60'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className={`text-xs font-semibold text-center leading-tight transition-colors ${
                          isComplete ? 'text-blue-600' : isActive ? 'text-indigo-600' : 'text-gray-400'
                        }`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
