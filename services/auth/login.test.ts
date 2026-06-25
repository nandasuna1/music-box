import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { login } from "./login";

jest.mock("@react-native-google-signin/google-signin");
jest.mock("../firebase.ts", () => {
  auth: {
    currentUser: {
      uuid: "abc-123";
    }
    initializeAuth: jest.fn();
  }
});
jest.mock("firebase/auth", () => {
  GoogleAuthProvider: {
    credential: "credentials";
  }
  signInWithCredential: jest.fn().mockResolvedValue({} as object);
});

describe("login", () => {
  it("should login if user has an acc", async () => {
    GoogleSignin.hasPlayServices = jest.fn().mockResolvedValue(true);

    GoogleSignin.signIn = jest.fn().mockResolvedValue({
      data: { idToken: "mock-token" },
    });

    // GoogleAuthProvider.credential = jest.fn().mockReturnValue("credentials");

    // (signInWithCredential as jest.Mock).mockResolvedValue({});

    await login();

    expect(GoogleSignin.signIn()).toHaveBeenCalled();
  });
});
