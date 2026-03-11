"use client";

interface PromptCardProps {
  prompt: string;
  onClick: (prompt: string) => void;
}

export default function PromptCard({ prompt, onClick }: PromptCardProps) {
  return (
    <button
      onClick={() => onClick(prompt)}
      type="button"
      className="w-full p-3 text-left text-sm font-medium text-gray-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {prompt}
    </button>
  );
}
