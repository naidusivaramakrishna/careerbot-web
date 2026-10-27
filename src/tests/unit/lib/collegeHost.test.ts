import { describe, it, expect, vi } from 'vitest';
import { collegeFromHost, institutionBaseDomain } from '@/lib/collegeHost';

const BASE = 'intelicoreai.com';

describe('collegeFromHost', () => {
  it.each([
    ['vit.intelicoreai.com', 'vit'],
    ['VIT.INTELICOREAI.COM', 'vit'],
    ['vit.intelicoreai.com:3000', 'vit'],
    ['srm-chennai.intelicoreai.com', 'srm-chennai'],
  ])('%s is the college %s', (host, expected) => {
    expect(collegeFromHost(host, BASE)).toBe(expected);
  });

  it.each([
    null,
    '',
    'intelicoreai.com',
    'www.intelicoreai.com',
    'app.intelicoreai.com',
    'cpanel.intelicoreai.com',
    'mail.intelicoreai.com',
    'nightly.intelicoreai.com',
    'a.b.intelicoreai.com',
    '-vit.intelicoreai.com',
    'vit-.intelicoreai.com',
    'vit_x.intelicoreai.com',
    'vit.evil.com',
    'intelicoreai.com.evil.com',
    'vit.intelicoreai.com, evil.com',
    '[::1]',
  ])('%s is not a college', (host) => {
    expect(collegeFromHost(host, BASE)).toBeNull();
  });

  it('accepts a fully-qualified host with a trailing dot', () => {
    expect(collegeFromHost('vit.intelicoreai.com.', BASE)).toBe('vit');
    expect(collegeFromHost('vit.intelicoreai.com..', BASE)).toBe('vit');
  });

  it('names no college when no base domain is configured', () => {
    expect(collegeFromHost('vit.intelicoreai.com', null)).toBeNull();
  });
});

describe('institutionBaseDomain', () => {
  it('treats a cookie-style leading dot as the same domain', () => {
    vi.stubEnv('INSTITUTION_BASE_DOMAIN', '.IntelicoreAI.com ');
    expect(institutionBaseDomain()).toBe('intelicoreai.com');
    vi.unstubAllEnvs();
  });

  it('is null when unset', () => {
    vi.stubEnv('INSTITUTION_BASE_DOMAIN', '');
    expect(institutionBaseDomain()).toBeNull();
    vi.unstubAllEnvs();
  });
});
