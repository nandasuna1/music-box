import RateAlbum from "@/app/(protected)/album/rate";
import { getReviewByAlbumAndUserId } from "@/services/reviews/getReviewByAlbumAndUserId";
import { upsertAlbumReview } from "@/services/reviews/upsertAlbumReview";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";

const mockRouter = {
  canGoBack: jest.fn(() => true),
  back: jest.fn(),
  replace: jest.fn(),
};

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "firebase-user" } }),
}));
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({
    albumId: "42",
    title: "Test Album",
    artist: "Test Artist",
    cover: "cover-url",
  }),
  useRouter: () => mockRouter,
}));
jest.mock("@/services/reviews/getReviewByAlbumAndUserId", () => ({
  getReviewByAlbumAndUserId: jest.fn(),
}));
jest.mock("@/services/reviews/upsertAlbumReview", () => ({
  upsertAlbumReview: jest.fn(),
}));

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RateAlbum />
    </QueryClientProvider>,
  );
}

describe("Rate album screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.canGoBack.mockReturnValue(true);
    (getReviewByAlbumAndUserId as jest.Mock).mockResolvedValue(null);
    (upsertAlbumReview as jest.Mock).mockResolvedValue({
      id: "review-id",
      album_id: "42",
      rating: 4,
      comment: "Loved it",
    });
  });

  it("lets a user rate and comment on an album, then returns after saving", async () => {
    renderScreen();

    expect(await screen.findByText("Test Album")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Rate 4 out of 5"));
    fireEvent.changeText(screen.getByPlaceholderText("Comentário (opcional)"), "Loved it");
    fireEvent.press(screen.getByText("Salvar avaliação"));

    await waitFor(() => {
      expect(upsertAlbumReview).toHaveBeenCalledWith("42", 4, "Loved it");
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  it("does not submit until the user selects a rating", async () => {
    renderScreen();
    await screen.findByText("Test Album");

    fireEvent.changeText(screen.getByPlaceholderText("Comentário (opcional)"), "A comment");
    fireEvent.press(screen.getByText("Salvar avaliação"));

    expect(upsertAlbumReview).not.toHaveBeenCalled();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it("returns to the album when there is no previous screen", async () => {
    mockRouter.canGoBack.mockReturnValue(false);
    renderScreen();
    await screen.findByText("Test Album");
    fireEvent.press(screen.getByLabelText("Rate 5 out of 5"));
    fireEvent.press(screen.getByText("Salvar avaliação"));

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/album/42"));
  });

  it("shows a recoverable error and stays on the form when saving fails", async () => {
    (upsertAlbumReview as jest.Mock).mockRejectedValue(new Error("offline"));
    renderScreen();
    await screen.findByText("Test Album");
    fireEvent.press(screen.getByLabelText("Rate 5 out of 5"));
    fireEvent.press(screen.getByText("Salvar avaliação"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível salvar sua avaliação. Tente novamente.",
    );
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
