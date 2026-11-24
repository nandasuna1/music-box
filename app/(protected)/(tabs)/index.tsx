import { SearchBar } from "@/components/SearchBar";
import { DesignTokens } from "@/constants/theme";
import { getTopAlbums } from "@/services/providers/deezer/getTopAlbums";
import { searchAlbums } from "@/services/providers/deezer/searchAlbum";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ITEMS_PER_PAGE = 20;

export default function Home() {
  const router = useRouter();

  const [query, setQuery] = useState("");

  const isSearching = query.length > 0;

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["albums", query],
    queryFn: ({ pageParam }) =>
      isSearching
        ? searchAlbums(query)
        : getTopAlbums(ITEMS_PER_PAGE, pageParam * ITEMS_PER_PAGE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (isSearching) return undefined;

      if (lastPage.length < ITEMS_PER_PAGE) {
        return undefined;
      }

      return allPages.length;
    },
    enabled: !isSearching || query.length >= 2,
  });

  const allAlbums = data?.pages.flat() ?? [];

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
  };

  if (isLoading) {
    return (
      <SafeAreaView>
        <Text style={styles.status}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView>
        <Text style={styles.status}>Erro ao carregar álbuns</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <Text style={styles.heading}>Popular essa semana</Text>
      <SearchBar value={query} onChange={handleSearch} />
      <FlatList
        data={allAlbums}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        renderItem={({ item }) => (
          <Pressable
            style={styles.albumItem}
            onPress={() => router.push(`/album/${item.id}`)}
          >
            <Image
              source={item.cover_medium}
              style={styles.cover}
              contentFit="cover"
              cachePolicy="memory-disk"
            />

            <Text numberOfLines={1} style={styles.albumTitle}>
              {item.title}
            </Text>

            <Text numberOfLines={1} style={styles.artist}>
              {item.artist.name}
            </Text>
          </Pressable>
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage && !isSearching) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              size="large"
              color={DesignTokens.colors.accent}
              style={styles.footer}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = {
  status: {
    color: DesignTokens.colors.text,
    textAlign: "center" as const,
    marginTop: DesignTokens.spacing.xl,
  },
  heading: {
    color: DesignTokens.colors.text,
    fontSize: DesignTokens.typography.title,
    margin: DesignTokens.spacing.sm,
  },
  albumItem: {
    flex: 1,
    margin: DesignTokens.spacing.sm,
  },
  cover: {
    width: "100%" as const,
    aspectRatio: 1,
    borderRadius: DesignTokens.radii.sm,
  },
  albumTitle: {
    fontWeight: DesignTokens.fontWeight.semibold,
    color: DesignTokens.colors.text,
  },
  artist: {
    color: DesignTokens.colors.textSubtle,
  },
  footer: {
    marginVertical: DesignTokens.spacing.xl,
  },
};
