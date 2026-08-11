import { SearchBar } from "@/components/SearchBar";
import { getTopAlbums } from "@/services/album/getTopAlbums";
import { searchAlbums } from "@/services/album/searchAlbum";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const router = useRouter();

  const [query, setQuery] = useState("");

  const isSearching = query.length > 0;

  const { data, isLoading, error } = useQuery({
    queryKey: ["albums", query],
    queryFn: () => (isSearching ? searchAlbums(query) : getTopAlbums()),
    enabled: !isSearching || query.length >= 2,
  });

  if (isLoading) {
    return <Text>Carregando...</Text>;
  }

  if (error) {
    return <Text>Erro ao carregar álbuns</Text>;
  }

  return (
    <SafeAreaView>
      <Text style={{ color: "#fff", fontSize: 24, margin: 8 }}>
        Popular essa semana
      </Text>
      <SearchBar value={query} onChange={setQuery} />
      <FlatList
        data={data}
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
      />
    </SafeAreaView>
  );
}
