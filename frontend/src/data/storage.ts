/** Read a value from localStorage, returning `fallback` on missing key or parse error. */
export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Persist a value to localStorage as JSON. */
export function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Tiny v4-style UUID — no external deps. */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Current time as ISO-8601 string. */
export function nowISO(): string {
  return new Date().toISOString();
}
