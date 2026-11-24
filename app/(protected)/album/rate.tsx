// app/album/rate.tsx
import { Button } from "@/components/Button";
import { RatingInput } from "@/components/RatingInput";
import { TextField } from "@/components/TextField";
import { DesignTokens } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getReviewByAlbumAndUserId } from "@/services/reviews/getReviewByAlbumAndUserId";
import { upsertAlbumReview } from "@/services/reviews/upsertAlbumReview";
import { logger } from "@/utils/logger";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function RateAlbum() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const { albumId, title, artist, cover } = useLocalSearchParams<{
    albumId: string;
    title: string;
    artist: string;
    cover: string;
  }>();

  const numericAlbumId = Number(albumId);
  const queryClient = useQueryClient();

  const { data: existingReview } = useQuery({
    queryKey: ["album-review", user?.uid, numericAlbumId],
    queryFn: () => getReviewByAlbumAndUserId(albumId),
    enabled: !!user && !!albumId,
  });

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // 🧠 preenche caso já exista review
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment ?? "");
    }
  }, [existingReview]);

  async function handleSave() {
    if (!albumId || rating === 0 || !user) return;

    setLoading(true);

    try {
      const savedReview = await upsertAlbumReview(albumId, rating, comment);

      queryClient.setQueryData(
        ["album-review", user.uid, numericAlbumId],
        savedReview,
      );

      queryClient.invalidateQueries({
        queryKey: ["user-recent-reviews", user.uid],
      });

    } catch (err) {
      logger.error("Failed to save review", { err });
    } finally {
      setLoading(false);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/album/${albumId}`);
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.artist}>{artist}</Text>

      <RatingInput value={rating} onChange={setRating} />

      <TextField
        placeholder="Comentário (opcional)"
        value={comment}
        onChangeText={setComment}
        multiline
        style={styles.input}
      />

      <Button
        onPress={handleSave}
        loading={loading}
        loadingText="Salvando Avaliação"
        style={styles.submit}
      >
        Salvar avaliação
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: DesignTokens.spacing.xl,
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  title: {
    fontSize: DesignTokens.typography.subtitle,
    fontWeight: DesignTokens.fontWeight.bold,
    color: DesignTokens.colors.text,
  },
  artist: {
    color: DesignTokens.colors.textMuted,
    marginBottom: DesignTokens.spacing.lg,
  },
  input: {
    minHeight: DesignTokens.sizing.commentFieldMinHeight,
    marginVertical: DesignTokens.spacing.md,
    textAlignVertical: "top",
  },
  submit: {
    marginTop: "auto",
  },
});
