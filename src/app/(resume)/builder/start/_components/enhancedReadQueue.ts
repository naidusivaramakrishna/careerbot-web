// careerbot-api limits GET /resume/enhance/{id} to 60 requests a minute
// (app/api/v1/endpoints/resume_enhancer.py, get_enhanced_resume), and the resume list can hold up
// to 100 enhanced resumes. The list reads each record once for its "% complete", so besides running
// a few at a time it stays within a per-minute budget below the limit, which leaves room for opening
// a resume (the editor reads the same endpoint) right afterwards.
export const ENHANCED_READS_PER_MINUTE = 50;

type Clock = { now: () => number; sleep: (ms: number) => Promise<void> };
type Store = Pick<Storage, 'getItem' | 'setItem'>;

// The reads started in the last minute are kept here so every tab of the browser draws on the same budget.
const STORAGE_KEY = 'enhanced_reads_started';

const realClock: Clock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/**
 * A rolling one-minute request budget. `acquire` resolves true when one more request may start (and
 * counts it). If `shouldContinue()` turns false while waiting, it resolves false without using a slot,
 * so a page that was left does not spend the budget the next page needs.
 *
 * With a `storage` the start times are shared through it, so several tabs count against one budget; if
 * the storage cannot be read or written the budget still counts in this tab's memory.
 */
export const createReadBudget = (perMinute: number, clock: Clock = realClock, storage: Store | null = null) => {
  const windowMs = 60_000;
  let started: number[] = [];
  // Once a write fails, the storage only holds old counts (reads may still work), so this tab's own list is the truth.
  let writeFailed = false;

  const load = (): number[] => {
    if (!storage || writeFailed) return started;
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (typeof raw !== 'string') return started;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((n): n is number => typeof n === 'number');
    } catch { /* storage unreadable: use this tab's own count */ }
    return started;
  };
  const save = (list: number[]) => {
    started = list;
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(list));
      writeFailed = false;
    } catch {
      writeFailed = true; // storage unwritable: the in-memory count above still applies
    }
  };

  return {
    acquire: async (shouldContinue: () => boolean = () => true): Promise<boolean> => {
      for (;;) {
        if (!shouldContinue()) return false;
        const t = clock.now();
        const recent = load().filter((s) => t - s < windowMs);
        if (recent.length < perMinute) {
          save([...recent, t]);
          return true;
        }
        await clock.sleep(Math.min(...recent) + windowMs - t);
      }
    },
    reset: () => { save([]); },
  };
};

const browserStorage = (): Store | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

// One budget for the whole browser: another tab, or leaving the list and coming back within a minute,
// counts against the same limit.
export const enhancedReadBudget = createReadBudget(ENHANCED_READS_PER_MINUTE, realClock, browserStorage());
