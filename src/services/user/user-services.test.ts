jest.mock("@/services/providers/firebase/firebase", () => ({
  auth: { currentUser: { uid: "firebase-user" } },
  db: {},
}));
jest.mock("@/features/user/user.repository", () => ({
  UserRepository: jest.fn(),
}));
jest.mock("@/features/listen-later/services/getListenLaterByUserId", () => ({
  getListenLaterByUserId: jest.fn(),
}));
jest.mock("firebase/firestore", () => ({
  doc: jest.fn((...args) => args),
  getDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "server-time"),
  setDoc: jest.fn(),
}));

import { UserRepository } from "@/features/user/user.repository";
import { getListenLaterByUserId } from "@/features/listen-later/services/getListenLaterByUserId";
import { auth, db } from "@/services/providers/firebase/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getUserById } from "./getUserById";
import { getUserProfileById } from "./getUserProfileById";
import { upsertUser } from "./upsert";

describe("user services", () => {
  beforeEach(() => jest.clearAllMocks());

  it("gets the current user's profile by default", async () => {
    const profile = { id: "firebase-user", name: "Listener", avatar_url: null };
    (UserRepository as jest.Mock).mockImplementation(() => ({
      getUserById: jest.fn().mockResolvedValue(profile),
    }));

    await expect(getUserById()).resolves.toBe(profile);
    expect(UserRepository).toHaveBeenCalled();
  });

  it("returns null when the user profile does not exist", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      getUserById: jest.fn().mockResolvedValue(null),
    }));

    await expect(getUserById("other-user")).resolves.toBeNull();
  });

  it("assembles a profile with Listen Later entries and count", async () => {
    const profile = { id: "firebase-user", name: "Listener", avatar_url: null };
    const savedAlbums = [{ albumId: "42", title: "Test", artist: "Artist", cover: "cover" }];
    (UserRepository as jest.Mock).mockImplementation(() => ({
      getUserById: jest.fn().mockResolvedValue(profile),
    }));
    (getListenLaterByUserId as jest.Mock).mockResolvedValue(savedAlbums);

    await expect(getUserProfileById()).resolves.toEqual({
      ...profile,
      listenLater: savedAlbums,
      listenLaterCount: 1,
    });
    expect(getListenLaterByUserId).toHaveBeenCalledWith("firebase-user");
  });

  it("does not create an existing Firebase user document", async () => {
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => true });
    const user = {
      uid: "firebase-user",
      displayName: "Listener",
      email: "listener@example.com",
      photoURL: "avatar",
    } as any;

    await upsertUser(user);

    expect(doc).toHaveBeenCalledWith(db, "users", "firebase-user");
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("creates a missing Firebase user document", async () => {
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
    const user = {
      uid: "firebase-user",
      displayName: "Listener",
      email: "listener@example.com",
      photoURL: "avatar",
    } as any;

    await upsertUser(user);

    expect(setDoc).toHaveBeenCalledWith(
      [db, "users", "firebase-user"],
      expect.objectContaining({
        uid: "firebase-user",
        name: "Listener",
        email: "listener@example.com",
        photoURL: "avatar",
        provider: "google",
        createdAt: "server-time",
      }),
    );
    expect(serverTimestamp).toHaveBeenCalled();
  });
});
