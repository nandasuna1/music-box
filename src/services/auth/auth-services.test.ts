jest.mock("@/services/providers/firebase/firebase", () => ({
  auth: { currentUser: null },
}));
jest.mock("@/utils/logger", () => ({
  logger: { error: jest.fn() },
}));
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: { signOut: jest.fn() },
}));
jest.mock("firebase/auth", () => ({
  signOut: jest.fn(),
  getAuth: jest.fn(),
}));
jest.mock("@/lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

import { auth } from "@/services/providers/firebase/firebase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { getAuth, signOut } from "firebase/auth";
import { supabase } from "@/lib/supabase";
import { handleLogout } from "./logout";
import { syncUserProfile } from "./syncUserProfile";

describe("auth services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs out of Firebase before Google Sign-In", async () => {
    const calls: string[] = [];
    (signOut as jest.Mock).mockImplementation(async () => calls.push("firebase"));
    (GoogleSignin.signOut as jest.Mock).mockImplementation(async () => calls.push("google"));

    await handleLogout();

    expect(signOut).toHaveBeenCalledWith(auth);
    expect(calls).toEqual(["firebase", "google"]);
  });

  it("propagates Firebase logout errors and does not report successful Google logout", async () => {
    const failure = new Error("Firebase sign out failed");
    (signOut as jest.Mock).mockRejectedValue(failure);

    await expect(handleLogout()).rejects.toBe(failure);
    expect(GoogleSignin.signOut).not.toHaveBeenCalled();
  });

  it("syncs the current Firebase user's profile to Supabase", async () => {
    (getAuth as jest.Mock).mockReturnValue({
      currentUser: {
        uid: "firebase-user",
        displayName: "Listener",
        photoURL: "avatar-url",
      },
    });
    const query = {
      upsert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [{ firebase_uid: "firebase-user" }], error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(query);

    await syncUserProfile();

    expect(supabase.from).toHaveBeenCalledWith("profile");
    expect(query.upsert).toHaveBeenCalledWith({
      firebase_uid: "firebase-user",
      display_name: "Listener",
      avatar_url: "avatar-url",
    });
  });

  it("rejects profile sync without an authenticated Firebase user", async () => {
    (getAuth as jest.Mock).mockReturnValue({ currentUser: null });

    await expect(syncUserProfile()).rejects.toThrow("User is not authenticated");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("propagates profile persistence errors", async () => {
    (getAuth as jest.Mock).mockReturnValue({
      currentUser: { uid: "firebase-user", displayName: null, photoURL: null },
    });
    const failure = { message: "write failed" };
    const query = {
      upsert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: null, error: failure }),
    };
    (supabase.from as jest.Mock).mockReturnValue(query);

    await expect(syncUserProfile()).rejects.toBe(failure);
  });
});
