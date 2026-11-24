// src/app/album/[id].tsx
import { Loading } from "@/components/Loading";
import { RatingInput } from "@/components/RatingInput";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DesignTokens } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { addToListenLater, isInListenLater, removeFromListenLater } from "@/features/listen-later/services";
import { getAlbumById } from "@/services/providers/deezer/getAlbumById";
import { getReviewByAlbumAndUserId } from "@/services/reviews/getReviewByAlbumAndUserId";
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

  const { id: albumId } = useLocalSearchParams<{ id: string }>();

  const { data: review } = useQuery({
    queryKey: ["album-review", user?.uid, Number(albumId)],
    queryFn: () => getReviewByAlbumAndUserId(albumId),
    enabled: !!user && !!albumId,
  });

  const { data: album, isLoading, error } = useQuery({
    queryKey: ["album", albumId],
    queryFn: () => getAlbumById(albumId),
    enabled: !!albumId,
  });

  const { data: isSavedForLater } = useQuery({
    queryKey: ["is-listen-later", user?.uid, Number(albumId)],
    queryFn: () => isInListenLater(Number(albumId)),
    enabled: !!user && !!albumId,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error || !album) {
    return <Text style={styles.center}>Erro ao carregar álbum</Text>;
  }

  const rateAlbum = () => {
    router.push({
      pathname: "/album/rate",
      params: {
        albumId: album.id,
        title: album.title,
        artist: album.artist.name,
        cover: album.cover_big,
      },
    });
  };

  const saveForLater = async () => {
    if (!user || isSavingForLater) return;
    setIsSavingForLater(true);

    try {
      if (!isSavedForLater) {
          await addToListenLater({...album, genre_id: album.genre_id});
      } else {
        await removeFromListenLater(album.id);
      }

      queryClient.invalidateQueries({
        queryKey: ["is-listen-later", user.uid],
      });
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
        data={album?.tracks.data}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={styles.header}>
            <Image source={{ uri: album?.cover_big }} style={styles.cover} />

            <Text style={styles.title}>{album?.title}</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: DesignTokens.spacing.sm,
              }}
            >
              <Text style={styles.artist}>{album?.artist.name}</Text>
              <Text style={styles.release}>{album?.release_date}</Text>
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
