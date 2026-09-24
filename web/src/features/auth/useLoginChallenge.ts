import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../api/client';
import { createChallenge, pollChallenge, type LoginChallenge, type LoginStatus } from './login';
import { usePageVisible } from './usePageVisible';

const POLL_INTERVAL_MS = 2_000;
const CLOCK_TICK_MS = 1_000;
/** The backend code lifetime, used when the browser clock disagrees with the server's. */
const DEFAULT_LIFETIME_MS = 2 * 60_000;
const MAX_LIFETIME_MS = 10 * 60_000;
/**
 * Codes replaced without a click; then the page waits for the user. Five renewals are
 * about 12 minutes, below the backend limit of 10 codes per address in 10 minutes.
 */
const MAX_AUTO_RENEWALS = 5;

export interface ActiveChallenge extends LoginChallenge {
  /** Local time when the code stops working. */
  deadline: number;
  lifetime: number;
}

export type LoginState =
  | { kind: 'loading' }
  | { kind: 'failed'; error: Error }
  | { kind: 'expired' }
  | {
      kind: 'active';
      challenge: ActiveChallenge;
      /** Milliseconds until the code expires. */
      remaining: number;
      status: LoginStatus;
      /** The last poll did not reach the server; polling goes on. */
      offline: boolean;
    };

function activate(challenge: LoginChallenge): ActiveChallenge {
  const receivedAt = Date.now();
  const serverLifetime = Date.parse(challenge.expiresAt) - receivedAt;
  const lifetime =
    serverLifetime > 0 && serverLifetime <= MAX_LIFETIME_MS ? serverLifetime : DEFAULT_LIFETIME_MS;
  return { ...challenge, lifetime, deadline: receivedAt + lifetime };
}

function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, CLOCK_TICK_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return now;
}

/** An unknown id or a wrong poll secret: the code is gone for this browser. */
function isGone(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/**
 * Phone login for this browser: creates a code on mount, polls it every 2 s while the
 * tab is visible, replaces an expired code and calls [onApproved] once the app confirms.
 */
export function useLoginChallenge(onApproved: () => void): {
  state: LoginState;
  renew: () => void;
} {
  const visible = usePageVisible();
  const now = useNow();
  const [challenge, setChallenge] = useState<ActiveChallenge | null>(null);
  const [autoRenewals, setAutoRenewals] = useState(0);
  const {
    mutate: requestChallenge,
    isPending: creating,
    error: createError,
  } = useMutation({
    mutationFn: createChallenge,
    onSuccess: (created) => setChallenge(activate(created)),
  });

  const timeUp = challenge !== null && now >= challenge.deadline;
  const poll = useQuery({
    queryKey: ['login-challenge', challenge?.id],
    queryFn: ({ signal }) => {
      if (!challenge) throw new Error('No login code to check');
      return pollChallenge(challenge, signal);
    },
    enabled: challenge !== null && visible && !timeUp,
    refetchInterval: ({ state }) =>
      state.data === 'APPROVED' || state.data === 'EXPIRED' || isGone(state.error)
        ? false
        : POLL_INTERVAL_MS,
    // Visibility is handled by `enabled`, which also polls right away on return.
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  const status = poll.data ?? 'PENDING';
  const stale = challenge !== null && (timeUp || status === 'EXPIRED' || isGone(poll.error));

  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    requestChallenge();
  }, [requestChallenge]);

  const renewedForRef = useRef<string | null>(null);
  const capped = autoRenewals >= MAX_AUTO_RENEWALS;
  useEffect(() => {
    if (!challenge || !stale || !visible || capped || creating || createError) return;
    if (renewedForRef.current === challenge.id) return;
    renewedForRef.current = challenge.id;
    requestChallenge(undefined, { onSuccess: () => setAutoRenewals((count) => count + 1) });
  }, [challenge, stale, visible, capped, creating, createError, requestChallenge]);

  const approved = status === 'APPROVED';
  useEffect(() => {
    if (approved) onApproved();
  }, [approved, onApproved]);

  const renew = useCallback(() => {
    setAutoRenewals(0);
    requestChallenge();
  }, [requestChallenge]);

  let state: LoginState;
  if (challenge && !stale) {
    state = {
      kind: 'active',
      challenge,
      remaining: Math.min(Math.max(challenge.deadline - now, 0), challenge.lifetime),
      status,
      offline: poll.error instanceof ApiError && poll.error.isNetwork,
    };
  } else if (creating) {
    state = { kind: 'loading' };
  } else if (createError) {
    state = { kind: 'failed', error: createError };
  } else if (challenge && capped) {
    state = { kind: 'expired' };
  } else {
    state = { kind: 'loading' };
  }
  return { state, renew };
}
