import { logger } from "@/utils/logger";

describe("logger", () => {
  const originalDev = (global as any).__DEV__;

  afterEach(() => {
    (global as any).__DEV__ = originalDev;
    jest.restoreAllMocks();
  });

  it("does not log anything when __DEV__ is false", () => {
    (global as any).__DEV__ = false;
    const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    logger.debug("debug message", { token: "abc" });
    logger.info("info message", { token: "abc" });
    logger.warn("warn message", { token: "abc" });
    logger.error("error message", { token: "abc" });

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logs when __DEV__ is true", () => {
    (global as any).__DEV__ = true;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    logger.error("something failed");

    expect(errorSpy).toHaveBeenCalledWith("something failed");
  });

  it("redacts known sensitive keys, including nested objects", () => {
    (global as any).__DEV__ = true;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    logger.error("login failed", {
      err: {
        idToken: "super-secret-token",
        user: {
          email: "user@example.com",
          uid: "user-123",
          name: "Jane Doe",
        },
      },
      accessToken: "another-secret",
      password: "hunter2",
    });

    expect(errorSpy).toHaveBeenCalledWith("login failed", {
      err: {
        idToken: "[REDACTED]",
        user: {
          email: "[REDACTED]",
          uid: "[REDACTED]",
          name: "Jane Doe",
        },
      },
      accessToken: "[REDACTED]",
      password: "[REDACTED]",
    });
  });

  it("passes through non-sensitive data unchanged", () => {
    (global as any).__DEV__ = true;
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

    logger.info("fetched album", { albumId: 42, title: "OK Computer" });

    expect(infoSpy).toHaveBeenCalledWith("fetched album", {
      albumId: 42,
      title: "OK Computer",
    });
  });

  it("handles Error instances without throwing and redacts custom sensitive props", () => {
    (global as any).__DEV__ = true;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const err = new Error("boom") as Error & { token?: string };
    err.token = "leaked-token";

    expect(() => logger.error("unexpected error", err)).not.toThrow();

    const [, loggedErr] = errorSpy.mock.calls[0];
    expect(loggedErr).toMatchObject({
      name: "Error",
      message: "boom",
      token: "[REDACTED]",
    });
  });

  it("handles circular references without throwing", () => {
    (global as any).__DEV__ = true;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const circular: Record<string, unknown> = { name: "circular" };
    circular.self = circular;

    expect(() => logger.error("circular payload", circular)).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
  });
});
