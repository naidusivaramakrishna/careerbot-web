import type React from 'react';
import {
  Building2,
  CalendarRange,
  ClipboardPen,
  FileUp,
  GraduationCap,
  LayoutGrid,
  Layers,
  UserPlus,
  Users,
} from 'lucide-react';
import type { InstitutionRole } from '@/types/institution';
import { can, type InstitutionCapability } from '@/lib/institutionPermissions';

/**
 * Role-based navigation.
 *
 * Each role sees only what its role can DO — the nav is generated from the same
 * capability table the server enforces, so a faculty member is never shown a
 * "Departments" link that would 403, and a student is never shown a roster.
 *
 * The four roles get genuinely different shapes, because they are different
 * jobs: the CPO's rail is a control panel over the whole college, the HOD's is
 * the same shape at department scale, the faculty rail is two items (their
 * students, and the one thing they write), and a student has no rail at all —
 * one screen about one person.
 */
export interface InstitutionNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  /** Rendered only when the role holds this capability. */
  capability?: InstitutionCapability;
  /** Roles this item is limited to, when capability is not precise enough. */
  roles?: InstitutionRole[];
  /** Exact-match the pathname instead of prefix-matching. */
  exact?: boolean;
}

export interface InstitutionNavGroup {
  label: string;
  items: InstitutionNavItem[];
}

const NAV_GROUPS: InstitutionNavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        href: '/institution',
        icon: LayoutGrid,
        exact: true,
      },
    ],
  },
  {
    label: 'People',
    items: [
      {
        id: 'students',
        label: 'Students',
        href: '/institution/students',
        icon: GraduationCap,
        capability: 'read_students',
      },
      {
        id: 'progress',
        label: 'Record progress',
        href: '/institution/progress',
        icon: ClipboardPen,
        capability: 'write_progress',
      },
      {
        id: 'onboarding',
        label: 'Add people',
        href: '/institution/people',
        icon: UserPlus,
        capability: 'onboard_student',
      },
      {
        id: 'import',
        label: 'Import from a file',
        href: '/institution/students/import',
        icon: FileUp,
        capability: 'onboard_student',
      },
    ],
  },
  {
    label: 'College',
    items: [
      {
        id: 'departments',
        label: 'Departments',
        href: '/institution/departments',
        icon: Building2,
        capability: 'manage_org',
        roles: ['cpo'],
      },
      {
        id: 'batches',
        label: 'Batches',
        href: '/institution/batches',
        icon: CalendarRange,
        capability: 'manage_org',
        roles: ['cpo'],
      },
      {
        id: 'sections',
        label: 'Sections',
        href: '/institution/sections',
        icon: Layers,
        capability: 'manage_org',
      },
    ],
  },
  {
    label: 'Faculty',
    items: [
      {
        id: 'assignments',
        label: 'Faculty assignments',
        href: '/institution/assignments',
        icon: Users,
        capability: 'assign_faculty',
      },
    ],
  },
];

export function navGroupsForRole(role: InstitutionRole): InstitutionNavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.roles && !item.roles.includes(role)) return false;
      if (item.capability && !can(role, item.capability)) return false;
      return true;
    }),
  })).filter((group) => group.items.length > 0);
}

export function isNavItemActive(item: InstitutionNavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
