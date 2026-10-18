// src/app/album/[id].tsx
import { Loading } from "@/components/Loading";
import { RatingInput } from "@/components/RatingInput";
import { DesignTokens } from "@/constants/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/contexts/AuthContext";
import { getAlbumById } from "@/services/album/getAlbumById";
import { getIsFavoriteAlbum } from "@/services/album/getIsFavoriteAlbum";
import { toggleSaveForLater } from "@/services/album/toggleSaveForLater";
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
  const [isSavingForLater, setIsSavingForLater] = useState(false);

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
    queryKey: ["album-favorite", user?.uid, Number(id)],
    queryFn: () => getIsFavoriteAlbum(Number(id)),
    enabled: !!user?.uid && !!id,
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
    if (!user || isSavingForLater) return;

    setIsSavingForLater(true);
    try {
      const result = await toggleSaveForLater(data);
      queryClient.setQueryData(
        ["album-favorite", user.uid, Number(id)],
        result.isSaved,
      );

      queryClient.invalidateQueries({
        queryKey: ["save-for-later", user.uid],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-profile", user.uid],
      });
    } catch (e) {
      logger.error("Failed to update save-for-later state", { e });
    } finally {
      setIsSavingForLater(false);
    }
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
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: DesignTokens.spacing.sm,
              }}
            >
              <Text style={styles.artist}>{data.artist.name}</Text>
              <Text style={styles.release}>{data.release_date}</Text>
            </View>

            <View style={styles.ratingSection}>
              {Boolean(review?.rating) && (
                <Text style={styles.reviewLabel}>Sua avaliação</Text>
              )}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                }}
              >
                <RatingInput value={review?.rating} onChange={rateAlbum} />
                <Pressable
                  onPress={saveForLater}
                  disabled={isSavingForLater}
                  style={isSavingForLater ? styles.bookmarkDisabled : undefined}
                >
                  <IconSymbol
                    size={DesignTokens.sizing.icon}
                    name="bookmark.fill"
                    color={
                      isSavedForLater
                        ? DesignTokens.colors.accent
                        : DesignTokens.colors.textMuted
                    }
                  />
                </Pressable>
              </View>
              {Boolean(review?.comment) && (
                <Text style={styles.reviewComment}>
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
    marginTop: DesignTokens.spacing.xxxl,
    textAlign: "center",
    color: DesignTokens.colors.text,
  },
  header: {
    padding: DesignTokens.spacing.lg,
  },
  cover: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: DesignTokens.radii.md,
    marginBottom: DesignTokens.spacing.lg,
  },
  title: {
    fontSize: DesignTokens.typography.title,
    fontWeight: DesignTokens.fontWeight.bold,
    color: DesignTokens.colors.text,
  },
  artist: {
    fontSize: DesignTokens.typography.subtitle,
    color: DesignTokens.colors.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  release: {
    fontSize: DesignTokens.typography.body,
    color: DesignTokens.colors.textMuted,
  },
  ratingSection: {
    marginVertical: DesignTokens.spacing.sm,
  },
  reviewLabel: {
    color: DesignTokens.colors.textSubtle,
    fontSize: DesignTokens.typography.body,
  },
  bookmarkDisabled: {
    opacity: DesignTokens.interaction.disabledOpacity,
  },
  reviewComment: {
    color: DesignTokens.colors.text,
    marginTop: DesignTokens.spacing.xs,
    marginLeft: DesignTokens.spacing.sm,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.subtitle,
    fontWeight: DesignTokens.fontWeight.semibold,
    marginBottom: DesignTokens.spacing.sm,
    color: DesignTokens.colors.text,
  },
  track: {
    flexDirection: "row",
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.sm,
    alignItems: "center",
  },
  trackIndex: {
    width: DesignTokens.sizing.trackIndexWidth,
    color: DesignTokens.colors.textMuted,
  },
  trackTitle: {
    flex: 1,
    color: DesignTokens.colors.text,
  },
  trackDuration: {
    color: DesignTokens.colors.textMuted,
    marginLeft: DesignTokens.spacing.sm,
  },
});
