/**
 * The platform-admin role must be assignable, and stay assignable.
 *
 * The backend has accepted `platform_admin` on PATCH /admin/auth/{id}/role
 * since the role shipped. The frontend never offered it, so the role, its
 * eight permissions and every screen behind it were built and unreachable --
 * the only way to create one was editing the database by hand.
 *
 * These read the real source files rather than mounting components, because
 * the defect was a missing entry in a hardcoded list. A rendering test would
 * pass against a list that silently lost the role again; this cannot.
 */
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

const COMPONENTS = 'src/app/admin/dashboard/admin-management/_components';

describe('a super admin can assign the platform-admin role', () => {
  it('offers it in the role dialog dropdown', () => {
    const s = read(`${COMPONENTS}/RoleDialog.tsx`);
    expect(s).toContain('PLATFORM_ADMIN');
    // Present in BOTH the validation set and the visible options: listing it
    // in only one either hides a valid role or offers one the dialog rejects.
    const opts = s.match(/options=\{\[([^\]]*)\]\}/)?.[1] ?? '';
    expect(opts).toContain('PLATFORM_ADMIN');
    const valid = s.match(/VALID_ROLES = new Set\(\[([^\]]*)\]/s)?.[1] ?? '';
    expect(valid).toContain('PLATFORM_ADMIN');
  });

  it('keeps the dialog options and its validation set in step', () => {
    // A role offered but not validated cannot be submitted; a role validated
    // but not offered cannot be chosen. Either way the dropdown lies.
    const s = read(`${COMPONENTS}/RoleDialog.tsx`);
    const opts = (s.match(/options=\{\[([^\]]*)\]\}/)?.[1] ?? '')
      .split(',').map(x => x.trim().replace(/["']/g, ''))
      .filter(x => x && x !== 'Role');
    const valid = (s.match(/VALID_ROLES = new Set\(\[([^\]]*)\]/s)?.[1] ?? '')
      .split(',').map(x => x.trim().replace(/["']/g, '')).filter(Boolean);
    expect([...opts].sort()).toEqual([...valid].sort());
  });
});

describe('the role is visible everywhere an admin list is rendered', () => {
  it('can be filtered for', () => {
    const s = read(`${COMPONENTS}/SearchFilterControls.tsx`);
    expect(s).toContain('"Platform Admin": "platform_admin"');
    expect(s).toContain('Platform Admin');
  });

  it('has its own badge colour in the table', () => {
    // Without a case it falls through to the default grey and reads as an
    // unrecognised role in the one list where roles are compared.
    const s = read(`${COMPONENTS}/AdminTable.tsx`);
    expect(s).toMatch(/case 'PLATFORM_ADMIN':/);
  });

  it('has the same colour in the detail modal as in the table', () => {
    const table = read(`${COMPONENTS}/AdminTable.tsx`);
    const modal = read(`${COMPONENTS}/AdminDetailsModal.tsx`);
    expect(modal).toContain('platform_admin:');
    // Same hue in both, or the same admin looks like two different things
    // depending on which screen you opened.
    const hue = (s: string) => s.match(/platform_admin[^\n]*?(teal|blue|purple|green|orange|gray)/i)?.[1]
      ?? s.match(/case 'PLATFORM_ADMIN':[\s\S]{0,80}?(teal|blue|purple|green|orange|gray)/i)?.[1];
    expect(hue(modal)).toBeDefined();
    expect(hue(modal)).toEqual(hue(table));
  });

  it('is accepted by the admin-list query type', () => {
    const s = read('src/api/adminManagementApi.ts');
    expect(s).toMatch(/role\?:[^;]*PLATFORM_ADMIN/);
  });

  it('appears in the role-count breakdown', () => {
    const s = read('src/api/adminManagementApi.ts');
    expect(s).toContain('platform_admin?: number');
  });
});

describe('the role list matches the backend', () => {
  it('offers exactly the roles AdminRole defines', () => {
    // The backend enum is the contract. A role missing here is unreachable;
    // a role here that the backend rejects is a 422 the user cannot explain.
    const backendRoles = [
      'SUPER_ADMIN', 'ADMIN', 'PLATFORM_ADMIN', 'MODERATOR', 'SUPPORT',
    ];
    const s = read(`${COMPONENTS}/RoleDialog.tsx`);
    const valid = (s.match(/VALID_ROLES = new Set\(\[([^\]]*)\]/s)?.[1] ?? '')
      .split(',').map(x => x.trim().replace(/["']/g, '')).filter(Boolean);
    expect([...valid].sort()).toEqual([...backendRoles].sort());
  });
});
