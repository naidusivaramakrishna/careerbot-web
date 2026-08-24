'use client';

/**
 * Institution session context.
 *
 * Owns the three things every college screen needs:
 *   1. the user's memberships (`[]` = ordinary jobseeker, a normal answer),
 *   2. the active college + the token minted for it,
 *   3. whether the college is currently read-only.
 *
 * Follows the shape of `TenantContext` — provider + a `useX()` that throws
 * outside it.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createInstitutionSession,
  InstitutionApiError,
  listMemberships,
  onInstitutionReadOnly,
  onInstitutionSessionStale,
} from '@/api/institutionApi';
import {
  clearInstitutionSession,
  getInstitutionSession,
  setInstitutionSession,
  type StoredInstitutionSession,
} from '@/lib/institutionSession';
import { can, type InstitutionCapability } from '@/lib/institutionPermissions';
import type { InstitutionMembership, InstitutionRole } from '@/types/institution';

export type ReadOnlyReason = 'COLLEGE_PAUSED' | 'SUBSCRIPTION_EXPIRED';

interface InstitutionContextValue {
  /** All memberships for the signed-in account. `[]` means "not a college user". */
  memberships: InstitutionMembership[];
  /** True while memberships are being fetched for the first time. */
  isLoadingMemberships: boolean;
  /** Failure of the memberships call itself (not "no memberships"). */
  membershipsError: InstitutionApiError | null;

  /** The active college session, or null before one is picked. */
  session: StoredInstitutionSession | null;
  activeMembership: InstitutionMembership | null;
  /** True while a POST /session exchange is in flight. */
  isSwitching: boolean;
  switchError: InstitutionApiError | null;

  /** Non-null when the college is readable but not writable. */
  readOnlyReason: ReadOnlyReason | null;

  role: InstitutionRole | null;
  /** Role capability check, mirroring the server policy gate. */
  allows: (capability: InstitutionCapability) => boolean;
  /** Capability AND not read-only — the check a write control should use. */
  canWrite: (capability: InstitutionCapability) => boolean;

  selectMembership: (membershipId: string) => Promise<void>;
  leaveInstitution: () => void;
  refreshMemberships: () => Promise<void>;
}

const InstitutionContext = createContext<InstitutionContextValue | null>(null);

export function InstitutionProvider({ children }: { children: React.ReactNode }) {
  const [memberships, setMemberships] = useState<InstitutionMembership[]>([]);
  const [isLoadingMemberships, setIsLoadingMemberships] = useState(true);
  const [membershipsError, setMembershipsError] = useState<InstitutionApiError | null>(null);

  const [session, setSession] = useState<StoredInstitutionSession | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<InstitutionApiError | null>(null);
  const [readOnlyReason, setReadOnlyReason] = useState<ReadOnlyReason | null>(null);

  // Guards against a slow membership fetch resolving after unmount.
  const mountedRef = useRef(true);
  // One stale-session recovery per mount. Without this the clear/re-select
  // cycle repeats indefinitely and the page appears to refresh forever.
  const staleRecoveryAttempted = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Rehydrate the session this tab already had (survives a page reload).
  useEffect(() => {
    setSession(getInstitutionSession());
  }, []);

  const refreshMemberships = useCallback(async () => {
    setIsLoadingMemberships(true);
    setMembershipsError(null);
    try {
      const rows = await listMemberships();
      if (!mountedRef.current) return;
      setMemberships(rows);
    } catch (err) {
      if (!mountedRef.current) return;
      setMemberships([]);
      setMembershipsError(
        err instanceof InstitutionApiError
          ? err
          : new InstitutionApiError({ reason: 'UNKNOWN' }),
      );
    } finally {
      if (mountedRef.current) setIsLoadingMemberships(false);
    }
  }, []);

  useEffect(() => {
    void refreshMemberships();
  }, [refreshMemberships]);

  // A paused college is only discoverable from a refused write, so latch the
  // state the first time any call reports it and keep the whole area read-only
  // for the rest of the session rather than re-discovering it per screen.
  useEffect(() => onInstitutionReadOnly((reason) => setReadOnlyReason(reason)), []);

  // A stored college token the server will no longer accept must not be kept.
  // Holding it leaves the gate believing a college is selected, so it skips
  // auto-select and every scoped call is refused -- a college name in the
  // sidebar, zeroes in every panel, and no way out from inside the UI.
  //
  // RECOVERY IS ATTEMPTED EXACTLY ONCE. The obvious version of this loops
  // forever: clear the session, the gate re-selects, the same call fails, the
  // handler clears again. If one clean re-selection does not fix it the cause
  // is not a stale token, and retrying cannot help -- so it stops and lets the
  // error surface rather than spinning the page.
  useEffect(
    () =>
      onInstitutionSessionStale(() => {
        if (staleRecoveryAttempted.current) return;
        staleRecoveryAttempted.current = true;
        clearInstitutionSession();
        if (!mountedRef.current) return;
        setSession(null);
        setReadOnlyReason(null);
        void refreshMemberships();
      }),
    [refreshMemberships],
  );

  const selectMembership = useCallback(
    async (membershipId: string) => {
      setIsSwitching(true);
      setSwitchError(null);
      try {
        const minted = await createInstitutionSession({ membership_id: membershipId });
        const stored: StoredInstitutionSession = { ...minted, membership_id: membershipId };
        setInstitutionSession(stored);
        if (!mountedRef.current) return;
        setSession(stored);
        // Read-only is a property of the college, so clear it when switching.
        setReadOnlyReason(null);
        // A deliberate switch is a fresh start: allow one recovery again.
        staleRecoveryAttempted.current = false;
      } catch (err) {
        if (!mountedRef.current) return;
        setSwitchError(
          err instanceof InstitutionApiError
            ? err
            : new InstitutionApiError({ reason: 'UNKNOWN' }),
        );
        throw err;
      } finally {
        if (mountedRef.current) setIsSwitching(false);
      }
    },
    [],
  );

  const leaveInstitution = useCallback(() => {
    clearInstitutionSession();
    setSession(null);
    setReadOnlyReason(null);
    setSwitchError(null);
  }, []);

  const activeMembership = useMemo(
    () => memberships.find((m) => m.membership_id === session?.membership_id) ?? null,
    [memberships, session],
  );

  // Prefer the role in the minted token over the one in the membership list:
  // the token is what the server will actually enforce.
  const role = session?.role ?? activeMembership?.role ?? null;

  const allows = useCallback(
    (capability: InstitutionCapability) => (role ? can(role, capability) : false),
    [role],
  );

  const canWrite = useCallback(
    (capability: InstitutionCapability) => allows(capability) && readOnlyReason === null,
    [allows, readOnlyReason],
  );

  const value = useMemo<InstitutionContextValue>(
    () => ({
      memberships,
      isLoadingMemberships,
      membershipsError,
      session,
      activeMembership,
      isSwitching,
      switchError,
      readOnlyReason,
      role,
      allows,
      canWrite,
      selectMembership,
      leaveInstitution,
      refreshMemberships,
    }),
    [
      memberships,
      isLoadingMemberships,
      membershipsError,
      session,
      activeMembership,
      isSwitching,
      switchError,
      readOnlyReason,
      role,
      allows,
      canWrite,
      selectMembership,
      leaveInstitution,
      refreshMemberships,
    ],
  );

  return <InstitutionContext.Provider value={value}>{children}</InstitutionContext.Provider>;
}

export function useInstitution(): InstitutionContextValue {
  const ctx = useContext(InstitutionContext);
  if (!ctx) throw new Error('useInstitution must be used inside InstitutionProvider');
  return ctx;
}
