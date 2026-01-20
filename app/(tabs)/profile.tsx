import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RatingInput } from "@/components/RatingInput";
import { useProfileStore } from "@/storage/store/profileStore";
import { AlbumRating } from "@/types/Album";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const { reviews, listenLater } = useProfileStore();
  const [avatar, setAvatar] = useState<string | null>(null);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={pickImage}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>+</Text>
              </View>
            )}
          </Pressable>

          <View>
            <Text style={styles.name}>Fernanda</Text>
            <Text style={styles.username}>@mandu</Text>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.stats}>
          <Stat value={reviews.length} label="Reviews" />
          <Stat value={listenLater.length} label="To listen" />
        </View>

        {reviews.length > 0 && (
          <Section title="Reviews mais recentes">
            {reviews[0] && <ReviewCard item={reviews[0]} />}
            {reviews[1] && <ReviewCard item={reviews[1]} />}
            {reviews[2] && <ReviewCard item={reviews[2]} />}
          </Section>
        )}

        {/* REVIEWS */}
        <Section title="Albuns avaliados">
          <HorizontalList items={reviews} />
        </Section>

        {/* REVIEWED ALBUMS */}
        <Section title="Ouvir mais tardes">
          <HorizontalList items={reviews} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ───────────────────────── COMPONENTS ───────────────────────── */

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function HorizontalList({ items }: { items: AlbumRating[] }) {
  if (items.length === 0) {
    return <Text style={styles.empty}>Nada por aqui ainda</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {items.map((item) => (
        <AlbumCard key={item.albumId} album={item} />
      ))}
    </ScrollView>
  );
}

function AlbumCard({ album }: { album: AlbumRating }) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: album.cover }}
        style={{ width: 120, aspectRatio: 1, borderRadius: 8 }}
      />
    </View>
  );
}

function ReviewCard({ item }: { item: AlbumRating }) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 8,
        marginVertical: 4,
      }}
    >
      <Image
        source={{ uri: item.cover }}
        style={{ width: "25%", aspectRatio: 1, borderRadius: 8 }}
      />
      <View style={{ flexShrink: 1 }}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            fontWeight: "600",
            color: "#fff",
          }}
        >
          {item.title}
        </Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: "#666" }}>
          {item.artist}
        </Text>
        <RatingInput value={item?.rating} size={12} />
        <Text numberOfLines={2} ellipsizeMode="tail" style={{ color: "#666" }}>
          {item.comment}
        </Text>
      </View>
    </View>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  username: {
    color: "#888",
  },

  /* Stats */
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 32,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#888",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  /* Sections */
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#888",
  },

  /* Cards */
  card: {
    width: 120,
    marginRight: 12,
  },
  cover: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#1f1f1f",
  },

  empty: {
    color: "#888",
    fontStyle: "italic",
  },
});
