import Profile from "@/app/(protected)/(tabs)/profile";
import { getListenLaterByUserId } from "@/features/listen-later/services/getListenLaterByUserId";
import { getReviewsByUserId } from "@/services/reviews/getReviewsByUserId";
import { getUserById } from "@/services/user/getUserById";
import { render, screen } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "firebase-user" } }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock("@/services/user/getUserById", () => ({
  getUserById: jest.fn(),
}));
jest.mock("@/services/reviews/getReviewsByUserId", () => ({
  getReviewsByUserId: jest.fn(),
}));
jest.mock("@/features/listen-later/services/getListenLaterByUserId", () => ({
  getListenLaterByUserId: jest.fn(),
}));
jest.mock("@/services/auth/logout", () => ({
  handleLogout: jest.fn(),
}));
jest.mock("@/utils/logger/logger", () => ({
  logger: { log: jest.fn(), error: jest.fn() },
}));

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Profile />
    </QueryClientProvider>,
  );
}

describe("Profile screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUserById as jest.Mock).mockResolvedValue({
      id: "firebase-user",
      name: "Listener",
      avatar_url: null,
    });
    (getReviewsByUserId as jest.Mock).mockResolvedValue([]);
    (getListenLaterByUserId as jest.Mock).mockResolvedValue([]);
  });

  it("shows saved albums and recent reviews returned for the user", async () => {
    (getReviewsByUserId as jest.Mock).mockResolvedValue([{
      albumId: 99,
      title: "Reviewed Record",
      artist: "Review Artist",
      cover: "review-cover",
      rating: 5,
      comment: "Fantastic",
      ratedAt: "2026-01-01",
    }]);
    (getListenLaterByUserId as jest.Mock).mockResolvedValue([{
      albumId: "42",
      title: "Saved Record",
      artist: "Saved Artist",
      cover: "saved-cover",
    }]);

    renderScreen();

    expect(await screen.findByText("Listener")).toBeTruthy();
    expect(screen.getByText("Saved Record")).toBeTruthy();
    expect(screen.getByText("Saved Artist")).toBeTruthy();
    expect(screen.getByText("Reviewed Record")).toBeTruthy();
    expect(screen.getByText("Fantastic")).toBeTruthy();
    expect(screen.getAllByText("1")).toHaveLength(2);
  });

  it("shows empty states when the user has no saved albums or reviews", async () => {
    renderScreen();

    expect(await screen.findByText("Nenhuma review ainda")).toBeTruthy();
    expect(screen.getByText("Nada por aqui ainda")).toBeTruthy();
    expect(screen.getAllByText("0")).toHaveLength(2);
  });

  it("shows a recoverable error when saved albums cannot be loaded", async () => {
    (getListenLaterByUserId as jest.Mock).mockRejectedValue(new Error("offline"));

    renderScreen();

    expect(await screen.findByText("Não foi possível carregar os álbuns salvos.")).toBeTruthy();
    expect(screen.getByText("Tentar novamente")).toBeTruthy();
  });
});
