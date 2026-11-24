import AlbumDetail from "@/app/(protected)/album/[id]";
import Home from "@/app/(protected)/(tabs)";
import Profile from "@/app/(protected)/(tabs)/profile";
import RateAlbum from "@/app/(protected)/album/rate";
import { addToListenLater, isInListenLater } from "@/features/listen-later/services";
import { getListenLaterByUserId } from "@/features/listen-later/services/getListenLaterByUserId";
import { getAlbumById } from "@/services/providers/deezer/getAlbumById";
import { getTopAlbums } from "@/services/providers/deezer/getTopAlbums";
import { searchAlbums } from "@/services/providers/deezer/searchAlbum";
import { getReviewByAlbumAndUserId } from "@/services/reviews/getReviewByAlbumAndUserId";
import { getReviewsByUserId } from "@/services/reviews/getReviewsByUserId";
import { upsertAlbumReview } from "@/services/reviews/upsertAlbumReview";
import { getUserById } from "@/services/user/getUserById";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  canGoBack: jest.fn(() => true),
};

const album = {
  id: 42,
  title: "Test Album",
  cover_medium: "cover-url",
  cover_big: "cover-url",
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
let savedReview: Record<string, unknown> | null = null;

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "firebase-user" } }),
}));
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({
    id: "42",
    albumId: "42",
    title: "Test Album",
    artist: "Test Artist",
    cover: "cover-url",
  }),
}));
jest.mock("expo-image", () => ({ Image: "Image" }));
jest.mock("react-native-safe-area-context", () => ({
  ...jest.requireActual("react-native-safe-area-context"),
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock("@/services/providers/deezer/getTopAlbums", () => ({
  getTopAlbums: jest.fn(),
}));
jest.mock("@/services/providers/deezer/searchAlbum", () => ({
  searchAlbums: jest.fn(),
}));
jest.mock("@/services/providers/deezer/getAlbumById", () => ({
  getAlbumById: jest.fn(),
}));
jest.mock("@/services/reviews/getReviewByAlbumAndUserId", () => ({
  getReviewByAlbumAndUserId: jest.fn(),
}));
jest.mock("@/services/reviews/upsertAlbumReview", () => ({
  upsertAlbumReview: jest.fn(),
}));
jest.mock("@/services/reviews/getReviewsByUserId", () => ({
  getReviewsByUserId: jest.fn(),
}));
jest.mock("@/services/user/getUserById", () => ({
  getUserById: jest.fn(),
}));
jest.mock("@/services/auth/logout", () => ({
  handleLogout: jest.fn(),
}));
jest.mock("@/features/listen-later/services", () => ({
  addToListenLater: jest.fn(),
  isInListenLater: jest.fn(),
  removeFromListenLater: jest.fn(),
}));
jest.mock("@/features/listen-later/services/getListenLaterByUserId", () => ({
  getListenLaterByUserId: jest.fn(),
}));
jest.mock("@/utils/logger/logger", () => ({
  logger: { log: jest.fn(), error: jest.fn() },
}));

function renderScreen(screenComponent: React.ReactElement, queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      {screenComponent}
    </QueryClientProvider>,
  );
}

describe("authenticated album journey", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    savedForLater = false;
    savedReview = null;
    mockRouter.canGoBack.mockReturnValue(true);
    (getTopAlbums as jest.Mock).mockResolvedValue([album]);
    (searchAlbums as jest.Mock).mockResolvedValue([]);
    (getAlbumById as jest.Mock).mockResolvedValue(album);
    (getReviewByAlbumAndUserId as jest.Mock).mockImplementation(
      async () => savedReview,
    );
    (isInListenLater as jest.Mock).mockImplementation(async () => savedForLater);
    (addToListenLater as jest.Mock).mockImplementation(async () => {
      savedForLater = true;
      return true;
    });
    (upsertAlbumReview as jest.Mock).mockImplementation(
      async (albumId: string, rating: number, comment: string) => {
        savedReview = {
          id: "review-id",
          albumId,
          rating,
          comment,
          userId: "firebase-user",
        };
        return savedReview;
      },
    );
    (getUserById as jest.Mock).mockResolvedValue({
      id: "firebase-user",
      name: "Listener",
      avatar_url: null,
    });
    (getReviewsByUserId as jest.Mock).mockImplementation(async () =>
      savedReview
        ? [{
            albumId: 42,
            title: "Test Album",
            artist: "Test Artist",
            cover: "cover-url",
            rating: savedReview.rating,
            comment: savedReview.comment,
            ratedAt: "2026-01-01",
          }]
        : [],
    );
    (getListenLaterByUserId as jest.Mock).mockImplementation(async () =>
      savedForLater
        ? [{
            albumId: "42",
            title: "Test Album",
            artist: "Test Artist",
            cover: "cover-url",
          }]
        : [],
    );
  });

  it("lets a user browse, save, review, and see the album on their profile", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });

    const home = renderScreen(<Home />, queryClient);
    expect(await screen.findByText("Test Album")).toBeTruthy();
    fireEvent.press(screen.getByText("Test Album"));
    expect(mockRouter.push).toHaveBeenCalledWith("/album/42");
    home.unmount();

    const detail = renderScreen(<AlbumDetail />, queryClient);
    expect(await screen.findByText("First Track")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Save to Listen Later"));
    expect(await screen.findByLabelText("Remove from Listen Later")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Rate 4 out of 5"));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.objectContaining({
      pathname: "/album/rate",
      params: expect.objectContaining({ albumId: 42 }),
    }));
    detail.unmount();

    const rate = renderScreen(<RateAlbum />, queryClient);
    expect(await screen.findByText("Test Album")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Rate 5 out of 5"));
    fireEvent.changeText(screen.getByPlaceholderText("Comentário (opcional)"), "A favorite");
    fireEvent.press(screen.getByText("Salvar avaliação"));
    await waitFor(() => {
      expect(upsertAlbumReview).toHaveBeenCalledWith("42", 5, "A favorite");
      expect(mockRouter.back).toHaveBeenCalled();
    });
    rate.unmount();

    renderScreen(<Profile />, queryClient);
    expect(await screen.findAllByText("Test Album")).toHaveLength(2);
    expect(screen.getAllByText("Test Artist")).toHaveLength(2);
    expect(screen.getByText("A favorite")).toBeTruthy();
  });
});
