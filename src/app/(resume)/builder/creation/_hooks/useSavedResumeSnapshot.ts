import { useEffect, useRef, useState } from "react";

/**
 * resumeData as of the last point it matched the server: once the resume has
 * loaded, and each time a save, autosave or server sync lands (the saved/data
 * versions bump). Live resumeData also carries drafts typed into an open editor
 * before anything is saved, so code that must reflect SAVED content -- the
 * server-rendered preview, the progress ticks -- reads this instead. It is
 * taken when the bump lands, so it can also hold edits typed while that save
 * was in flight (a known, small gap).
 */
export function useSavedResumeSnapshot<T>(
  resumeData: T,
  isLoadingResume: boolean | undefined,
  resumeSavedVersion: number | undefined,
  enhancedDataVersion: number | undefined,
): T {
  const latestRef = useRef(resumeData);
  latestRef.current = resumeData;
  const [snapshot, setSnapshot] = useState(resumeData);
  useEffect(() => {
    if (!isLoadingResume) setSnapshot(latestRef.current);
  }, [isLoadingResume, resumeSavedVersion, enhancedDataVersion]);
  return snapshot;
}
