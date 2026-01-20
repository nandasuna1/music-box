// app/album/rate.tsx
import { RatingInput } from "@/components/RatingInput";
import { useProfileStore } from "@/storage/store/profileStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function RateAlbum() {
  const router = useRouter();
  const { albumId, title, artist, cover } = useLocalSearchParams<{
    albumId: string;
    title: string;
    artist: string;
    cover: string;
  }>();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const review = useProfileStore((s) =>
      s.getReviewByAlbumId(Number(albumId)),
    );

    if (review) {
      setRating(review.rating);
      setComment(review.comment ?? "");
    }
  }, [albumId]);

  async function handleSave() {
    if (!albumId || rating === 0) return;

    const upsertReview = useProfileStore((store) => store.upsertReview);

    upsertReview({
      albumId: Number(albumId),
      rating,
      comment,
      ratedAt: new Date().toISOString(),
      artist,
      cover,
      title,
    });

    router.back();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.artist}>{artist}</Text>

      <RatingInput value={rating} onChange={setRating} />

      <TextInput
        placeholder="Comentário (opcional)"
        value={comment}
        onChangeText={setComment}
        multiline
        style={styles.input}
      />

      <Button title="Salvar avaliação" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  artist: {
    color: "#666",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 8,
    marginVertical: 12,
    minHeight: 80,
    color: "#fff",
  },
});
