// jest.setup.ts
import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
/**
 * AsyncStorage mock
 */
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: mockAsyncStorage,
}));

/**
 * NativeEventEmitter mock (evita erro comum do RN)
 */
jest.mock("react-native/Libraries/EventEmitter/NativeEventEmitter");

/**
 * Firebase mock (evita inicialização real)
 */
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  initializeAuth: jest.fn(),
  getReactNativePersistence: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
}));

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() =>
      Promise.resolve({
        idToken: "mock-id-token",
        user: {
          email: "test@test.com",
          name: "Test User",
        },
      }),
    ),
    signOut: jest.fn(() => Promise.resolve()),
  },
}));

afterEach(() => {
  jest.clearAllTimers();
});
