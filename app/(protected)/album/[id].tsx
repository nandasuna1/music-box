// src/app/album/[id].tsx
import { Loading } from "@/components/Loading";
import { RatingInput } from "@/components/RatingInput";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/contexts/AuthContext";
import { getAlbumById } from "@/services/album/getAlbumById";
import { getIsFavoriteAlbum } from "@/services/album/getIsFavoriteAlbum";
import { upsertSaveForLater } from "@/services/album/upsertSaveForLater";
import { getUserAlbumReview } from "@/services/user/getUserAlbumReview";
import { formatDuration } from "@/utils/dataFormatter";
import { logger } from "@/utils/logger";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function AlbumDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const [saveForLaterOptimistic, setSaveForLaterOptimistic] = useState(false);

  const queryClient = useQueryClient();

  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: review } = useQuery({
    queryKey: ["album-review", user?.uid, Number(id)],
    queryFn: () => getUserAlbumReview(Number(id)),
    enabled: !!user && !!id,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["album", id],
    queryFn: () => getAlbumById(id),
    enabled: !!id,
  });

  const { data: isSavedForLater } = useQuery({
    queryKey: ["album-favorite", id],
    queryFn: () => getIsFavoriteAlbum(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return <Loading />;
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

  const saveForLater = async () => {
    if (!user) return;

    try {
      setSaveForLaterOptimistic(true);
      const savedForLater = await upsertSaveForLater(data);

      queryClient.setQueryData(
        ["save-for-later", user?.uid, Number(id)],
        savedForLater,
      );

      queryClient.invalidateQueries({
        queryKey: ["user-profile", user?.uid],
      });
    } catch (e) {
      logger.error("Failed to update save-for-later state", { e });
      setSaveForLaterOptimistic(false);
    }
    // continuar com base no rate.tsx/handleSave
  };

  return (
    <>
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
              {Boolean(review?.rating) && (
                <Text style={{ color: "#666", fontSize: 16 }}>
                  Sua avaliação
                </Text>
              )}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  height: "auto",
                  padding: 0,
                }}
              >
                <RatingInput value={review?.rating} onChange={rateAlbum} />
                <Pressable onPress={saveForLater}>
                  <IconSymbol
                    size={28}
                    name="bookmark.fill"
                    color={
                      isSavedForLater || saveForLaterOptimistic
                        ? "#f3d61d"
                        : "#8a8a8a"
                    }
                  />
                </Pressable>
              </View>
              {Boolean(review?.comment) && (
                <Text style={{ color: "#fff", marginTop: 4, marginLeft: 8 }}>
                  Voce achou: &quot;{review?.comment}&quot;
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
