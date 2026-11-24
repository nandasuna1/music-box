import AlbumDetail from "@/app/(protected)/album/[id]";
import { addToListenLater, isInListenLater, removeFromListenLater } from "@/features/listen-later/services";
import { getAlbumById } from "@/services/providers/deezer/getAlbumById";
import { getReviewByAlbumAndUserId } from "@/services/reviews/getReviewByAlbumAndUserId";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "firebase-user" } }),
}));
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "42" }),
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/services/providers/deezer/getAlbumById", () => ({
  getAlbumById: jest.fn(),
}));
jest.mock("@/services/reviews/getReviewByAlbumAndUserId", () => ({
  getReviewByAlbumAndUserId: jest.fn(),
}));
jest.mock("@/features/listen-later/services", () => ({
  addToListenLater: jest.fn(),
  isInListenLater: jest.fn(),
  removeFromListenLater: jest.fn(),
}));

const album = {
  id: 42,
  title: "Test Album",
  cover_big: "cover-url",
  cover_medium: "cover-url",
  artist: { id: 7, name: "Test Artist", picture_small: "artist-url" },
  contributors: [],
  created_at: "2026-01-01",
  genre_id: 1,
  link_url: "album-link",
  share_url: "share-link",
  release_date: "01/2026",
  tracks: { data: [{ id: 1, title: "First Track", duration: 185 }] },
};
let savedForLater = false;

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AlbumDetail />
    </QueryClientProvider>,
  );
}

describe("Album detail screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAlbumById as jest.Mock).mockResolvedValue(album);
    (getReviewByAlbumAndUserId as jest.Mock).mockResolvedValue(null);
    savedForLater = false;
    (isInListenLater as jest.Mock).mockImplementation(async () => savedForLater);
    (addToListenLater as jest.Mock).mockImplementation(async () => {
      savedForLater = true;
      return true;
    });
    (removeFromListenLater as jest.Mock).mockImplementation(async () => {
      savedForLater = false;
      return true;
    });
  });

  it("shows album details and tracks even when the user has not reviewed it", async () => {
    renderScreen();

    expect(await screen.findByText("Test Album")).toBeTruthy();
    expect(screen.getByText("Test Artist")).toBeTruthy();
    expect(screen.getByText("First Track")).toBeTruthy();
    expect(screen.queryByText("Sua avaliação")).toBeNull();
  });

  it("saves the album for later and shows the action as removable", async () => {
    renderScreen();
    await screen.findByText("Test Album");

    fireEvent.press(screen.getByLabelText("Save to Listen Later"));

    await waitFor(() => {
      expect(addToListenLater).toHaveBeenCalledWith(
        expect.objectContaining({ id: 42 }),
      );
    });
    expect(await screen.findByLabelText("Remove from Listen Later")).toBeTruthy();
  });

  it("removes an album that is already saved", async () => {
    savedForLater = true;
    renderScreen();
    await screen.findByText("Test Album");

    fireEvent.press(await screen.findByLabelText("Remove from Listen Later"));

    await waitFor(() => {
      expect(removeFromListenLater).toHaveBeenCalledWith(42);
    });
    expect(await screen.findByLabelText("Save to Listen Later")).toBeTruthy();
  });

  it("shows an error when album details cannot be loaded", async () => {
    (getAlbumById as jest.Mock).mockRejectedValue(new Error("network error"));
    renderScreen();

    expect(await screen.findByText("Erro ao carregar álbum")).toBeTruthy();
  });
});
