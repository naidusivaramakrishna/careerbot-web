'use client';

interface SectionStartModalProps {
  open: boolean;
  onStart: () => void;
  title: string;
  subtitle: string;
  questions: number;
//   duration: string;
  instructions: string[];
}

export default function SectionStartModal({
  open,
  onStart,
  title,
  subtitle,
  questions,
//   duration,
  instructions,
}: SectionStartModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6">
        {/* TITLE */}
        <h2 className="text-xl font-semibold text-gray-900 text-center">
          {title}
        </h2>

        <p className="text-sm text-gray-500 text-center mt-1">
          {subtitle}
        </p>

        {/* META */}
        <div className="flex justify-center gap-6 text-sm text-gray-500 mt-4">
          <span className="flex items-center gap-1">
            📄 {questions} Questions
          </span>
          {/* <span className="flex items-center gap-1">
            ⏱ {duration}
          </span> */}
        </div>

        <hr className="my-4" />

        {/* INSTRUCTIONS */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            Instructions
          </h3>

          <ul className="space-y-2">
            {instructions.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ACTION */}
        <div className="flex justify-center mt-6">
          <button
            onClick={onStart}
            className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-900 transition flex items-center gap-2"
          >
            Start section
            <span>▶</span>
          </button>
        </div>
      </div>
    </div>
  );
}
