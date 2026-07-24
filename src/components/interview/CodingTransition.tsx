"use client";

import { useEffect, useState } from "react";
import { Code2, Timer } from "lucide-react";

interface CodingTransitionProps {
  problemTitle: string;
  timeLimitMin: number;
  onDone: () => void;
}

export function CodingTransition({ problemTitle, timeLimitMin, onDone }: CodingTransitionProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) { onDone(); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onDone]);

  return (
    <div className="fixed inset-0 z-50 bg-[#2557a7] flex flex-col items-center justify-center text-white text-center px-6">
      <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6">
        <Code2 size={36} />
      </div>
      <p className="text-xs font-bold tracking-widest uppercase opacity-70 mb-2">Coding Round</p>
      <h1 className="text-xl font-bold mb-3 max-w-sm">{problemTitle}</h1>
      <div className="flex items-center gap-2 text-sm opacity-70 mb-8">
        <Timer size={14} />
        <span>{timeLimitMin} min time limit</span>
      </div>
      <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
        <span className="text-3xl font-black">{count}</span>
      </div>
      <p className="text-xs opacity-50 mt-4">Starting in {count}…</p>
    </div>
  );
}
