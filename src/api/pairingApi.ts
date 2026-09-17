/**
 * Pairing codes — the person's half.
 *
 * Appointing a placement officer needs an internal account id, and there is no
 * lookup by email anywhere. So instead of an operator hunting for an id, the
 * person proves which account is theirs: they generate a code while signed in
 * and read it to the admin on the call that is already happening.
 *
 * The code authorises nothing. It says "this is my account". The admin still
 * decides, and sees whose account before appointing.
 */
import { httpClient } from '@/lib/http';

export interface IssuedPairingCode {
  /** The ONLY copy. Not stored, and cannot be shown again -- generating
   *  another takes one click, so there is nothing to recover. */
  code: string;
  expires_at: string;
  expires_in_minutes: number;
}

export class PairingError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'PairingError';
    this.status = status;
  }
}

/** Generate a code for the signed-in account. Retires any earlier live one. */
export async function issuePairingCode(): Promise<IssuedPairingCode> {
  try {
    const { data } = await httpClient.post<IssuedPairingCode>(
      '/institution/pairing-code');
    return data;
  } catch (err) {
    const res = (err as { response?: { status?: number; data?: unknown } })?.response;
    const body = res?.data as { error?: { message?: string } } | undefined;
    throw new PairingError(
      res?.status ?? 0,
      body?.error?.message ?? 'Could not generate a code. Please try again.',
    );
  }
}
