import Home from "@/app/(protected)/(tabs)";
import { getTopAlbums } from "@/services/album/getTopAlbums";
import { searchAlbums } from "@/services/album/searchAlbum";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";

// Mock das dependências externas
jest.mock("@/services/album/getTopAlbums");
jest.mock("@/services/album/searchAlbum");
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

// Mock de expo-image para evitar alertas no ambiente de testes do React Native
jest.mock("expo-image", () => ({
  Image: "Image",
}));

const mockGetTopAlbums = getTopAlbums as jest.MockedFunction<
  typeof getTopAlbums
>;
const mockSearchAlbums = searchAlbums as jest.MockedFunction<
  typeof searchAlbums
>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const mockPush = jest.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Desabilita retentativas em testes para falhar rapidamente
      },
    },
  });

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

const mockAlbumsList = [
  {
    id: 1,
    title: "Abbey Road",
    cover_medium: "https://example.com/abbey.jpg",
    artist: { name: "The Beatles" },
  },
  {
    id: 2,
    title: "Dark Side of the Moon",
    cover_medium: "https://example.com/darksidemoon.jpg",
    artist: { name: "Pink Floyd" },
  },
];

describe("Home Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as any);
  });

  // it("exibe o estado de carregamento e depois lista os álbuns mais populares", async () => {
  //   mockGetTopAlbums.mockResolvedValue(mockAlbumsList as any);

  //   renderWithClient(<Home />);

  //   // Verifica se o estado de carregamento é exibido inicialmente
  //   expect(screen.getByText("Carregando...")).toBeTruthy();

  //   // Espera que a lista de álbuns seja renderizada
  //   await waitFor(() => {
  //     expect(screen.getByText("Abbey Road")).toBeTruthy();
  //     expect(screen.getByText("The Beatles")).toBeTruthy();
  //     expect(screen.getByText("Dark Side of the Moon")).toBeTruthy();
  //     expect(screen.getByText("Pink Floyd")).toBeTruthy();
  //   });

  //   expect(mockGetTopAlbums).toHaveBeenCalledTimes(1);
  // });

  it("exibe mensagem de erro caso a busca de álbuns falhe", async () => {
    mockGetTopAlbums.mockRejectedValue(new Error("Erro de rede"));

    renderWithClient(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Erro ao carregar álbuns")).toBeTruthy();
    });
  });

  it("busca por álbuns quando o usuário digita 2 ou mais caracteres no SearchBar", async () => {
    const searchResults = [
      {
        id: 3,
        title: "Random Access Memories",
        cover_medium: "https://example.com/ram.jpg",
        artist: { name: "Daft Punk" },
      },
    ];

    mockGetTopAlbums.mockResolvedValue(mockAlbumsList as any);
    mockSearchAlbums.mockResolvedValue(searchResults as any);

    renderWithClient(<Home />);

    // Aguarda carregar os álbuns iniciais
    await waitFor(() => {
      expect(screen.getByText("Abbey Road")).toBeTruthy();
    });

    // Simula a digitação no SearchBar
    const searchInput = screen.getByTestId("search-bar-input");
    fireEvent.changeText(searchInput, "Daft");

    // Verifica se os novos resultados são exibidos na tela
    await waitFor(() => {
      expect(screen.getByText("Random Access Memories")).toBeTruthy();
      expect(screen.getByText("Daft Punk")).toBeTruthy();
    });

    expect(mockSearchAlbums).toHaveBeenCalledWith("Daft");
  });

  it("não chama a busca da API se a query tiver apenas 1 caractere", async () => {
    mockGetTopAlbums.mockResolvedValue(mockAlbumsList as any);

    renderWithClient(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Abbey Road")).toBeTruthy();
    });

    const searchInput = screen.getByTestId("search-bar-input");
    fireEvent.changeText(searchInput, "D");

    // Permanece habilitado o estado sem chamar a API de busca
    expect(mockSearchAlbums).not.toHaveBeenCalled();
  });

  it("navega para a tela de detalhes do álbum ao clicar em um item da lista", async () => {
    mockGetTopAlbums.mockResolvedValue(mockAlbumsList as any);

    renderWithClient(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Abbey Road")).toBeTruthy();
    });

    // Clica no álbum
    fireEvent.press(screen.getByText("Abbey Road"));

    // Verifica se a rota de navegação do expo-router foi disparada corretamente
    expect(mockPush).toHaveBeenCalledWith("/album/1");
  });

  it("exibe o estado de carregamento e depois lista os álbuns mais populares", async () => {
    mockGetTopAlbums.mockResolvedValue(mockAlbumsList as any);

    renderWithClient(<Home />);

    expect(screen.getByText("Carregando...")).toBeTruthy();

    await waitFor(() => {
      expect(mockGetTopAlbums).toHaveBeenCalledTimes(1);
    });

    console.log(
      "getTopAlbums calls:",
      JSON.stringify(mockGetTopAlbums.mock.calls),
    );

    console.log(
      "getTopAlbums results:",
      JSON.stringify(mockGetTopAlbums.mock.results),
    );

    await waitFor(() => {
      expect(screen.getByText("Abbey Road")).toBeTruthy();
    });
  });
});
