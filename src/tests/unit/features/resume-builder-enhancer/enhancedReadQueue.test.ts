import { describe, it, expect } from 'vitest';
import {
  createReadBudget,
} from '@/app/(resume)/builder/start/_components/enhancedReadQueue';

const fakeClock = (start = 1_000_000) => {
  let t = start;
  const sleeps: number[] = [];
  return {
    sleeps,
    advance: (ms: number) => { t += ms; },
    clock: {
      now: () => t,
      sleep: async (ms: number) => { sleeps.push(ms); t += ms; },
    },
  };
};

const sharedStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
  };
};

describe('enhancedReadQueue', () => {
  it('counts reads made by another tab of the same browser against the same budget', async () => {
    const { clock, sleeps } = fakeClock();
    const storage = sharedStorage();
    const tabA = createReadBudget(2, clock, storage);
    const tabB = createReadBudget(2, clock, storage);

    await tabA.acquire();
    await tabB.acquire();
    expect(sleeps).toEqual([]);

    await tabA.acquire(); // two reads are already used between both tabs: this one waits
    expect(sleeps).toEqual([60_000]);
  });

  it('keeps counting in memory when storage can be read but not written', async () => {
    const { clock, sleeps } = fakeClock();
    // e.g. quota exceeded: reads keep returning the old, now stale, list
    const readOnly = { getItem: () => '[]', setItem: () => { throw new Error('quota'); } };
    const budget = createReadBudget(1, clock, readOnly);

    await budget.acquire();
    await budget.acquire();
    expect(sleeps).toEqual([60_000]);
  });

  it('keeps counting in memory when the browser storage is not available', async () => {
    const { clock, sleeps } = fakeClock();
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    const budget = createReadBudget(1, clock, broken);

    await budget.acquire();
    await budget.acquire();
    expect(sleeps).toEqual([60_000]);
  });

  it('lets reads start at once until the per-minute budget is used, then waits for the oldest to age out', async () => {
    const { clock, sleeps, advance } = fakeClock();
    const budget = createReadBudget(3, clock);

    await budget.acquire();
    advance(10_000);
    await budget.acquire();
    await budget.acquire();
    expect(sleeps).toEqual([]);

    await budget.acquire(); // 4th within the minute: waits until the first one is 60s old
    expect(sleeps).toEqual([50_000]);
  });

  it('starts fresh after reset', async () => {
    const { clock, sleeps } = fakeClock();
    const budget = createReadBudget(1, clock);
    await budget.acquire();
    budget.reset();
    await budget.acquire();
    expect(sleeps).toEqual([]);
  });

  it('gives up without taking a slot when the caller is gone after the wait', async () => {
    const { clock, sleeps } = fakeClock();
    const budget = createReadBudget(1, clock);
    await budget.acquire();

    let active = true;
    const waiting = budget.acquire(() => active);
    active = false; // page left while waiting for the budget
    await expect(waiting).resolves.toBe(false);
    expect(sleeps).toEqual([60_000]);

    // the abandoned wait used no slot: the next caller gets one at once
    await expect(budget.acquire()).resolves.toBe(true);
    expect(sleeps).toEqual([60_000]);
  });
});
