'use client';

interface SectionStartModalProps {
  open: boolean;
  onStart: () => void;
  title: string;
  subtitle: string;
  questions: number;
  instructions: string[];
}

export default function SectionStartModal({
  open,
  onStart,
  title,
  subtitle,
  questions,
  instructions,
}: SectionStartModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-[#2557a7] px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white leading-snug">{title}</h2>
              <p className="text-sm text-white/70 mt-1">{subtitle}</p>
            </div>
            <span className="shrink-0 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {questions}Q
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Instructions</p>
          <ul className="space-y-2.5">
            {instructions.map((item, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#2557a7]/10 text-[#2557a7] text-xs font-bold flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-6" />

        {/* Action */}
        <div className="px-6 py-5">
          <button
            onClick={onStart}
            className="w-full bg-[#2557a7] hover:bg-[#1e4a94] text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Start Section →
          </button>
        </div>

      </div>
    </div>
  );
}
