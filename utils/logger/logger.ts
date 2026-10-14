/**
 * Logger abstraction.
 *
 * - Every method is a no-op in production (`__DEV__ === false`), so nothing
 *   is ever printed outside of development/dev-client builds.
 * - In development, values are recursively sanitized before being printed:
 *   any object key that looks sensitive (tokens, passwords, emails, uids,
 *   etc.) has its value replaced with `"[REDACTED]"`.
 *
 * `__DEV__` is a global provided by React Native/Expo (and by jest-expo in
 * tests), so no extra import is required.
 */

declare const __DEV__: boolean;
declare const __PROD__: boolean;

const SENSITIVE_KEY_PATTERN =
  /token|password|secret|email|uid|apikey|api_key|authorization|cookie/i;

const REDACTED = "[REDACTED]";

function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }
  seen.add(value);

  if (value instanceof Error) {
    const ownProps = redact(Object.assign({}, value), seen) as Record<
      string,
      unknown
    >;
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      ...ownProps,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      result[key] = REDACTED;
    } else {
      result[key] = redact(val, seen);
    }
  }
  return result;
}

function sanitizeArgs(args: unknown[]): unknown[] {
  return args.map((arg) => redact(arg));
}

function isDev(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__;
}

function isProd(): boolean {
  return typeof __PROD__ !== "undefined" && __PROD__;
}


export const logger = {
  log(message: string, ...meta: unknown[]): void {
    if (!isDev()) return;
    console.log(message, ...sanitizeArgs(meta));
  },
  debug(message: string, ...meta: unknown[]): void {
    if (!isDev()) return;
    console.debug(message, ...sanitizeArgs(meta));
  },
  info(message: string, ...meta: unknown[]): void {
    if (!isDev()) return;
    console.info(message, ...sanitizeArgs(meta));
  },
  warn(message: string, ...meta: unknown[]): void {
    if (!isDev()) return;
    console.warn(message, ...sanitizeArgs(meta));
  },
  error(message: string, ...meta: unknown[]): void {
    // if (isProd()) {
    //   try {
    //     const sentryMessage = "Error: " + message;
    //     Monitoring.captureException(new Error(sentryMessage), { meta: sanitizeArgs(meta) });
    //   } catch (e) {
    //     // ignore monitoring failures in constrained environments
    //   }
    // }
    if (!isDev()) return;
    console.error(message, ...sanitizeArgs(meta));
  },
};
