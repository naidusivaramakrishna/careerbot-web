import { useEffect, useState } from "react";

/**
 * Whole seconds since `active` last became true: a real clock (read from Date.now), reset each time a
 * new run starts. It measures time spent; it never estimates how long is left.
 */
export function useElapsedSeconds(active: boolean): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
    if (!active) return;
    const startedAt = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [active]);

  return seconds;
}

export const formatElapsed = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
