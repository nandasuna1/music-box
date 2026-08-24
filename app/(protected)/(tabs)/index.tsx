import { SearchBar } from "@/components/SearchBar";
import { getTopAlbums } from "@/services/album/getTopAlbums";
import { searchAlbums } from "@/services/album/searchAlbum";
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
        <Text style={{ color: "#fff", textAlign: "center", marginTop: 20 }}>
          Carregando...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView>
        <Text style={{ color: "#fff", textAlign: "center", marginTop: 20 }}>
          Erro ao carregar álbuns
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <Text style={{ color: "#fff", fontSize: 24, margin: 8 }}>
        Popular essa semana
      </Text>
      <SearchBar value={query} onChange={handleSearch} />
      <FlatList
        data={allAlbums}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        renderItem={({ item }) => (
          <Pressable
            style={{ flex: 1, margin: 8 }}
            onPress={() => router.push(`/album/${item.id}`)}
          >
            <Image
              source={item.cover_medium}
              style={{ width: "100%", aspectRatio: 1, borderRadius: 8 }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />

            <Text
              numberOfLines={1}
              style={{ fontWeight: "600", color: "#fff" }}
            >
              {item.title}
            </Text>

            <Text numberOfLines={1} style={{ color: "#666" }}>
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
              color="#fff"
              style={{ marginVertical: 20 }}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
