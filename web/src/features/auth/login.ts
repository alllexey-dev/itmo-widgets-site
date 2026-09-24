import { api } from '../../api/client';

/** `CreatedChallenge`: the poll secret is returned only to the browser that asked. */
export interface LoginChallenge {
  id: string;
  code: string;
  pollSecret: string;
  expiresAt: string;
}

/** `WebLoginPollStatus`; `APPROVED` comes once, together with the session cookie. */
export type LoginStatus = 'PENDING' | 'APPROVED' | 'EXPIRED';

const CHALLENGES_PATH = '/api/web/auth/challenges';
const POLL_SECRET_HEADER = 'X-Poll-Secret';

/** 8 characters from the backend alphabet, without look-alikes such as 0/O and 1/I/L. */
const CODE_PATTERN = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;

export function createChallenge(): Promise<LoginChallenge> {
  return api.post<LoginChallenge>(CHALLENGES_PATH);
}

export async function pollChallenge(
  challenge: LoginChallenge,
  signal?: AbortSignal,
): Promise<LoginStatus> {
  const poll = await api.get<{ status: LoginStatus }>(`${CHALLENGES_PATH}/${challenge.id}`, {
    headers: { [POLL_SECRET_HEADER]: challenge.pollSecret },
    signal,
  });
  return poll.status;
}

/** A code from the `?code=` of a scanned QR, or null when it is not a login code. */
export function parseLoginCode(value: string | null): string | null {
  const code = value?.trim().toUpperCase() ?? '';
  return CODE_PATTERN.test(code) ? code : null;
}

/** `ABCDEFGH` → `ABCD EFGH`, easier to read aloud and to type. */
export function formatLoginCode(code: string): string {
  return code.match(/.{1,4}/g)?.join(' ') ?? code;
}

/** What the QR encodes: the app scans it, a phone camera opens this page with a hint. */
export function loginUrl(code: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}login?code=${encodeURIComponent(code)}`;
}
