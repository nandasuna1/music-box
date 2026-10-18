import Profile from "@/app/(protected)/(tabs)/profile";
import { getUserRecentReviews } from "@/services/reviews/getUserRecentReviews";
import { getUserSaveForLater } from "@/services/saveForLater/getUserSaveForLater";
import { getUserProfile } from "@/services/user/getUserProfile";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "user-123" } }),
}));
jest.mock("@/services/reviews/getUserRecentReviews", () => ({
  getUserRecentReviews: jest.fn(),
}));
jest.mock("@/services/saveForLater/getUserSaveForLater", () => ({
  getUserSaveForLater: jest.fn(),
}));
jest.mock("@/services/user/getUserProfile", () => ({
  getUserProfile: jest.fn(),
}));
jest.mock("@/services/auth/logout", () => ({ handleLogout: jest.fn() }));
jest.mock("@expo/vector-icons/Feather", () => "Feather");
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const mockGetUserRecentReviews = getUserRecentReviews as jest.MockedFunction<
  typeof getUserRecentReviews
>;
const mockGetUserSaveForLater = getUserSaveForLater as jest.MockedFunction<
  typeof getUserSaveForLater
>;
const mockGetUserProfile = getUserProfile as jest.MockedFunction<
  typeof getUserProfile
>;

function renderProfile() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Profile />
    </QueryClientProvider>,
  );
}

describe("Profile saved albums", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserProfile.mockResolvedValue({
      uid: "user-123",
      name: "Test Listener",
      email: "listener@example.com",
      photoURL: null,
      reviewsCount: 0,
      listenLaterCount: 1,
    });
    mockGetUserRecentReviews.mockResolvedValue([]);
  });

  it("shows saved album names and artists", async () => {
    mockGetUserSaveForLater.mockResolvedValue([
      {
        albumId: 42,
        title: "Discovery",
        artist: "Daft Punk",
        cover: "https://example.com/discovery.jpg",
        savedAt: "2026-10-18T00:00:00.000Z",
      },
    ]);

    renderProfile();

    expect(await screen.findByText("Discovery")).toBeTruthy();
    expect(screen.getByText("Daft Punk")).toBeTruthy();
  });

  it("lets the user retry loading saved albums after a failure", async () => {
    mockGetUserSaveForLater
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValueOnce([
        {
          albumId: 42,
          title: "Discovery",
          artist: "Daft Punk",
          cover: "https://example.com/discovery.jpg",
          savedAt: "2026-10-18T00:00:00.000Z",
        },
      ]);

    renderProfile();

    expect(
      await screen.findByText("Não foi possível carregar os álbuns salvos."),
    ).toBeTruthy();
    fireEvent.press(screen.getByText("Tentar novamente"));

    await waitFor(() => {
      expect(screen.getByText("Discovery")).toBeTruthy();
    });
    expect(mockGetUserSaveForLater).toHaveBeenCalledTimes(2);
  });
});
