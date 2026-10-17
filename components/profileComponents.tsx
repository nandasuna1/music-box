/* ───────────────────────── COMPONENTS ───────────────────────── */

import { Album, AlbumRating } from "@/types/Album";
import { UserProfile } from "@/types/User";
import Feather from '@expo/vector-icons/Feather';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { RatingInput } from "./RatingInput";

export function ProfilePic({
  avatar,
  user,}: {
  avatar?: string | null;
  user?: UserProfile | null;
}) {
  return (
    <>
      {(avatar || user?.photoURL) ? (
        <Image
          source={{ uri: avatar ?? user?.photoURL ?? undefined }}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Feather name="user" size={24} color="yellow" />
        </View>
      )}
    </>
  );
}

export function HeaderName({ user = null }: { user?: UserProfile | null }) {
  return (
    <View>
      <Text style={styles.name}>{user?.name ?? "Usuário"}</Text>

      <Text style={styles.username}>{user?.email}</Text>
    </View>
  );
}

export function Stat({ value = 0, label }: { value?: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Section({
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

export function HorizontalList({ items }: { items: Album[] }) {
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

export function AlbumCard({ album }: { album: Album }) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: album.cover }}
        style={{ width: 120, aspectRatio: 1, borderRadius: 8 }}
      />
    </View>
  );
}

export function ReviewCard({ item }: { item: AlbumRating }) {
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

export const styles = StyleSheet.create({
  container: {
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
