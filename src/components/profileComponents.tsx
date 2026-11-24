/* ───────────────────────── COMPONENTS ───────────────────────── */

import { DesignTokens } from "@/constants/theme";
import { User } from "@/features/user/user.types";
import { Album, AlbumRating } from "@/types/Album";
import { logger } from "@/utils/logger/logger";
import Feather from "@expo/vector-icons/Feather";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { RatingInput } from "./RatingInput";

export function ProfilePic({
  avatar,
  userUrl,
}: {
  avatar?: string | null;
  userUrl?: string | null;
}) {
  logger.log("ProfilePic avatar:", userUrl);
  return (
    <>
      {avatar || userUrl ? (
        <Image
          source={{ uri: avatar ?? userUrl ?? undefined }}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Feather
            name="user"
            size={DesignTokens.typography.title}
            color={DesignTokens.colors.accent}
          />
        </View>
      )}
    </>
  );
}

export function HeaderName({ user = null }: { user?: User | null }) {
  return (
    <View>
      <Text style={styles.name}>{user?.name ?? "Usuário"}</Text>

      {/* <Text style={styles.username}>{user?.email}</Text> */}
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
      {album.cover && (
        <Image source={{ uri: album.cover }} style={styles.albumCover} />
      )}
      <Text numberOfLines={1} style={styles.savedAlbumTitle}>
        {album.title}
      </Text>
      <Text numberOfLines={1} style={styles.savedAlbumArtist}>
        {album.artist}
      </Text>
    </View>
  );
}

export function ReviewCard({ item }: { item: AlbumRating }) {
  return (
    <View style={styles.reviewCard}>
      {item.cover && (
        <Image source={{ uri: item.cover }} style={styles.reviewCover} />
      )}
      <View style={styles.reviewContent}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.reviewTitle}>
          {item.title}
        </Text>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.reviewArtist}
        >
          {item.artist}
        </Text>
        <RatingInput
          value={item?.rating}
          size={DesignTokens.sizing.compactRatingStar}
        />
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={styles.reviewComment}
        >
          {item.comment}
        </Text>
      </View>
    </View>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

export const styles = StyleSheet.create({
  container: {
    padding: DesignTokens.spacing.lg,
  },
  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.xl,
  },
  avatar: {
    width: DesignTokens.sizing.avatar,
    height: DesignTokens.sizing.avatar,
    borderRadius: DesignTokens.radii.avatar,
  },
  avatarPlaceholder: {
    backgroundColor: DesignTokens.colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: DesignTokens.colors.text,
    fontSize: DesignTokens.typography.title,
    fontWeight: DesignTokens.fontWeight.bold,
  },
  name: {
    fontSize: DesignTokens.typography.section,
    fontWeight: DesignTokens.fontWeight.bold,
    color: DesignTokens.colors.text,
  },
  username: {
    color: DesignTokens.colors.textMuted,
  },

  /* Stats */
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: DesignTokens.spacing.xxl,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: DesignTokens.typography.title,
    fontWeight: DesignTokens.fontWeight.bold,
    color: DesignTokens.colors.textMuted,
  },
  statLabel: {
    fontSize: DesignTokens.typography.caption,
    color: DesignTokens.colors.textSubtle,
    marginTop: DesignTokens.spacing.xxs,
  },

  /* Sections */
  section: {
    marginBottom: DesignTokens.spacing.xxl,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.body,
    fontWeight: DesignTokens.fontWeight.semibold,
    marginBottom: DesignTokens.spacing.md,
    color: DesignTokens.colors.textMuted,
  },

  /* Cards */
  card: {
    width: DesignTokens.sizing.albumArtwork,
    marginRight: DesignTokens.spacing.md,
  },
  cover: {
    width: DesignTokens.sizing.albumArtwork,
    height: DesignTokens.sizing.albumArtwork,
    borderRadius: DesignTokens.radii.sm,
    backgroundColor: DesignTokens.colors.surfaceElevated,
  },

  empty: {
    color: DesignTokens.colors.textMuted,
    fontStyle: "italic",
  },
  albumCover: {
    width: DesignTokens.sizing.albumArtwork,
    aspectRatio: 1,
    borderRadius: DesignTokens.radii.sm,
  },
  savedAlbumTitle: {
    color: DesignTokens.colors.text,
    fontWeight: DesignTokens.fontWeight.semibold,
    marginTop: DesignTokens.spacing.xs,
  },
  savedAlbumArtist: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.caption,
  },
  reviewCard: {
    flexDirection: "row",
    gap: DesignTokens.spacing.sm,
    marginVertical: DesignTokens.spacing.xs,
  },
  reviewCover: {
    width: "25%",
    aspectRatio: 1,
    borderRadius: DesignTokens.radii.sm,
  },
  reviewContent: {
    flexShrink: 1,
  },
  reviewTitle: {
    fontWeight: DesignTokens.fontWeight.semibold,
    color: DesignTokens.colors.text,
  },
  reviewArtist: {
    color: DesignTokens.colors.textMuted,
  },
  reviewComment: {
    color: DesignTokens.colors.textMuted,
  },
});
