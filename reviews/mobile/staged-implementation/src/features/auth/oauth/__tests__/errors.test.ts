// Verifies summarizeOAuthError is PII-safe.
// Per Codex recommendation in commit-846a5b4 verdict — this is the regression
// test the OAuth PII-logging fix needs.

import { AxiosError } from 'axios';

import { summarizeOAuthError } from '../errors';

describe('summarizeOAuthError', () => {
  it('extracts status + message from an AxiosError', () => {
    const error = new Error('Network Error') as AxiosError;
    (error as unknown as { response: { status: number } }).response = { status: 502 };

    const result = summarizeOAuthError(error);

    expect(result).toEqual({ status: 502, message: 'Network Error' });
  });

  it('returns generic message when error is not an Error', () => {
    expect(summarizeOAuthError('something')).toEqual({
      status: undefined,
      message: 'OAuth sign-in failed',
    });
    expect(summarizeOAuthError(null)).toEqual({
      status: undefined,
      message: 'OAuth sign-in failed',
    });
    expect(summarizeOAuthError(42)).toEqual({
      status: undefined,
      message: 'OAuth sign-in failed',
    });
  });

  it('does NOT leak request body fields (Apple identityToken etc.)', () => {
    // Simulate an AxiosError on the Apple callback POST that includes a full
    // request body. The serialized error should NOT include these in summary.
    const error = new Error('Request failed with status code 400') as AxiosError;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).response = { status: 400 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).config = {
      data: JSON.stringify({
        identityToken: 'eyJSECRET-APPLE-JWT.body.sig',
        authorizationCode: 'c.SECRET-CODE',
        rawNonce: 'SECRET-NONCE',
        state: 'SECRET-STATE',
        fullName: { givenName: 'PII-NAME', familyName: 'PII-FAMILY' },
      }),
      headers: { 'X-Tenant-Id': 'public', Authorization: 'Bearer SECRET-TOKEN' },
    };

    const result = summarizeOAuthError(error);

    expect(result).toEqual({
      status: 400,
      message: 'Request failed with status code 400',
    });
    // The serialized summary MUST NOT contain any of the PII fields.
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('identityToken');
    expect(serialized).not.toContain('SECRET');
    expect(serialized).not.toContain('PII-NAME');
    expect(serialized).not.toContain('Bearer');
    expect(serialized).not.toContain('rawNonce');
    expect(serialized).not.toContain('authorizationCode');
  });

  it('handles error with response but no status', () => {
    const error = new Error('weird shape') as AxiosError;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).response = {}; // no status field

    const result = summarizeOAuthError(error);

    expect(result).toEqual({ status: undefined, message: 'weird shape' });
  });
});
