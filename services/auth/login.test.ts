import { auth } from "@/services/firebase";
import { logger } from "@/utils/logger";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { upsertUser } from "../user/upsert";
import { login } from "./login";

// Mock external dependencies
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
  },
}));

jest.mock("firebase/auth", () => ({
  GoogleAuthProvider: {
    credential: jest.fn((token) => `mock-credential-${token}`),
  },
  signInWithCredential: jest.fn(),
}));

jest.mock("@/services/firebase", () => ({
  auth: {
    currentUser: null,
  },
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock("../user/upsert", () => ({
  upsertUser: jest.fn(),
}));

describe("login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as any).currentUser = null;
  });

  it("authenticates with Firebase and upserts the user upon successful Google sign-in", async () => {
    const mockUser = { uid: "user-123", email: "user@example.com" };
    const mockToken = "mock-id-token";

    (GoogleSignin.hasPlayServices as jest.Mock).mockResolvedValue(true);
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
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("logs an error and stops if Play Services are unavailable", async () => {
    const playServicesError = new Error("Play services outdated");
    (GoogleSignin.hasPlayServices as jest.Mock).mockRejectedValue(
      playServicesError,
    );
    await expect(login()).rejects.toThrow("Google services are unavailable");

    expect(logger.error).toHaveBeenCalledWith(
      "Google services are unavailable",
      { err: playServicesError },
    );
    expect(GoogleSignin.signIn).not.toHaveBeenCalled();
  });

  it("logs an error when Google sign-in fails to return an idToken", async () => {
    (GoogleSignin.hasPlayServices as jest.Mock).mockResolvedValue(true);
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({ data: null });

    await expect(login()).rejects.toThrow("Google sign-in failed");

    expect(signInWithCredential).not.toHaveBeenCalled();
    expect(upsertUser).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "Google sign-in failed",
      expect.objectContaining({
        err: expect.objectContaining({
          message: "Google ID Token not found",
        }),
      }),
    );
  });

  it("logs an error when signInWithCredential throws", async () => {
    const authError = new Error("Firebase Auth Error");
    (GoogleSignin.hasPlayServices as jest.Mock).mockResolvedValue(true);
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({
      data: { idToken: "valid-token" },
    });
    (signInWithCredential as jest.Mock).mockRejectedValue(authError);

    await expect(login()).rejects.toThrow("Google sign-in failed");

    expect(upsertUser).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith("Google sign-in failed", {
      err: authError,
    });
  });
});
