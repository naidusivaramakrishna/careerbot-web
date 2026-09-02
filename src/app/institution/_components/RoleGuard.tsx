'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useInstitution } from '@/contexts/InstitutionContext';
import type { InstitutionCapability } from '@/lib/institutionPermissions';
import { EmptyState } from './EmptyState';

/**
 * Blocks a page the current role cannot use.
 *
 * The nav never links to these, so reaching one means a typed URL, a stale
 * bookmark, or a switch to a college where the person has a narrower role —
 * that last one is common and is not a mistake worth scolding. So the screen
 * explains the scope rather than accusing, and offers the way back.
 *
 * This is a UX courtesy, not a security boundary: the server enforces the same
 * rule and 403s regardless of what renders here.
 */
export function RoleGuard({
  capability,
  children,
}: {
  capability: InstitutionCapability;
  children: React.ReactNode;
}) {
  const { allows, role } = useInstitution();

  if (role && !allows(capability)) {
    return (
      <EmptyState
        icon={Lock}
        title="Not part of your role here"
        body="Your role in this college does not cover this screen. If you also belong to another college, switching may give you access there."
        action={
          <Link href="/institution">
            <Button variant="outline" size="sm">
              Back to overview
            </Button>
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
