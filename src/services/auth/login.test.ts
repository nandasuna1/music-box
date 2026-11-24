import { auth } from "@/services/providers/firebase/firebase";
import { logger } from "@/utils/logger";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { upsertUser } from "../user/upsert";
import { syncUserProfile } from "./syncUserProfile";
import { login } from "./login";

// Mock external dependencies
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    signIn: jest.fn(),
  },
}));

jest.mock("firebase/auth", () => ({
  GoogleAuthProvider: {
    credential: jest.fn((token) => `mock-credential-${token}`),
  },
  signInWithCredential: jest.fn(),
}));

jest.mock("@/services/providers/firebase/firebase", () => ({
  auth: {
    currentUser: null,
  },
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../user/upsert", () => ({
  upsertUser: jest.fn(),
}));

jest.mock("./syncUserProfile", () => ({
  syncUserProfile: jest.fn(),
}));

describe("login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as any).currentUser = null;
  });

  it("authenticates with Firebase and upserts the user upon successful Google sign-in", async () => {
    const mockUser = { uid: "user-123", email: "user@example.com" };
    const mockToken = "mock-id-token";

    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({
      data: { idToken: mockToken },
    });
    (signInWithCredential as jest.Mock).mockImplementation(async () => {
      (auth as any).currentUser = mockUser;
    });

    await login();

    expect(GoogleAuthProvider.credential).toHaveBeenCalledWith(mockToken);
    expect(signInWithCredential).toHaveBeenCalledWith(
      auth,
      `mock-credential-${mockToken}`,
    );
    expect(upsertUser).toHaveBeenCalledWith(mockUser);
    expect(syncUserProfile).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("rejects when Google sign-in does not return an ID token", async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({ data: null });

    await expect(login()).rejects.toThrow("Google ID Token not found");

    expect(signInWithCredential).not.toHaveBeenCalled();
    expect(upsertUser).not.toHaveBeenCalled();
    expect(syncUserProfile).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith("Login flow failed", {
      err: expect.any(Error),
    });
  });

  it("propagates Firebase credential errors", async () => {
    const authError = new Error("Firebase Auth Error");
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({
      data: { idToken: "valid-token" },
    });
    (signInWithCredential as jest.Mock).mockRejectedValue(authError);

    await expect(login()).rejects.toBe(authError);

    expect(upsertUser).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith("Login flow failed", {
      err: authError,
    });
  });

  it("shares an in-flight sign-in request between concurrent callers", async () => {
    let resolveSignIn!: (result: { data: { idToken: string } }) => void;
    (GoogleSignin.signIn as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }),
    );
    (signInWithCredential as jest.Mock).mockImplementation(async () => {
      (auth as any).currentUser = null;
    });

    const first = login();
    const second = login();
    expect(second).toBe(first);
    resolveSignIn({ data: { idToken: "token" } });
    await Promise.all([first, second]);

    expect(GoogleSignin.signIn).toHaveBeenCalledTimes(1);
  });
});
