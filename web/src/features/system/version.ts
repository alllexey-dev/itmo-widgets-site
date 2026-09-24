/** The backend's rule (`AdminSystemService`): up to four dotted numbers and an optional `-suffix`. */
const VERSION = /^[0-9]+(\.[0-9]+){0,3}(-[0-9A-Za-z.]{1,20})?$/;

export const NOTE_LIMIT = 500;

export function isVersion(value: string): boolean {
  return VERSION.test(value.trim());
}

/** Compares the numeric parts; a suffix like `-beta` does not count, as on the backend. */
export function compareVersions(first: string, second: string): number {
  const parts = (version: string) =>
    version
      .trim()
      .split('-')[0]
      ?.split('.')
      .map((part) => Number(part) || 0) ?? [];
  const a = parts(first);
  const b = parts(second);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const diff = (a[index] ?? 0) - (b[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
