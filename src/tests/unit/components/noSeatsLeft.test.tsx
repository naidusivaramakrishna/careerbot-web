/**
 * A college on seats refuses a new student with 403 NO_SEATS_LEFT (careerbot-api
 * S3-B). Before this, the web had no such reason: a 403 fell back to FORBIDDEN
 * and told a placement officer "You do not have access to this" in their own
 * college. It must say what happened, which case it is, and who to ask.
 */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/http', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/lib/institutionSession', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/institutionSession')>();
  return { ...actual, institutionAuthHeader: () => 'Bearer college-token' };
});

import {
  createStudent,
  InstitutionApiError,
  onInstitutionReadOnly,
  onInstitutionSessionStale,
} from '@/api/institutionApi';
import { displayMessage, ErrorNotice, FormError } from '@/app/institution/_components/ErrorNotice';
import { httpClient as mockHttp } from '@/lib/http';
import { ERROR_MESSAGES, NO_SEATS_HINT } from '@/lib/institutionMessages';

const COLLEGE_AUTH = 'Bearer college-token';
const FULL = 'every seat this college bought is in use; buy more seats before adding another student';
// The four sentences careerbot-api _take_seat sends with NO_SEATS_LEFT.
const SEAT_SENTENCES = [
  FULL,
  "this college's seat year has ended; seats must be renewed before students can be added",
  'this college is being moved onto seats; try again in a few minutes',
  "this college's seat year is not set up; contact CareerBOT",
];

function noSeats(message?: string) {
  return {
    isAxiosError: true,
    config: { headers: { Authorization: COLLEGE_AUTH } },
    response: {
      status: 403,
      data: { error: { message, details: { reason: 'NO_SEATS_LEFT' } } },
    },
    message: 'Request failed with status code 403',
  };
}

async function refused(message?: string): Promise<InstitutionApiError> {
  vi.mocked(mockHttp.post).mockRejectedValueOnce(noSeats(message));
  return (await createStudent({ department_id: 'cse', full_name: 'A', admission_number: '1' } as never)
    .then(() => null, (e: unknown) => e)) as InstitutionApiError;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NO_SEATS_LEFT', () => {
  it('is its own reason, not FORBIDDEN', async () => {
    const err = await refused(FULL);
    expect(err.reason).toBe('NO_SEATS_LEFT');
    expect(err.isReadOnlyState).toBe(false);
  });

  it("shows the server's sentence, which names the case, in sentence case", async () => {
    const err = await refused("this college's seat year has ended; seats must be renewed before students can be added");
    expect(displayMessage(err)).toBe(
      "This college's seat year has ended; seats must be renewed before students can be added.",
    );
  });

  it.each(SEAT_SENTENCES)('renders %s as a capitalised sentence with the hint', async (sentence) => {
    const err = await refused(sentence);
    render(<FormError error={err} />);
    const shown = sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
    expect(screen.getByText(shown, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(NO_SEATS_HINT)).toBeInTheDocument();
  });

  it('does not flip the college read-only or drop the college session', async () => {
    const readOnly = vi.fn();
    const stale = vi.fn();
    const offReadOnly = onInstitutionReadOnly(readOnly);
    const offStale = onInstitutionSessionStale(stale);
    try {
      for (const sentence of SEAT_SENTENCES) await refused(sentence);
    } finally {
      offReadOnly();
      offStale();
    }
    expect(readOnly).not.toHaveBeenCalled();
    expect(stale).not.toHaveBeenCalled();
  });

  it('falls back to curated copy when the server sends no sentence', async () => {
    const err = await refused(undefined);
    expect(displayMessage(err)).toBe(ERROR_MESSAGES.NO_SEATS_LEFT);
    expect(ERROR_MESSAGES.NO_SEATS_LEFT).not.toBe(ERROR_MESSAGES.FORBIDDEN);
    // The fallback must not claim one particular seat case.
    expect(ERROR_MESSAGES.NO_SEATS_LEFT).not.toMatch(/in use|ended|renew/i);
  });

  it('tells the officer who to ask, as a warning not a red error', async () => {
    const err = await refused(FULL);
    const { container } = render(<ErrorNotice error={err} />);
    expect(screen.getByText(NO_SEATS_HINT)).toBeInTheDocument();
    expect(container.innerHTML).toMatch(/bg-amber-50/);
    expect(container.innerHTML).not.toMatch(/bg-red-50/);
  });

  it('the form-level notice carries the hint too', async () => {
    const err = await refused(FULL);
    render(<FormError error={err} />);
    expect(screen.getByText(/Every seat this college bought is in use/)).toBeInTheDocument();
    expect(screen.getByText(NO_SEATS_HINT)).toBeInTheDocument();
  });

  it('other refusals do not get the seat hint', () => {
    const err = new InstitutionApiError({ reason: 'FORBIDDEN', status: 403 });
    const { container } = render(<ErrorNotice error={err} />);
    expect(screen.queryByText(NO_SEATS_HINT)).toBeNull();
    expect(container.innerHTML).toMatch(/bg-red-50/);     // control: refusals stay red
  });
});
