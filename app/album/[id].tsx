// src/app/album/[id].tsx
import { RatingInput } from "@/components/RatingInput";
import { getAlbumById } from "@/services/getAlbumById";
import { useProfileStore } from "@/storage/store/profileStore";
import { formatDuration } from "@/utils/dataFormatter";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AlbumDetail() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();

  const review = useProfileStore((profileStore) =>
    profileStore.getReviewByAlbumId(Number(id)),
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["album", id],
    queryFn: () => getAlbumById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <Text style={styles.center}>Carregando...</Text>;
  }

  if (error || !data) {
    return <Text style={styles.center}>Erro ao carregar álbum</Text>;
  }

  const rateAlbum = () => {
    router.push({
      pathname: "/album/rate",
      params: {
        albumId: data.id,
        title: data.title,
        artist: data.artist.name,
        cover: data.cover_big,
      },
    });
  };

  return (
    <>
      <SafeAreaView>
        <FlatList
          data={data.tracks.data}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <View style={styles.header}>
              <Image source={{ uri: data.cover_big }} style={styles.cover} />

              <Text style={styles.title}>{data.title}</Text>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.artist}>{data.artist.name}</Text>
                <Text style={styles.release}>{data.release_date}</Text>
              </View>

              <View style={{ marginVertical: 8 }}>
                <Text style={{ color: "#666", fontSize: 16 }}>
                  Sua avaliação
                </Text>
                <RatingInput value={review?.rating} onChange={rateAlbum} />
                {review?.comment && (
                  <Text style={{ color: "#fff", marginTop: 4, marginLeft: 8 }}>
                    Voce achou: "{review.comment}"
                  </Text>
                )}
              </View>

              <Text style={styles.sectionTitle}>Faixas</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.track}>
              <Text style={styles.trackIndex}>{index + 1}.</Text>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.trackDuration}>
                {formatDuration(item.duration)}
              </Text>
            </View>
          )}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    marginTop: 40,
    textAlign: "center",
  },
  header: {
    padding: 16,
  },
  cover: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  artist: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 4,
  },
  release: {
    fontSize: 14,
    color: "#999",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#fff",
  },
  track: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  trackIndex: {
    width: 24,
    color: "#999",
  },
  trackTitle: {
    flex: 1,
    color: "#fff",
  },
  trackDuration: {
    color: "#999",
    marginLeft: 8,
  },
});
