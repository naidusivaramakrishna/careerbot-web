'use client';

const steps = [
  { label: 'Uploading resume', sub: 'Securely transferring your file' },
  { label: 'Parsing content', sub: 'Extracting text and structure' },
  { label: 'AI analysis', sub: 'Scanning for ATS issues and gaps' },
  { label: 'Generating report', sub: 'Building improvement suggestions' },
];

export default function LoadingModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Top bar with animated progress */}
        <div className="h-1 w-full bg-gray-100">
          <div
            className="h-full bg-[#2557a7] rounded-full animate-pulse"
            style={{ width: '60%', transition: 'width 0.5s ease' }}
          />
        </div>

        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16">
              {/* Spinning ring */}
              <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#2557a7] animate-spin" />
              {/* Inner icon */}
              <div className="absolute inset-2 rounded-full bg-[#e8eff9] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#2557a7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Enhancing Your Resume</h2>
            <p className="text-sm text-gray-500">Our AI is analyzing and optimizing your document</p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, i) => {
              const isDone = i === 0;
              const isActive = i === 1;
              return (
                <div key={step.label} className="flex items-center gap-3">
                  {/* Status icon */}
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                    {isDone ? (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : isActive ? (
                      <div className="w-8 h-8 rounded-full bg-[#e8eff9] flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full border-2 border-[#2557a7] border-t-transparent animate-spin" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                      </div>
                    )}
                  </div>
                  {/* Label */}
                  <div>
                    <p className={`text-sm font-semibold ${isDone ? 'text-gray-400 line-through' : isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-gray-500">{step.sub}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom note */}
          <p className="text-center text-xs text-gray-400 mt-6">This usually takes 15–30 seconds</p>
        </div>
      </div>
    </div>
  );
}
