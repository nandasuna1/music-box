// app/album/rate.tsx
import { RatingInput } from "@/components/RatingInput";
import { useAuth } from "@/contexts/AuthContext";
import { upsertReview } from "@/services/reviews/upsertReview";
import { getUserAlbumReview } from "@/services/user/getUserAlbumReview";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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

  // 🔎 Busca a review específica desse álbum
  const { data: existingReview } = useQuery({
    queryKey: ["album-review", user?.uid, numericAlbumId],
    queryFn: () => getUserAlbumReview(numericAlbumId),
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
      const savedReview = await upsertReview({
        albumId: numericAlbumId,
        title,
        artist,
        cover,
        rating,
        comment,
        ratedAt: new Date().toISOString(),
      });

      // ✅ Atualiza cache da review do álbum imediatamente
      queryClient.setQueryData(
        ["album-review", user.uid, numericAlbumId],
        savedReview,
      );

      // 🔄 Mantém consistência global
      queryClient.invalidateQueries({
        queryKey: ["user-recent-reviews", user.uid],
      });

      queryClient.invalidateQueries({
        queryKey: ["user-profile", user.uid],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      router.canGoBack() ? router.back() : router.replace(`/album/${albumId}`);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.artist}>{artist}</Text>

      <RatingInput value={rating} onChange={setRating} />

      <TextInput
        placeholder="Comentário (opcional)"
        placeholderTextColor="#666"
        value={comment}
        onChangeText={setComment}
        multiline
        style={styles.input}
      />

      <Pressable onPress={handleSave} disabled={loading}>
        <Text>{loading ? "Salvando Avaliação" : "Salvar avaliação"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    backgroundColor: "#000",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  artist: {
    color: "#888",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 8,
    marginVertical: 12,
    minHeight: 80,
    color: "#fff",
  },
});
