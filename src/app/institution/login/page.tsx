'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { getCollegeBranding, type CollegeBranding } from '@/api/institutionPublicApi';
import { Body, Caption, PageTitle } from '../_components/Typography';
import { CARD } from '../_components/tokens';

/**
 * The front door at {college}.careerbot.com.
 *
 * A student who types their college's address and lands on the consumer
 * product's marketing page has no way to tell they are in the right place.
 * This page says the college's name back to them and sends them to sign in.
 *
 * THE BRANDING IS DISPLAY ONLY, and the page must not imply otherwise. The
 * subdomain is a string in a header anybody can type; what a person may READ
 * comes from their signed membership, resolved on every request. So this page
 * shows a name and nothing else -- no counts, no status, nothing that would be
 * a leak if somebody typed a college's address without belonging to it. The
 * server's projection is the id and the name for exactly the same reason.
 *
 * THERE IS NO "CREATE ACCOUNT" PATH, deliberately. A college's students are
 * on its roster before they ever sign in; self-registration would let anybody
 * who guessed the address create an account that looks like it belongs to the
 * college. Somebody without an invitation is told to ask their placement
 * officer, which is the true answer and also the only useful one.
 */
export default function CollegeLoginPage() {
  const [college, setCollege] = useState<CollegeBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    getCollegeBranding()
      .then((c) => { if (live) setCollege(c); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const signInHref = '/?showLogin=true&next=%2Finstitution';

  return (
    <main className="min-h-screen bg-[#eef2fb] px-4 py-16">
      <div className="mx-auto w-full max-w-md">
        <div className={`${CARD} p-8`}>
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center
                             rounded-xl bg-[#eef4ff] text-[#2557a7]">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              {loading ? (
                // A skeleton, not a flash of the wrong name. Rendering the
                // generic product first and swapping to the college a moment
                // later is the exact uncertainty this page exists to remove.
                <span className="block h-5 w-40 animate-pulse rounded bg-[#e2e8f0]" />
              ) : (
                <PageTitle>{college ? college.name : 'CareerBOT'}</PageTitle>
              )}
              <Caption>
                {college ? 'Placement portal' : 'Sign in to continue'}
              </Caption>
            </div>
          </div>

          <Body>
            {college
              ? `Sign in with the account you use for ${college.name}.`
              : 'Sign in to your account.'}
          </Body>

          <div className="mt-6 flex flex-col gap-3">
            <Link href={signInHref}>
              <Button className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
              </Button>
            </Link>

            {/* THE OTHER DOOR, and it is not "create an account". A student
                with a code from their college turns it into an account link;
                a student without one is not somebody the platform can help,
                and saying so plainly beats a signup form that produces an
                account their college will never see. */}
            <Link href="/institution/join"
                  className="text-center text-sm font-medium text-[#2557a7]
                             hover:underline">
              I have an invite code
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#64748b]">
          {college
            ? 'Not signed up yet? Your placement officer can send you an invite.'
            : 'Your college will invite you when your account is ready.'}
        </p>
      </div>
    </main>
  );
}
