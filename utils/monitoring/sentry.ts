// Lightweight wrapper around @sentry/react-native that uses runtime require
// so tests and environments without native Sentry don't fail on import.

type SentryType = typeof import("@sentry/react-native");
let Sentry: SentryType | null = null;
let initialized = false;

function ensureSentry(): SentryType | null {
  if (Sentry) return Sentry;
  try {
     
    Sentry = require("@sentry/react-native");
    return Sentry as SentryType;
  } catch (e) {
    Sentry = null;
    return null;
  }
}

export function initSentry(options?: Record<string, unknown>): void {
  if (initialized) return;
  const s = ensureSentry();
  if (!s) return;
  try {
    // @ts-ignore - Sentry types may expect specific config shapes
    s.init(options || {});
    initialized = true;
  } catch (e) {
    // ignore init errors in non-native environments
  }
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  const s = ensureSentry();
  if (!s) return;
  try {
    if (context) s.setContext("extra", context);
     
    s.captureException(err as Error);
  } catch (e) {
    // swallow
  }
}

export function captureMessage(message: string, context?: Record<string, unknown>): void {
  const s = ensureSentry();
  if (!s) return;
  try {
    if (context) s.setContext("extra", context);
     
    s.captureMessage(message);
  } catch (e) {
    // swallow
  }
}

export function setUser(user: Record<string, unknown> | null): void {
  const s = ensureSentry();
  if (!s) return;
  try {
     
    s.setUser(user as any);
  } catch (e) {
    // swallow
  }
}

export function setContext(key: string, value: Record<string, unknown>): void {
  const s = ensureSentry();
  if (!s) return;
  try {
    s.setContext(key, value);
  } catch (e) {
    // swallow
  }
}
